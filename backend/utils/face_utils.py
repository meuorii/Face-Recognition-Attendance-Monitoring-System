import cv2
import numpy as np
from scipy.spatial.distance import cosine
from collections import defaultdict

from utils.model_loader import get_face_model  # ✅ Use shared instance

# ✅ Shared ArcFace + RetinaFace model
face_model = get_face_model()

# ✅ MediaPipe face detector (for optional fallback)
mp_face_detection = __import__('mediapipe').solutions.face_detection
face_detection = mp_face_detection.FaceDetection(min_detection_confidence=0.7)

# --- Crop using MediaPipe (not required if InsightFace handles it) ---
def crop_face_from_image(image):
    """Crop face using Mediapipe Face Detection (fallback only)."""
    rgb_img = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    result = face_detection.process(rgb_img)

    if not result.detections:
        return None

    detection = result.detections[0]
    bbox = detection.location_data.relative_bounding_box
    h, w, _ = image.shape

    x1 = int(max(0, bbox.xmin * w - 10))   
    y1 = int(max(0, bbox.ymin * h - 10))
    x2 = int(min(w, (bbox.xmin + bbox.width) * w + 10))
    y2 = int(min(h, (bbox.ymin + bbox.height) * h + 10))

    return image[y1:y2, x1:x2] if x2 > x1 and y2 > y1 else None

# --- ArcFace Embedding ---
def get_face_embedding(image):
    """Extract embedding using InsightFace ArcFace model."""
    if face_model is None:
        print("❌ Face model not loaded.")
        return None
    try:
        faces = face_model.get(image)
        if not faces or not hasattr(faces[0], 'embedding'):
            print("❌ No embedding found.")
            return None
        embedding = faces[0].embedding
        print(f"✅ Embedding generated. Sample: {embedding[:5]}")
        return embedding
    except Exception as e:
        print("❌ Embedding extraction failed:", e)
        return None

# --- Simple Single Embedding Match ---
def recognize_face(input_embedding, registered_faces, threshold=0.4):
    best_match = None
    min_distance = float('inf')
    for student in registered_faces:
        stored_embedding = student.get("embedding")
        if not stored_embedding or len(stored_embedding) != len(input_embedding):
            continue
        distance = cosine(input_embedding, stored_embedding)
        if distance < threshold and distance < min_distance:
            min_distance = distance
            best_match = student
    if best_match:
        print(f"✅ Matched with {best_match.get('first_name', '')} (distance={min_distance:.4f})")
    else:
        print("❌ No match found.")
    return best_match

# --- Multi-Angle Embedding Match ---
def recognize_face_multi_angle(input_embedding, registered_faces, threshold=0.4):
    best_match = None
    min_distance = float('inf')
    for student in registered_faces:
        embeddings_dict = student.get("embeddings", {})
        for angle, stored_embedding in embeddings_dict.items():
            if not stored_embedding or len(stored_embedding) != len(input_embedding):
                continue
            distance = cosine(input_embedding, stored_embedding)
            if distance < threshold and distance < min_distance:
                min_distance = distance
                best_match = student
    if best_match:
        print(f"✅ Multi-angle matched: {best_match.get('first_name', '')} (distance={min_distance:.4f})")
    else:
        print("❌ No multi-angle match found.")
    return best_match

# --- Angle-aware Cosine Matching for Login ---
def find_matching_user(live_embedding, embeddings, threshold=0.45, target_angle=None):
    """Match embedding against all registered embeddings (angle optional)."""
    user_scores = defaultdict(list)

    for entry in embeddings:
        if target_angle and entry["angle"] != target_angle:
            continue
        score = cosine(live_embedding, entry["embedding"])
        user_scores[entry["user_id"]].append(score)

    if not user_scores:
        print("❌ No embeddings found to compare.")
        return None, None

    avg_scores = [(user, sum(scores)/len(scores)) for user, scores in user_scores.items()]
    avg_scores.sort(key=lambda x: x[1])

    print("🔍 Match Candidates (sorted by avg cosine):")
    for user_id, score in avg_scores[:5]:
        print(f"  → {user_id} | Avg Score: {score:.4f}")

    if avg_scores and avg_scores[0][1] < threshold:
        return avg_scores[0]
    else:
        print("❌ Best match score is above threshold.")
        return None, None
