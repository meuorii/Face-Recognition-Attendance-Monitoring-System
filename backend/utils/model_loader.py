from insightface.app import FaceAnalysis
import onnxruntime as ort

print("🔄 Initializing InsightFace model...")

# Get available ONNX providers
available_providers = ort.get_available_providers()
print("Available providers:", available_providers)

# Prefer GPU if CUDA is available, fallback to CPU
if "CUDAExecutionProvider" in available_providers:
    providers = ["CUDAExecutionProvider", "CPUExecutionProvider"]
    ctx_id = 0   # GPU
else:
    providers = ["CPUExecutionProvider"]
    ctx_id = -1  # CPU

try:
    _face_model = FaceAnalysis(name="buffalo_l", providers=providers)
    _face_model.prepare(ctx_id=ctx_id, det_size=(640, 640))
    print(f"✅ InsightFace model loaded using providers: {providers}")
except Exception as e:
    print("❌ Failed to load InsightFace model:", e)
    _face_model = None


def get_face_model():
    """Return the shared InsightFace model instance."""
    return _face_model
