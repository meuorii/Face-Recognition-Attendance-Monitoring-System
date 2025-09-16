from flask import Blueprint, request, jsonify
from bson import ObjectId
from datetime import datetime

from utils.attendance_session import (
    start_attendance_session,
    stop_attendance_session,
)
from config.db_config import db

# 🔹 Work with classes instead of subjects
classes_collection = db["classes"]

# 🔄 Attendance model helpers (now class-based)
from models.attendance_model import (
    log_attendance as log_attendance_model,
    has_logged_attendance,
    get_attendance_logs_by_class_and_date,   # ✅ updated
    get_attendance_by_class,                 # ✅ updated
    mark_absent_bulk,
)

attendance_bp = Blueprint("attendance", __name__)


# -----------------------------
# Utilities
# -----------------------------
def _today_str():
    return datetime.now().strftime("%Y-%m-%d")


def _class_to_payload(cls):
    if not cls:
        return None
    return {
        "class_id": str(cls["_id"]),
        "subject_code": cls.get("subject_code"),
        "subject_title": cls.get("subject_title"),
        "instructor_id": cls.get("instructor_id"),
        "instructor_first_name": cls.get("instructor_first_name"),
        "instructor_last_name": cls.get("instructor_last_name"),
        "course": cls.get("course"),
        "section": cls.get("section"),
        "is_attendance_active": cls.get("is_attendance_active", False),
        "attendance_start_time": cls.get("attendance_start_time"),
        "attendance_end_time": cls.get("attendance_end_time"),
        "students": cls.get("students", []),
    }



# ✅ Start attendance session
@attendance_bp.route("/start-session", methods=["POST"])
def start_session():
    try:
        data = request.get_json(silent=True) or {}
        class_id = data.get("class_id")
        instructor_id = data.get("instructor_id")

        if not class_id:
            return jsonify({"error": "Missing class_id"}), 400

        ok = start_attendance_session(class_id, instructor_id)
        if not ok:
            return jsonify({"error": f"Failed to start session for class {class_id}"}), 400

        cls = classes_collection.find_one({"_id": ObjectId(class_id)})
        return jsonify({
            "success": True,
            "message": f"✅ Attendance session started for class {class_id}",
            "class": _class_to_payload(cls),
        }), 200

    except Exception:
        import traceback
        print("❌ Error in /start-session:", traceback.format_exc())
        return jsonify({"error": "Internal server error"}), 500


# ✅ Stop attendance session
@attendance_bp.route("/stop-session", methods=["POST"])
def stop_session():
    try:
        data = request.get_json(silent=True) or {}
        class_id = data.get("class_id")

        if not class_id:
            return jsonify({"error": "Missing class_id"}), 400

        ok = stop_attendance_session(class_id)
        if not ok:
            return jsonify({"error": f"No active session for class {class_id}"}), 400

        cls = classes_collection.find_one({"_id": ObjectId(class_id)})
        return jsonify({
            "success": True,
            "message": f"🛑 Attendance session stopped for class {class_id}",
            "class": _class_to_payload(cls),
        }), 200

    except Exception:
        import traceback
        print("❌ Error in /stop-session:", traceback.format_exc())
        return jsonify({"error": "Internal server error"}), 500


# ✅ Get currently active session
@attendance_bp.route("/active-session", methods=["GET"])
def get_active_session():
    try:
        cls = classes_collection.find_one({"is_attendance_active": True})
        if cls:
            return jsonify({
                "active": True,
                # ✅ Send full class document with students
                "class": _class_to_payload(cls),
            }), 200
        return jsonify({"active": False}), 200

    except Exception:
        import traceback
        print("❌ Error in /active-session:", traceback.format_exc())
        return jsonify({"error": "Internal server error"}), 500


# ✅ Log/Upsert a student's attendance
@attendance_bp.route("/log", methods=["POST"])
def log_attendance():
    try:
        data = request.get_json(silent=True) or {}
        required = ["class_id", "student", "status"]
        missing = [k for k in required if k not in data]
        if missing:
            return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

        date_str = data.get("date") or _today_str()

        class_data = {
            "class_id": data["class_id"],
            "subject_code": data.get("subject_code"),
            "subject_title": data.get("subject_title"),
            "instructor_id": data.get("instructor_id"),
            "instructor_first_name": data.get("instructor_first_name"),
            "instructor_last_name": data.get("instructor_last_name"),
            "course": data.get("course"),
            "section": data.get("section"),
        }

        student_data = data["student"]
        status = data["status"]

        for f in ["student_id", "first_name", "last_name"]:
            if f not in student_data:
                return jsonify({"error": f"Missing student.{f}"}), 400

        log_attendance_model(
            class_data=class_data,
            student_data=student_data,
            status=status,
            date_str=date_str
        )

        return jsonify({
            "success": True,
            "message": "Attendance recorded",
            "class_id": class_data["class_id"],
            "date": date_str,
            "student_id": student_data["student_id"],
            "status": status
        }), 200

    except Exception:
        import traceback
        print("❌ Error in /log:", traceback.format_exc())
        return jsonify({"error": "Internal server error"}), 500


# ✅ Check if student already logged today
@attendance_bp.route("/has-logged", methods=["GET"])
def has_logged():
    try:
        student_id = request.args.get("student_id")
        class_id = request.args.get("class_id")
        date_str = request.args.get("date") or _today_str()

        if not student_id or not class_id:
            return jsonify({"error": "Missing student_id or class_id"}), 400

        exists = has_logged_attendance(student_id, class_id, date_str)
        return jsonify({"exists": bool(exists)}), 200

    except Exception:
        import traceback
        print("❌ Error in /has-logged:", traceback.format_exc())
        return jsonify({"error": "Internal server error"}), 500


# ✅ Get attendance logs for a class
@attendance_bp.route("/logs/<class_id>", methods=["GET"])
def get_logs(class_id):
    try:
        start = request.args.get("start")
        end = request.args.get("end")

        if start and end:
            docs = get_attendance_logs_by_class_and_date(class_id, start, end)
        else:
            docs = get_attendance_by_class(class_id)

        def serialize(d):
            d["_id"] = str(d["_id"])
            return d

        return jsonify({
            "success": True,
            "class_id": class_id,
            "logs": [serialize(d) for d in docs]
        }), 200

    except Exception:
        import traceback
        print("❌ Error in /logs:", traceback.format_exc())
        return jsonify({"error": "Internal server error"}), 500


# ✅ Bulk mark ABSENT for students
@attendance_bp.route("/mark-absent", methods=["POST"])
def mark_absent():
    try:
        data = request.get_json(silent=True) or {}
        class_id = data.get("class_id")
        students = data.get("students", [])

        if not class_id or not isinstance(students, list):
            return jsonify({"error": "Missing class_id or students[]"}), 400

        date_str = data.get("date") or _today_str()
        class_data = {
            "class_id": class_id,
            "subject_code": data.get("subject_code"),
            "subject_title": data.get("subject_title"),
            "instructor_id": data.get("instructor_id"),
            "instructor_first_name": data.get("instructor_first_name"),
            "instructor_last_name": data.get("instructor_last_name"),
            "course": data.get("course"),
            "section": data.get("section"),
        }

        mark_absent_bulk(class_data, date_str, students)

        return jsonify({
            "success": True,
            "message": "Absent marked (where missing)",
            "class_id": class_id,
            "date": date_str,
            "count": len(students)
        }), 200

    except Exception:
        import traceback
        print("❌ Error in /mark-absent:", traceback.format_exc())
        return jsonify({"error": "Internal server error"}), 500
