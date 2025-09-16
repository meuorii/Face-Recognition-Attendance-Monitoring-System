import os
import cv2
import numpy as np
import torch
import torch.nn as nn
import torchvision.transforms as transforms
from torchvision import models
from PIL import Image
from collections import OrderedDict

# =========================
# Config (edit if needed)
# =========================
DEFAULT_MODEL_PATH = "models/anti_spoof/best_model.pth"  # your path
DEFAULT_BACKBONE   = "resnet50"   # "resnet18" | "resnet34" | "resnet50"
IMG_SIZE           = 256          # match your training
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
def _build_resnet(name: str = DEFAULT_BACKBONE, out_dim: int = 1) -> nn.Module:
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
    new_state = OrderedDict()
    for k, v in state.items():
        nk = k
        for p in prefixes:
            if nk.startswith(p):
                nk = nk[len(p):]
        new_state[nk] = v
    return new_state

def _infer_head(state: dict) -> tuple[int, str]:
    """
    Infer classifier output dimension and head type from weights.
    Returns (out_dim, head_type), where head_type in {"sigmoid","softmax"}.
    """
    # Try common head keys
    candidates = [
        "fc.weight", "classifier.weight", "head.weight",
        "last_linear.weight", "final.weight"
    ]
    for k in state.keys():
        for base in candidates:
            if k.endswith(base):
                w = state[k]
                if getattr(w, "ndim", 0) == 2 and w.shape[0] in (1, 2):
                    out_dim = int(w.shape[0])
                    return out_dim, ("sigmoid" if out_dim == 1 else "softmax")

    # Fallback: any small 2D weight with matching bias
    for k, v in state.items():
        if getattr(v, "ndim", 0) == 2 and v.shape[0] in (1, 2):
            if k.endswith(".weight") and (k.replace(".weight", ".bias") in state):
                out_dim = int(v.shape[0])
                return out_dim, ("sigmoid" if out_dim == 1 else "softmax")

    # Final fallback: assume BCE (1-logit)
    return 1, "sigmoid"

# =========================
# Loader (robust to heads)
# =========================
def load_anti_spoof_model(
    model_path: str = DEFAULT_MODEL_PATH,
    backbone: str   = DEFAULT_BACKBONE,
    img_size: int   = IMG_SIZE,
) -> tuple[nn.Module, transforms.Compose, str]:
    """
    Returns (model, transform, head_type).
      - head_type: "sigmoid" (1-logit) or "softmax" (2-class)
    """
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Anti-spoof checkpoint not found: {model_path}")

    ckpt = torch.load(model_path, map_location=device)
    state = ckpt.get("model_state", ckpt)  # accept raw state_dict or with key "model_state"
    state = _strip_prefix(state)

    out_dim, head_type = _infer_head(state)
    model = _build_resnet(backbone, out_dim=out_dim).to(device)

    # Non-strict to tolerate head name differences
    missing, unexpected = model.load_state_dict(state, strict=False)
    if PRINT_DEBUG and (missing or unexpected):
        print("[AntiSpoof] load_state_dict non-strict",
              "| missing:", missing, "| unexpected:", unexpected)

    model.eval()

    # Preprocessing must match training eval pipeline
    tf = transforms.Compose([
        transforms.Resize((img_size, img_size)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406],
                             std =[0.229, 0.224, 0.225]),
    ])

    if PRINT_DEBUG:
        print(f"✅ Loaded anti-spoof model: {backbone} | head={head_type} | out_dim={out_dim} | from {model_path}")

    # Warm-up to avoid first-run lag
    with torch.no_grad():
        _ = model(torch.randn(1, 3, img_size, img_size, device=device))

    return model, tf, head_type

# Lazy globals (allow re-imports without double-loading)
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
    """
    BGR (OpenCV) -> RGB -> PIL -> tensor with resize+normalize.
    """
    _ensure_loaded()
    img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
    pil = Image.fromarray(img_rgb)
    x = _preprocess_tf(pil).unsqueeze(0).to(device)
    return x

# =========================
# Inference
# =========================
def _forward_prob_real(x: torch.Tensor) -> float:
    """
    Returns prob_real in [0,1] using the detected head.
    """
    with torch.no_grad():
        logits = _anti_spoof_model(x)
        if _head_type == "sigmoid":
            # 1 logit => sigmoid gives P(REAL)
            return float(torch.sigmoid(logits).item())
        else:
            # 2 logits => softmax([spoof, real])
            probs = torch.softmax(logits, dim=1)[0].detach().cpu().numpy()
            return float(probs[1])

# =========================
# Heuristics (optional)
# =========================
def _heuristics_ok(img_bgr: np.ndarray, prob_real: float, margin_min: float = 0.30) -> bool:
    """
    Lightweight heuristics to reduce obvious replay/print attacks.
    You can turn this off from the public API if you want.
    """
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    lap_var = cv2.Laplacian(gray, cv2.CV_64F).var()        # sharpness
    hsv = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2HSV)
    sat = float(hsv[:, :, 1].mean())
    mean_bgr = np.mean(img_bgr, axis=(0, 1))

    # Simple expectations:
    texture_ok     = lap_var >= 140.0     # too blurry => likely screen
    saturation_ok  = sat < 150.0          # oversaturated => screen/glare
    color_reasonable = not (mean_bgr[1] > 180 and mean_bgr[2] > 180)

    # If head is softmax we can approximate margin by (2*prob_real - 1)
    margin = abs(2.0 * prob_real - 1.0)
    margin_ok = margin >= margin_min

    if PRINT_DEBUG:
        print(f"[Heuristics] sharp={lap_var:.1f} sat={sat:.1f} margin={margin:.2f} "
              f"| texture_ok={texture_ok} saturation_ok={saturation_ok} color_ok={color_reasonable}")

    return texture_ok and saturation_ok and color_reasonable and margin_ok

# =========================
# Public API
# =========================
def check_real_or_spoof(
    img_bgr: np.ndarray,
    threshold: float = 0.98,          # tune from val ROC
    use_heuristics: bool = True,
    double_check: bool = False        # ✅ added back for back-compat
) -> tuple[bool, float, dict]:
    """
    Decide if a face crop is REAL or SPOOF.

    Args:
        img_bgr: BGR (OpenCV) image (preferably a tight face crop)
        threshold: decision threshold for P(real)
        use_heuristics: apply light rules (blur/saturation/margin)
        double_check: run the model twice and average P(real)

    Returns:
      (is_real, confidence, {"real": p_real, "spoof": p_spoof})
    """
    try:
        _ensure_loaded()
        x = preprocess_img(img_bgr)

        # one or two forward passes (to reduce jitter)
        p1 = _forward_prob_real(x)
        if double_check:
            p2 = _forward_prob_real(x)
            prob_real = 0.5 * (p1 + p2)
        else:
            prob_real = p1

        prob_spoof = 1.0 - prob_real

        is_real = (prob_real >= threshold)
        if use_heuristics:
            if prob_real >= (threshold + 0.15):
                pass  # keep is_real = True
            else:
                 is_real = is_real and _heuristics_ok(img_bgr, prob_real)

        confidence = prob_real if is_real else prob_spoof

        if PRINT_DEBUG:
            status = "REAL ✅" if is_real else "SPOOF 🚫"
            print(f"🕵️ Anti-Spoof → p_real={prob_real:.3f} p_spoof={prob_spoof:.3f} "
                  f"| thresh={threshold:.2f} | {status}")

        return bool(is_real), float(confidence), {"real": float(prob_real), "spoof": float(prob_spoof)}

    except Exception as e:
        if PRINT_DEBUG:
            print("❌ Error in anti-spoof check:", e)
        return False, 0.0, {"real": 0.0, "spoof": 0.0}
