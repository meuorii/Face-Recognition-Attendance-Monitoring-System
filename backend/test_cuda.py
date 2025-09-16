import onnxruntime as ort
import time
import numpy as np

# Dummy input
dummy = np.random.rand(1, 3, 112, 112).astype(np.float32)

# Load a small ONNX model (or one of your InsightFace ones)
sess = ort.InferenceSession("C:/Users/fonti/.insightface/models/buffalo_l/w600k_r50.onnx",
                            providers=['CUDAExecutionProvider', 'CPUExecutionProvider'])

input_name = sess.get_inputs()[0].name

# Warmup
sess.run(None, {input_name: dummy})

# Timing
start = time.time()
for _ in range(50):
    sess.run(None, {input_name: dummy})
print("Avg latency:", (time.time()-start)/50)
print("Providers:", sess.get_providers())
print("Active provider:", sess.get_provider_options())
