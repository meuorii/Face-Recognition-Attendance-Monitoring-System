from flask import Blueprint, request, jsonify
from bson import ObjectId
from datetime import datetime, timedelta, timezone

from utils.attendance_session import (
    start_attendance_session,
    stop_attendance_session,
)
from config.db_config import db

# 🔹 Work with classes instead of subjects
classes_collection = db["classes"]

# 🔄 Attendance model helpers (class-based)
from models.attendance_model import (
    log_attendance as log_attendance_model,
    has_logged_attendance,
    get_attendance_logs_by_class_and_date,
    get_attendance_by_class,
    mark_absent_bulk,
)

attendance_bp = Blueprint("attendance", __name__)

# -----------------------------
# Timezone
# -----------------------------
PH_TZ = timezone(timedelta(hours=8))  # Philippine Time

# -----------------------------
# Utilities
# -----------------------------
def _today_date():
    """Return today's date normalized to midnight (PH time)."""
    return datetime.now(PH_TZ).replace(hour=0, minute=0, second=0, microsecond=0)

def _parse_date(date_str):
    """Convert YYYY-MM-DD string to datetime (PH tz), fallback to today."""
    if not date_str:
        return _today_date()
    try:
        return datetime.strptime(date_str, "%Y-%m-%d").replace(tzinfo=PH_TZ)
    except ValueError:
        return _today_date()

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

# -----------------------------
# API ROUTES
# -----------------------------

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

# ✅ Stop attendance session (auto-mark absentees)
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
        if not cls:
            return jsonify({"error": "Class not found"}), 404

        # 🔹 Auto mark absentees
        today = _today_date()
        today_str = today.strftime("%Y-%m-%d")
        today_logs = get_attendance_logs_by_class_and_date(class_id, today_str, today_str)

        logged_ids = {
            s["student_id"] for log in today_logs for s in log.get("students", [])
        }
        all_students = cls.get("students", [])
        absent_students = [
            s for s in all_students if s.get("student_id") not in logged_ids
        ]

        if absent_students:
            class_data = _class_to_payload(cls)
            mark_absent_bulk(class_data, today, absent_students)

        return jsonify({
            "success": True,
            "message": f"🛑 Session stopped. Absent marked for {len(absent_students)} students.",
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
            return jsonify({"active": True, "class": _class_to_payload(cls)}), 200
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
        required = ["class_id", "student"]
        missing = [k for k in required if k not in data]
        if missing:
            return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

        class_id = data["class_id"]
        student_data = data["student"]
        date_val = _parse_date(data.get("date"))
        status = data.get("status")  # optional (from client like attendance_app)

        # Validate student fields
        for f in ["student_id", "first_name", "last_name"]:
            if f not in student_data:
                return jsonify({"error": f"Missing student.{f}"}), 400

        # ✅ Fetch class info
        cls = classes_collection.find_one({"_id": ObjectId(class_id)})
        if not cls:
            return jsonify({"error": "Class not found"}), 404

        class_data = {
            "class_id": str(cls["_id"]),
            "subject_code": cls.get("subject_code"),
            "subject_title": cls.get("subject_title"),
            "instructor_id": cls.get("instructor_id"),
            "instructor_first_name": cls.get("instructor_first_name"),
            "instructor_last_name": cls.get("instructor_last_name"),
            "course": cls.get("course"),
            "section": cls.get("section"),
        }

        if not status:
            result = log_attendance_model(
                class_data=class_data,
                student_data=student_data,
                date_val=date_val,
                class_start_time=cls.get("attendance_start_time")
            )
        else:
            result = log_attendance_model(
                class_data=class_data,
                student_data=student_data,
                date_val=date_val,
                class_start_time=None,
                status=status
            )

        if result is None:
            return jsonify({
                "success": False,
                "message": "⛔ Too late (>30 minutes). Attendance not recorded.",
                "class_id": class_data["class_id"],
                "student_id": student_data["student_id"],
            }), 400

        return jsonify({
            "success": True,
            "message": f"Attendance recorded as {result['status']}",
            **result
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
        date_val = _parse_date(request.args.get("date"))

        if not student_id or not class_id:
            return jsonify({"error": "Missing student_id or class_id"}), 400

        exists = has_logged_attendance(student_id, class_id, date_val)
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

        for d in docs:
            d["_id"] = str(d["_id"])

        return jsonify({
            "success": True,
            "class_id": class_id,
            "logs": docs
        }), 200

    except Exception:
        import traceback
        print("❌ Error in /logs:", traceback.format_exc())
        return jsonify({"error": "Internal server error"}), 500

# ✅ Bulk mark ABSENT for students (manual)
@attendance_bp.route("/mark-absent", methods=["POST"])
def mark_absent():
    try:
        data = request.get_json(silent=True) or {}
        class_id = data.get("class_id")
        students = data.get("students", [])

        if not class_id or not isinstance(students, list):
            return jsonify({"error": "Missing class_id or students[]"}), 400

        date_val = _parse_date(data.get("date"))

        cls = classes_collection.find_one({"_id": ObjectId(class_id)})
        if not cls:
            return jsonify({"error": "Class not found"}), 404

        class_data = {
            "class_id": str(cls["_id"]),
            "subject_code": cls.get("subject_code"),
            "subject_title": cls.get("subject_title"),
            "instructor_id": cls.get("instructor_id"),
            "instructor_first_name": cls.get("instructor_first_name"),
            "instructor_last_name": cls.get("instructor_last_name"),
            "course": cls.get("course"),
            "section": cls.get("section"),
        }

        mark_absent_bulk(class_data, date_val, students)

        return jsonify({
            "success": True,
            "message": "Absent marked (where missing)",
            "class_id": class_id,
            "date": date_val.strftime("%Y-%m-%d"),
            "count": len(students),
        }), 200

    except Exception:
        import traceback
        print("❌ Error in /mark-absent:", traceback.format_exc())
        return jsonify({"error": "Internal server error"}), 500
