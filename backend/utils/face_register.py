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
        base64_image = data.get("image")
        angle_from_frontend = data.get("angle")

        if not student_id or not base64_image:
            return {"success": False, "error": "Missing student_id or image"}

        # Decode base64
        try:
            img_bytes = base64.b64decode(base64_image.split(",")[1])
            img = cv2.imdecode(np.frombuffer(img_bytes, np.uint8), cv2.IMREAD_COLOR)
            if img is None:
                return {"success": False, "error": "Image decoding failed"}
            img = cv2.flip(img, 1)
        except Exception as e:
            print("❌ Base64 decoding error:", str(e))
            return {"success": False, "error": "Invalid image format"}

        # Face landmarks (MediaPipe)
        try:
            rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            results = face_mesh.process(rgb)
            if not results.multi_face_landmarks:
                return {"success": False, "error": "No face detected"}
            h, w = img.shape[:2]
            landmarks = results.multi_face_landmarks[0].landmark
            angle = angle_from_frontend or get_face_angle(landmarks, w, h)
        except Exception as e:
            print("❌ FaceMesh error:", str(e))
            return {"success": False, "error": "Landmark processing failed"}

        print(f"🎯 Detected angle: {angle}")

        # ArcFace embedding
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

        # Save to DB
        try:
            save_face_data(
                student_id=student_id,
                update_fields={
                    "First_Name": data.get("first_name", ""),
                    "Last_Name": data.get("last_name", ""),
                    "Middle_Name": data.get("middle_name", ""),
                    "Course": data.get("course", ""),
                    "Email": data.get("email", ""),
                    "Contact_Number": data.get("contact_number", ""),
                    "Section": "",
                    "Subjects": [],
                    "created_at": datetime.utcnow(),
                    f"embeddings.{angle}": embedding,
                },
            )
            print(f"✅ Face data updated for {student_id}. Fields updated: ['embeddings.{angle}']")
        except Exception as e:
            print("❌ Database update failed:", str(e))
            return {"success": False, "error": "Database update failed"}

        # Final success
        return {
            "success": True,
            "message": f"✅ Face registered and saved angle: {angle}",
            "angle": angle,
        }

    except Exception:
        import traceback
        print("❌ register_face_auto() Exception:", traceback.format_exc())
        return {"success": False, "error": "Internal server error"}

