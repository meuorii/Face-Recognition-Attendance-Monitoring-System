import cv2
import base64
import numpy as np
import mediapipe as mp
from datetime import datetime
from models.face_db_model import save_face_data
from utils.model_loader import get_face_model  # ✅ Use shared model instance

# --- Load shared InsightFace model (ArcFace + RetinaFace) ---
face_model = get_face_model()

# --- Initialize MediaPipe FaceMesh ---
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(max_num_faces=1, refine_landmarks=True)

# --- Helper: Predict Face Angle from MediaPipe landmarks ---
def get_face_angle(landmarks, w, h):
    try:
        nose = landmarks[1]
        left_eye = landmarks[33]
        right_eye = landmarks[263]
        mouth = landmarks[13]

        nose_y = nose.y * h
        eye_mid_y = ((left_eye.y + right_eye.y) / 2) * h
        mouth_y = mouth.y * h

        eye_dist = right_eye.x - left_eye.x
        nose_pos = (nose.x - left_eye.x) / (eye_dist + 1e-6)
        up_down_ratio = (nose_y - eye_mid_y) / (mouth_y - nose_y + 1e-6)

        if nose_pos < 0.3:
            return 'right'
        elif nose_pos > 0.8:
            return 'left'
        elif up_down_ratio > 2.5:
            return 'down'
        elif up_down_ratio < 0.3:
            return 'up'
        return 'front'
    except Exception as e:
        print("❌ Angle detection failed:", str(e))
        return 'front'

# --- Main Registration Function ---
def register_face_auto(data):
    try:
        student_id = data.get("student_id")
        first_name = data.get("first_name", "")
        last_name = data.get("last_name", "")
        middle_name = data.get("middle_name", "")
        course = data.get("course", "")
        email = data.get("email", "")
        contact_number = data.get("contact_number", "")
        base64_image = data.get("image")
        angle_from_frontend = data.get("angle")

        if not student_id or not base64_image:
            return {"success": False, "error": "Missing student_id or image"}

        # Decode base64 image
        try:
            img_bytes = base64.b64decode(base64_image.split(",")[1])
            img = cv2.imdecode(np.frombuffer(img_bytes, np.uint8), cv2.IMREAD_COLOR)
            if img is None:
                return {"success": False, "error": "Image decoding failed"}
            img = cv2.flip(img, 1)  # mirror fix
        except Exception as e:
            print("❌ Base64 decoding error:", str(e))
            return {"success": False, "error": "Invalid image format"}

        # Get angle using MediaPipe
        try:
            rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            results = face_mesh.process(rgb)
            if not results.multi_face_landmarks:
                return {"success": False, "error": "No face detected by MediaPipe"}
            h, w = img.shape[:2]
            landmarks = results.multi_face_landmarks[0].landmark
            angle = angle_from_frontend or get_face_angle(landmarks, w, h)
        except Exception as e:
            print("❌ FaceMesh error:", str(e))
            return {"success": False, "error": "Landmark processing failed"}

        print(f"🎯 Detected angle: {angle}")

        # Extract embedding using InsightFace
        if face_model is None:
            return {"success": False, "error": "Face model not initialized"}
        try:
            faces = face_model.get(img)
            if not faces or not hasattr(faces[0], "embedding"):
                return {"success": False, "error": "No face embedding extracted"}
            embedding = faces[0].embedding.tolist()
        except Exception as e:
            print("❌ Embedding extraction failed:", str(e))
            return {"success": False, "error": "Embedding generation error"}

        # --- Save to MongoDB (Section & Subjects blank muna) ---
        save_face_data(
            student_id=student_id,
            update_fields={
                "First_Name": first_name,
                "Last_Name": last_name,
                "Middle_Name": middle_name,
                "Course": course,
                "Email": email,
                "Contact_Number": contact_number,
                "Section": "",          # blank until COR upload
                "Subjects": [],         # empty list until COR upload
                "created_at": datetime.utcnow(),  # ✅ set ngayong registration
                f"embeddings.{angle}": embedding,
            }
        )

        return {
            "success": True,
            "message": f"✅ Face registered and saved angle: {angle}",
            "angle": angle
        }

    except Exception as e:
        import traceback
        print("❌ register_face_auto() Exception:", traceback.format_exc())
        return {"success": False, "error": "Internal server error"}
