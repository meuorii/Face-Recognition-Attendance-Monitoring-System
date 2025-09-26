from flask import Blueprint, jsonify, request
from datetime import datetime, timedelta
import base64
import cv2
import numpy as np
from concurrent.futures import ThreadPoolExecutor, TimeoutError
from flask_jwt_extended import create_access_token
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import warnings

# Silence noisy warnings
warnings.filterwarnings(
    "ignore",
    message="`rcond` parameter will change",
    category=FutureWarning,
    module=r"insightface\.utils\.transform"
)

# ✅ Import DB + utils
from config.db_config import db
from utils.face_register import register_face_auto
from utils.face_login import recognize_face
from utils.face_recognition import handle_attendance_session
from models.face_db_model import save_face_data, get_student_by_id, normalize_student
from utils.face_utils import get_face_embedding
from utils.embedding_saver import save_embedding, init_csv  # <-- NEW

# Initialize CSV once
init_csv()

# Blueprint
face_bp = Blueprint("face", __name__)
executor = ThreadPoolExecutor(max_workers=4)

# ✅ Rate Limiter (disabled on login route)
limiter = Limiter(key_func=get_remote_address, default_limits=[])


# ---------------------------
# Helpers
# ---------------------------
def decode_base64_image(base64_str):
    """Decode 'data:image/...;base64,...' into BGR image (OpenCV)."""
    try:
        if not base64_str:
            return None
        payload = base64_str.split(",", 1)[1] if "," in base64_str else base64_str
        img_bytes = base64.b64decode(payload)
        img = cv2.imdecode(np.frombuffer(img_bytes, np.uint8), cv2.IMREAD_COLOR)
        if img is not None:
            img = cv2.flip(img, 1)  # mirror correction
        return img
    except Exception:
        return None


# ---------------------------
# Routes
# ---------------------------

# ✅ Register with ArcFace + RetinaFace + MediaPipe (Multi-Angle)
@face_bp.route("/register-auto", methods=["POST"])
def register_auto():
    try:
        data = request.get_json(silent=True) or {}
        student_id = data.get("student_id")
        angle = data.get("angle")  # e.g. "front", "left", "right", "up", "down"

        if not data.get("image") or not student_id or not angle:
            return jsonify({"error": "Missing required fields"}), 400

        future = executor.submit(register_face_auto, data)
        try:
            result = future.result(timeout=15)
        except TimeoutError:
            return jsonify({"error": "Registration timed out"}), 408

        # ✅ Only save to CSV if embedding is provided
        if result.get("success"):
            embedding = result.get("embedding")
            if embedding is not None:
                save_embedding(student_id, angle, np.array(embedding), capture_id="1")
                save_embedding(student_id, angle, np.array(embedding), capture_id="2")

            return jsonify({
                "success": True,
                "message": f"Embedding saved for {student_id} ({angle})",
                "angle": angle
            }), 200

        return jsonify(result), 400

    except Exception:
        import traceback
        print("❌ Error in /register-auto:", traceback.format_exc())
        return jsonify({"error": "Internal server error"}), 500



# ✅ Face Login (ArcFace + Anti-spoof)
@face_bp.route("/login", methods=["POST"])
def face_login():
    try:
        data = request.get_json(silent=True) or {}
        base64_image = data.get("image")

        if not base64_image:
            return jsonify({"error": "Missing image"}), 400
        if "," not in base64_image:
            return jsonify({"error": "Invalid image format"}), 400

        future = executor.submit(recognize_face, base64_image)
        try:
            result = future.result(timeout=15)
        except TimeoutError:
            return jsonify({"error": "Face login timed out"}), 408

        if isinstance(result, dict) and result.get("error"):
            return jsonify(result), 400

        if isinstance(result, dict) and result.get("student_id"):
            student_id = result["student_id"]

            raw_student = get_student_by_id(student_id)
            if not raw_student:
                return jsonify({"error": "Student not found"}), 404

            # ✅ Always normalize
            student = normalize_student(raw_student)

            token = create_access_token(
                identity=student.get("student_id"),
                expires_delta=timedelta(hours=12)
            )

            return jsonify({
                "token": token,
                "student": {
                    "student_id": student.get("student_id", ""),
                    "first_name": student.get("first_name", ""),
                    "last_name": student.get("last_name", ""),
                    "course": student.get("course", ""),
                    "section": student.get("section", ""),
                }
            }), 200

        return jsonify({"error": "Unexpected response"}), 400

    except Exception:
        import traceback
        print("❌ Error in /login:", traceback.format_exc())
        return jsonify({"error": "Internal server error"}), 500


# ✅ Manual Frame Registration (for testing only)
@face_bp.route("/register-frame", methods=["POST"])
def register_frame():
    try:
        data = request.get_json(silent=True) or {}
        base64_image = data.get("image")
        student_id = data.get("student_id")
        angle = data.get("angle", "front")  # Default front

        if not base64_image or not student_id:
            return jsonify({"error": "Missing data"}), 400

        print(f"📥 Received manual frame for Student ID: {student_id}")
        img = decode_base64_image(base64_image)
        if img is None:
            return jsonify({"error": "Invalid image format"}), 400

        embedding = get_face_embedding(img)
        if embedding is None:
            return jsonify({"error": "No face detected in frame"}), 400

        filename = f"frame_{datetime.now().strftime('%Y%m%d%H%M%S%f')}"

        # ✅ Save to MongoDB
        update_fields = {
            "first_name": data.get("first_name", ""),
            "last_name": data.get("last_name", ""),
            "middle_name": data.get("middle_name", ""),
            "course": data.get("course", ""),
            "section": data.get("section", ""),
            f"embeddings.{filename}": embedding,
        }

        student = get_student_by_id(student_id)
        if not student or "created_at" not in student:
            update_fields["created_at"] = datetime.utcnow()

        save_face_data(student_id=student_id, update_fields=update_fields)

        # ✅ Also save to CSV (2 embeddings per angle)
        save_embedding(student_id, angle, embedding, capture_id="1")
        save_embedding(student_id, angle, embedding, capture_id="2")

        return jsonify({"success": True, "frame_id": filename}), 200

    except Exception:
        import traceback
        print("❌ Error in /register-frame:", traceback.format_exc())
        return jsonify({"error": "Internal server error"}), 500


# ✅ Attendance Session Handler
@face_bp.route("/attendance-session", methods=["POST"])
def attendance_session():
    try:
        data = request.get_json(silent=True) or {}
        subject = data.get("subject", "Default Subject")
        subject_id = data.get("subject_id")
        start_time_str = data.get("subject_start_time")

        subject_start_time = None
        if start_time_str:
            try:
                subject_start_time = datetime.fromisoformat(start_time_str)
            except Exception:
                return jsonify({"error": "Invalid start time format. Use ISO format."}), 400

        result = handle_attendance_session(
            subject=subject,
            subject_id=subject_id,
            subject_start_time=subject_start_time,
        )

        return jsonify(result), 200 if result.get("success") else 400

    except Exception:
        import traceback
        print("❌ Error in /attendance-session:", traceback.format_exc())
        return jsonify({"error": "Internal server error"}), 500
