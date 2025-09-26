from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
import bcrypt
from bson import ObjectId
from datetime import datetime, timedelta
from config.db_config import db
from models.instructor_model import (
    find_instructor_by_id,
    find_instructor_by_email,
    create_instructor
)
from models.class_model import get_all_classes_with_details

instructor_bp = Blueprint("instructor", __name__)

students_collection = db["students"]
classes_collection = db["classes"]
attendance_collection = db["attendance_logs"]

# -------------------------------------------------
# 🔹 Instructor Registration
# -------------------------------------------------
@instructor_bp.route("/register", methods=["POST"])
def register_instructor():
    data = request.get_json()
    instructor_id = data.get("instructor_id")
    first_name = data.get("first_name")
    last_name = data.get("last_name")
    email = data.get("email")
    password = data.get("password")
    confirm_password = data.get("confirm_password")

    if not all([instructor_id, first_name, last_name, email, password, confirm_password]):
        return jsonify({"error": "All fields are required."}), 400

    if password != confirm_password:
        return jsonify({"error": "Passwords do not match."}), 400

    if find_instructor_by_id(instructor_id):
        return jsonify({"error": "Instructor ID already exists."}), 400

    if find_instructor_by_email(email):
        return jsonify({"error": "Email already registered."}), 400

    hashed_password = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())

    instructor_data = {
        "instructor_id": instructor_id,
        "first_name": first_name,
        "last_name": last_name,
        "email": email,
        "password": hashed_password.decode("utf-8")
    }

    create_instructor(instructor_data)
    return jsonify({"message": "Instructor registered successfully."}), 201


# -------------------------------------------------
# 🔹 Instructor Login
# -------------------------------------------------
@instructor_bp.route("/login", methods=["POST"])
def login_instructor():
    data = request.get_json()
    instructor_id = data.get("instructor_id")
    password = data.get("password")

    if not instructor_id or not password:
        return jsonify({"error": "Instructor ID and password are required."}), 400

    instructor = find_instructor_by_id(instructor_id)
    if not instructor:
        return jsonify({"error": "Instructor not found."}), 404

    if not bcrypt.checkpw(password.encode("utf-8"), instructor["password"].encode("utf-8")):
        return jsonify({"error": "Invalid credentials."}), 401

    token = create_access_token(identity=instructor_id)

    return jsonify({
        "message": "Login successful.",
        "token": token,
        "instructor": {
            "instructor_id": instructor["instructor_id"],
            "first_name": instructor["first_name"],
            "last_name": instructor["last_name"],
            "email": instructor.get("email", "")
        }
    }), 200


# -------------------------------------------------
# 🔹 Classes Assigned to Instructor
# -------------------------------------------------
@instructor_bp.route("/<string:instructor_id>/classes", methods=["GET"])
@jwt_required()
def get_classes_by_instructor(instructor_id):
    try:
        classes = list(classes_collection.find({"instructor_id": instructor_id}))
        results = []
        for cls in classes:
            results.append({
                "_id": str(cls["_id"]),
                "subject_code": cls.get("subject_code"),
                "subject_title": cls.get("subject_title"),
                "course": cls.get("course"),
                "section": cls.get("section"),
                "year_level": cls.get("year_level"),
                "semester": cls.get("semester"),
                "schedule_blocks": cls.get("schedule_blocks", []),
                "is_attendance_active": cls.get("is_attendance_active", False),
                "active_session_id": str(cls.get("active_session_id")) if cls.get("active_session_id") else None
            })
        return jsonify(results), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# -------------------------------------------------
# 🔹 Assigned Students per Class
# -------------------------------------------------
@instructor_bp.route("/class/<class_id>/assigned-students", methods=["GET"])
@jwt_required()
def get_assigned_students(class_id):
    try:
        class_doc = classes_collection.find_one({"_id": ObjectId(class_id)})
        if not class_doc:
            return jsonify([]), 200
        return jsonify(class_doc.get("students", [])), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# -------------------------------------------------
# 🔹 Attendance Report (per class)
# -------------------------------------------------
@instructor_bp.route("/class/<class_id>/attendance-report", methods=["GET"])
@jwt_required()
def attendance_report(class_id):
    start_date = request.args.get("from")
    end_date = request.args.get("to")

    query = {"class_id": str(class_id)}

    if start_date and end_date:
        try:
            start = datetime.fromisoformat(start_date).strftime("%Y-%m-%d")
            end = (datetime.fromisoformat(end_date) + timedelta(days=1)).strftime("%Y-%m-%d")
        except Exception:
            start, end = start_date, end_date

        query["date"] = {"$gte": start, "$lt": end}

    logs = list(attendance_collection.find(query).sort("date", 1))

    results = []
    for log in logs:
        date_str = str(log.get("date"))
        for s in log.get("students", []):
            results.append({
                "date": date_str,
                "class_id": log.get("class_id"),
                "subject_code": log.get("subject_code"),
                "subject_title": log.get("subject_title"),
                "student_id": s.get("student_id"),
                "first_name": s.get("first_name"),
                "last_name": s.get("last_name"),
                "status": s.get("status"),
                "time": s.get("time"),
            })

    return jsonify({
        "class_id": class_id,
        "count": len(results),
        "records": results
    }), 200


# -------------------------------------------------
# 🔹 Attendance Report (all classes)
# -------------------------------------------------
@instructor_bp.route("/attendance-report/all", methods=["GET"])
@jwt_required()
def attendance_report_all():
    instructor_id = get_jwt_identity()  # ✅ get current logged-in instructor

    start_date = request.args.get("from")
    end_date = request.args.get("to")

    query = {"instructor_id": instructor_id}  # 🔒 restrict to this instructor

    if start_date and end_date:
        try:
            start = datetime.fromisoformat(start_date).strftime("%Y-%m-%d")
            end = (datetime.fromisoformat(end_date) + timedelta(days=1)).strftime("%Y-%m-%d")
        except Exception:
            start, end = start_date, end_date
        query["date"] = {"$gte": start, "$lt": end}

    logs = list(attendance_collection.find(query).sort("date", 1))

    results = []
    for log in logs:
        date_str = str(log.get("date"))
        for s in log.get("students", []):
            results.append({
                "class_id": log.get("class_id"),
                "subject_code": log.get("subject_code"),
                "subject_title": log.get("subject_title"),
                "date": date_str,
                "student_id": s.get("student_id"),
                "first_name": s.get("first_name"),
                "last_name": s.get("last_name"),
                "status": s.get("status"),
                "time": s.get("time"),
            })
    return jsonify(results), 200


# -------------------------------------------------
# 🔹 Test: Show All Classes
# -------------------------------------------------
@instructor_bp.route("/test/class-list", methods=["GET"])
def list_all_class_assignments():
    try:
        data = get_all_classes_with_details()
        return jsonify(data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# -------------------------------------------------
# 🔹 Instructor Overview Endpoints
# -------------------------------------------------

# ✅ Dashboard Stats (with Late + Absent counts)
@instructor_bp.route("/<string:instructor_id>/overview", methods=["GET"])
@jwt_required()
def instructor_overview(instructor_id):
    try:
        classes = list(classes_collection.find({"instructor_id": instructor_id}))

        total_classes = len(classes)
        total_students = sum(len(cls.get("students", [])) for cls in classes)
        active_sessions = sum(1 for cls in classes if cls.get("is_attendance_active", False))

        # Attendance stats
        class_ids = [str(cls["_id"]) for cls in classes]
        pipeline = [
            {"$match": {"class_id": {"$in": class_ids}}},
            {"$unwind": "$students"},
            {"$group": {
                "_id": None,
                "total_records": {"$sum": 1},
                "present": {"$sum": {"$cond": [{"$eq": ["$students.status", "Present"]}, 1, 0]}},
                "late": {"$sum": {"$cond": [{"$eq": ["$students.status", "Late"]}, 1, 0]}},
                "absent": {"$sum": {"$cond": [{"$eq": ["$students.status", "Absent"]}, 1, 0]}}
            }}
        ]

        agg = list(attendance_collection.aggregate(pipeline))
        if agg:
            total_records = agg[0]["total_records"]
            present_count = agg[0]["present"]
            late_count = agg[0]["late"]
            absent_count = agg[0]["absent"]
        else:
            total_records, present_count, late_count, absent_count = 0, 0, 0, 0

        # ✅ Attendance rate counts Present + Late as attended
        attendance_rate = (
            round(((present_count + late_count) / total_records) * 100, 2)
            if total_records else 0
        )

        return jsonify({
            "totalClasses": total_classes,
            "totalStudents": total_students,
            "activeSessions": active_sessions,
            "attendanceRate": attendance_rate,
            "present": present_count,
            "late": late_count,
            "absent": absent_count,
            "totalRecords": total_records
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ✅ Attendance Trend (day-wise counts for Present, Late, Absent)
@instructor_bp.route("/<string:instructor_id>/overview/attendance-trend", methods=["GET"])
@jwt_required()
def instructor_attendance_trend(instructor_id):
    try:
        pipeline = [
            {"$match": {"instructor_id": instructor_id}},
            {"$unwind": "$students"},
            {"$group": {
                "_id": "$date",  # group by date string (same as student)
                "present": {
                    "$sum": {"$cond": [{"$eq": ["$students.status", "Present"]}, 1, 0]}
                },
                "late": {
                    "$sum": {"$cond": [{"$eq": ["$students.status", "Late"]}, 1, 0]}
                },
                "absent": {
                    "$sum": {"$cond": [{"$eq": ["$students.status", "Absent"]}, 1, 0]}
                }
            }},
            {"$sort": {"_id": 1}}
        ]

        trend = list(attendance_collection.aggregate(pipeline))

        formatted = [
            {
                "date": t["_id"],  # keep same key as student
                "present": t.get("present", 0),
                "late": t.get("late", 0),
                "absent": t.get("absent", 0)
            }
            for t in trend
        ]

        return jsonify(formatted), 200
    except Exception as e:
        print(f"❌ Error in instructor_attendance_trend: {e}")
        return jsonify({"error": str(e)}), 500

# ✅ Class Summary for Overview
@instructor_bp.route("/<string:instructor_id>/overview/classes", methods=["GET"])
@jwt_required()
def instructor_class_summary(instructor_id):
    try:
        classes = list(classes_collection.find({"instructor_id": instructor_id}))
        results = []
        for cls in classes:
            results.append({
                "_id": str(cls["_id"]),
                "subject_code": cls.get("subject_code"),
                "subject_title": cls.get("subject_title"),
                "course": cls.get("course"),
                "year_level": cls.get("year_level"),
                "semester": cls.get("semester"),
                "section": cls.get("section"),
                "schedule_blocks": cls.get("schedule_blocks", []),
                "students_count": len(cls.get("students", [])),
                "is_attendance_active": cls.get("is_attendance_active", False),
            })
        return jsonify(results), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
