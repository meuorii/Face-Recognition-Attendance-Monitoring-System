import os
import cv2
import numpy as np
import torch
import torch.nn as nn
import torchvision.transforms as transforms
from torchvision import models
from PIL import Image
from collections import OrderedDict
from typing import Tuple, Dict

# =========================
# Config (edit if needed)
# =========================
DEFAULT_MODEL_PATH = "models/anti_spoof/resnet34_final.pth"  # update to your best checkpoint
DEFAULT_BACKBONE   = "resnet34"   # "resnet18" | "resnet34" | "resnet50"
IMG_SIZE           = 224          # match your training
PRINT_DEBUG        = True         # set False to silence prints

# =========================
# Device
# =========================
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
if PRINT_DEBUG:
    print(f"🖥️ Anti-Spoofing running on: {device}")


# =========================
# Model builder
# =========================
def _build_resnet(name: str = DEFAULT_BACKBONE, out_dim: int = 2) -> nn.Module:
    if name == "resnet18":
        m = models.resnet18(weights=None)
    elif name == "resnet34":
        m = models.resnet34(weights=None)
    elif name == "resnet50":
        m = models.resnet50(weights=None)
    else:
        raise ValueError(f"Unsupported backbone: {name}")
    m.fc = nn.Linear(m.fc.in_features, out_dim)  # 1=logit(BCE) or 2=softmax
    return m


# =========================
# Robust state-dict helpers
# =========================
def _strip_prefix(state: dict, prefixes=("module.", "model.")) -> OrderedDict:
    """Strip common prefixes from state_dict keys (for multi-GPU training checkpoints)."""
    new_state = OrderedDict()
    for k, v in state.items():
        nk = k
        for p in prefixes:
            if nk.startswith(p):
                nk = nk[len(p):]
        new_state[nk] = v
    return new_state


def _infer_head(state: dict) -> Tuple[int, str]:
    """
    Infer classifier output dimension and head type from weights.
    Returns (out_dim, head_type), where head_type in {"sigmoid","softmax"}.
    """
    candidates = ["fc.weight", "classifier.weight", "head.weight",
                  "last_linear.weight", "final.weight"]

    for k in state.keys():
        for base in candidates:
            if k.endswith(base):
                w = state[k]
                if getattr(w, "ndim", 0) == 2 and w.shape[0] in (1, 2):
                    out_dim = int(w.shape[0])
                    return out_dim, ("sigmoid" if out_dim == 1 else "softmax")

    for k, v in state.items():
        if getattr(v, "ndim", 0) == 2 and v.shape[0] in (1, 2):
            if k.endswith(".weight") and (k.replace(".weight", ".bias") in state):
                out_dim = int(v.shape[0])
                return out_dim, ("sigmoid" if out_dim == 1 else "softmax")

    return 1, "sigmoid"  # fallback


# =========================
# Loader (robust to heads)
# =========================
def load_anti_spoof_model(
    model_path: str = DEFAULT_MODEL_PATH,
    backbone: str   = DEFAULT_BACKBONE,
    img_size: int   = IMG_SIZE,
) -> Tuple[nn.Module, transforms.Compose, str]:
    """
    Returns (model, transform, head_type).
      - head_type: "sigmoid" (1-logit) or "softmax" (2-class)
    """
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Anti-spoof checkpoint not found: {model_path}")

    ckpt = torch.load(model_path, map_location=device)
    state = ckpt.get("model_state", ckpt)
    state = _strip_prefix(state)

    out_dim, head_type = _infer_head(state)
    model = _build_resnet(backbone, out_dim=out_dim).to(device)

    missing, unexpected = model.load_state_dict(state, strict=False)
    if PRINT_DEBUG and (missing or unexpected):
        print("[AntiSpoof] load_state_dict non-strict",
              "| missing:", missing, "| unexpected:", unexpected)

    model.eval()

    tf = transforms.Compose([
        transforms.Resize((img_size, img_size)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406],
                             std =[0.229, 0.224, 0.225]),
    ])

    if PRINT_DEBUG:
        print(f"✅ Loaded anti-spoof model: {backbone} | head={head_type} "
              f"| out_dim={out_dim} | from {model_path}")

    # Warm-up (first inference is slower on GPU)
    with torch.no_grad():
        dummy = torch.randn(1, 3, img_size, img_size).to(device)
        _ = model(dummy)

    return model, tf, head_type


# =========================
# Lazy globals
# =========================
_anti_spoof_model: nn.Module | None = None
_preprocess_tf: transforms.Compose | None = None
_head_type: str | None = None


def _ensure_loaded():
    global _anti_spoof_model, _preprocess_tf, _head_type
    if _anti_spoof_model is None:
        _anti_spoof_model, _preprocess_tf, _head_type = load_anti_spoof_model(
            DEFAULT_MODEL_PATH, DEFAULT_BACKBONE, IMG_SIZE
        )


# =========================
# Preprocess
# =========================
def preprocess_img(img_bgr: np.ndarray) -> torch.Tensor:
    """Convert BGR (OpenCV) → RGB → tensor with resize+normalize."""
    _ensure_loaded()
    img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
    pil = Image.fromarray(img_rgb)
    return _preprocess_tf(pil).unsqueeze(0).to(device)


# =========================
# Inference
# =========================
def _forward_prob_real(x: torch.Tensor) -> float:
    """Return prob_real ∈ [0,1] using the detected head type."""
    with torch.no_grad():
        logits = _anti_spoof_model(x)
        if _head_type == "sigmoid":
            return float(torch.sigmoid(logits).item())
        else:
            probs = torch.softmax(logits, dim=1)[0].cpu().numpy()
            return float(probs[1])


# =========================
# Public API
# =========================
def check_real_or_spoof(
    img_bgr: np.ndarray,
    threshold: float = 0.90,         # tuned from your test results
    use_heuristics: bool = True,
    double_check: bool = False
) -> Tuple[bool, float, Dict[str, float]]:
    """
    Decide if a face crop is REAL or SPOOF.

    Args:
        img_bgr: BGR (OpenCV) face crop
        threshold: decision threshold for P(real)
        use_heuristics: apply blur/saturation rules
        double_check: run the model twice and average P(real)

    Returns:
      (is_real, confidence, {"real": p_real, "spoof": p_spoof})
    """
    try:
        _ensure_loaded()
        x = preprocess_img(img_bgr)

        p1 = _forward_prob_real(x)
        prob_real = 0.5 * (p1 + _forward_prob_real(x)) if double_check else p1
        prob_spoof = 1.0 - prob_real

        is_real = prob_real >= threshold
        if use_heuristics and not is_real:
            # double-check with heuristics if borderline
            is_real = is_real and _heuristics_ok(img_bgr, prob_real)

        confidence = prob_real if is_real else prob_spoof

        if PRINT_DEBUG:
            status = "REAL ✅" if is_real else "SPOOF 🚫"
            print(f"🕵️ Anti-Spoof → p_real={prob_real:.3f} | "
                  f"p_spoof={prob_spoof:.3f} | thresh={threshold:.2f} | {status}")

        return bool(is_real), float(confidence), {"real": prob_real, "spoof": prob_spoof}

    except Exception as e:
        if PRINT_DEBUG:
            print("❌ Error in anti-spoof check:", e)
        return False, 0.0, {"real": 0.0, "spoof": 0.0}


# =========================
# Heuristics
# =========================
def _heuristics_ok(img_bgr: np.ndarray, prob_real: float, margin_min: float = 0.30) -> bool:
    """Light rules (sharpness, saturation, margin) to filter obvious spoof cases."""
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    lap_var = cv2.Laplacian(gray, cv2.CV_64F).var()
    hsv = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2HSV)
    sat = float(hsv[:, :, 1].mean())
    mean_bgr = np.mean(img_bgr, axis=(0, 1))

    texture_ok = lap_var >= 140.0
    saturation_ok = sat < 150.0
    color_ok = not (mean_bgr[1] > 180 and mean_bgr[2] > 180)
    margin_ok = abs(2.0 * prob_real - 1.0) >= margin_min

    if PRINT_DEBUG:
        print(f"[Heuristics] sharp={lap_var:.1f} | sat={sat:.1f} | margin={margin_ok} "
              f"| tex={texture_ok} sat_ok={saturation_ok} col_ok={color_ok}")

    return texture_ok and saturation_ok and color_ok and margin_ok
