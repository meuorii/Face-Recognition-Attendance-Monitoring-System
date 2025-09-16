from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import datetime
import os
from bson import ObjectId
from config.db_config import db
from models.admin_model import find_admin_by_user_id, find_admin_by_email, create_admin

admin_bp = Blueprint('admin_bp', __name__)
secret_key = os.getenv("JWT_SECRET", os.getenv("JWT_SECRET_KEY", "yoursecretkey"))

# Collections
students_col = db["students"]
instructors_col = db["instructors"]
classes_col = db["classes"]
attendance_logs_col = db["attendance_logs"]
spoof_col = db["spoof_attempts"]
subjects_col = db["subjects"]

# -------------------------------
# Helpers
# -------------------------------
def today_str_utc():
    return datetime.datetime.utcnow().strftime("%Y-%m-%d")

def to_date_str(dt):
    if not dt:
        return None
    if isinstance(dt, datetime.datetime):
        return dt.strftime("%Y-%m-%d")
    if isinstance(dt, datetime.date):
        return dt.strftime("%Y-%m-%d")
    s = str(dt)
    return s[:10] if len(s) >= 10 else s

def _serialize_subject(s):
    return {
        "_id": str(s["_id"]),
        "subject_code": s.get("subject_code"),
        "subject_title": s.get("subject_title"),
        "course": s.get("course"),
        "year_level": s.get("year_level"),
        "semester": s.get("semester"),
        "instructor_id": s.get("instructor_id"),
        "instructor_first_name": s.get("instructor_first_name"),
        "instructor_last_name": s.get("instructor_last_name"),
        "created_at": s.get("created_at")
    }

# =========================================
# ✅ Auth: Register (after frontend OTP)
# =========================================
@admin_bp.route('/api/admin/register', methods=['POST'])
def register_admin():
    data = request.get_json() or {}

    first_name = (data.get("first_name") or "").strip()
    last_name  = (data.get("last_name")  or "").strip()
    user_id    = (data.get("user_id")    or "").strip()
    email      = (data.get("email")      or "").strip().lower()
    password   = data.get("password") or ""

    if not all([first_name, last_name, user_id, email, password]):
        return jsonify({"error": "Missing required fields"}), 400

    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters."}), 400

    if find_admin_by_user_id(user_id):
        return jsonify({"error": "User ID already exists"}), 409

    if find_admin_by_email(email):
        return jsonify({"error": "Email already exists"}), 409

    hashed_password = generate_password_hash(password)
    full_name = f"{first_name} {last_name}".strip()

    admin_data = {
        "first_name": first_name,
        "last_name": last_name,
        "full_name": full_name,
        "user_id": user_id,
        "email": email,
        "password": hashed_password,
        "created_at": datetime.datetime.utcnow()
    }

    create_admin(admin_data)
    return jsonify({"message": "Admin registered successfully"}), 201

# =========================================
# ✅ Auth: Login
# =========================================
@admin_bp.route('/api/admin/login', methods=['POST'])
def login_admin():
    data = request.get_json() or {}
    user_id = (data.get("user_id") or "").strip()
    password = data.get("password") or ""

    admin = find_admin_by_user_id(user_id)
    if not admin:
        return jsonify({"error": "Invalid User ID"}), 401

    if not check_password_hash(admin["password"], password):
        return jsonify({"error": "Incorrect password"}), 401

    token = jwt.encode({
        "user_id": user_id,
        "role": "admin",
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=12)
    }, secret_key, algorithm="HS256")

    return jsonify({
        "token": token,
        "message": "Login successful",
        "admin": {
            "user_id": admin.get("user_id"),
            "first_name": admin.get("first_name"),
            "last_name": admin.get("last_name"),
            "email": admin.get("email")
        }
    }), 200

# ==============================
# ✅ Admin Overview Endpoints
# ==============================
@admin_bp.route("/api/admin/overview/stats", methods=["GET"])
def get_stats():
    today = today_str_utc()
    attendance_today = 0
    for log in attendance_logs_col.find({"date": today}):
        attendance_today += len(log.get("students", []))

    spoof_today = spoof_col.count_documents({"date": today})
    for s in spoof_col.find({"timestamp": {"$exists": True}}):
        if to_date_str(s.get("timestamp")) == today:
            spoof_today += 1

    return jsonify({
        "total_students": students_col.count_documents({}),
        "total_instructors": instructors_col.count_documents({}),
        "total_classes": classes_col.count_documents({}),
        "attendance_today": attendance_today,
        "spoof_attempts_today": spoof_today,
    })

@admin_bp.route("/api/admin/overview/attendance-distribution", methods=["GET"])
def attendance_distribution():
    today = today_str_utc()
    present = late = absent = 0
    for log in attendance_logs_col.find({"date": today}):
        for stu in log.get("students", []):
            status = (stu.get("status") or "").strip().lower()
            if status == "present":
                present += 1
            elif status == "late":
                late += 1
            elif status == "absent":
                absent += 1
    return jsonify({"present": present, "late": late, "absent": absent})

@admin_bp.route("/api/admin/overview/attendance-trend", methods=["GET"])
def attendance_trend():
    days = int(request.args.get("days", 7))
    end_date = datetime.datetime.utcnow().date()
    trend = []
    for i in range(days):
        d = end_date - datetime.timedelta(days=(days - 1 - i))
        d_str = d.strftime("%Y-%m-%d")
        day_total = 0
        for log in attendance_logs_col.find({"date": d_str}):
            day_total += len(log.get("students", []))
        trend.append({"date": d_str, "count": day_total})
    return jsonify(trend)

@admin_bp.route("/api/admin/overview/recent-logs", methods=["GET"])
def recent_logs():
    limit = int(request.args.get("limit", 5))
    docs = list(attendance_logs_col.find().sort("date", -1).limit(20))
    flattened = []
    for log in docs:
        date = log.get("date")
        subject_title = log.get("subject_title")
        subject_code = log.get("subject_code")
        subject = f"{subject_code} - {subject_title}" if subject_code and subject_title else (subject_title or subject_code)
        for stu in log.get("students", []):
            flattened.append({
                "student": {
                    "first_name": stu.get("first_name"),
                    "last_name": stu.get("last_name"),
                    "student_id": stu.get("student_id"),
                },
                "subject": subject,
                "status": stu.get("status"),
                "timestamp": date,
            })
    flattened.sort(key=lambda x: str(x.get("timestamp") or ""), reverse=True)
    return jsonify(flattened[:limit])

@admin_bp.route("/api/admin/overview/last-spoof", methods=["GET"])
def last_spoof():
    spoof = spoof_col.find_one(sort=[("timestamp", -1)])
    if not spoof:
        return jsonify(None)
    return jsonify({
        "student": {
            "first_name": spoof.get("first_name"),
            "last_name": spoof.get("last_name"),
            "student_id": spoof.get("student_id"),
        },
        "subject": spoof.get("subject"),
        "reason": spoof.get("reason"),
        "detected_at": spoof.get("timestamp"),
    })

@admin_bp.route("/api/admin/overview/last-student", methods=["GET"])
def last_student():
    student = students_col.find_one(sort=[("created_at", -1)])
    if not student:
        return jsonify(None)
    return jsonify({
        "student_id": student.get("student_id"),
        "first_name": student.get("first_name"),
        "last_name": student.get("last_name"),
        "created_at": student.get("created_at"),
    })

# ==============================
# ✅ Student Management
# ==============================
@admin_bp.route("/api/admin/students", methods=["GET"])
def get_all_students():
    students = list(
        students_col.find(
            {},
            {"_id": 0, "student_id": 1, "First_Name": 1, "Last_Name": 1, "Middle_Name": 1, "Course": 1, "Section": 1},
        )
    )
    normalized = []
    for s in students:
        normalized.append({
            "student_id": s.get("student_id"),
            "first_name": s.get("First_Name"),
            "last_name": s.get("Last_Name"),
            "middle_name": s.get("Middle_Name"),
            "course": s.get("Course"),
            "section": s.get("Section"),
        })
    return jsonify(normalized)

@admin_bp.route("/api/admin/students/<student_id>", methods=["GET"])
def get_student(student_id):
    student = students_col.find_one({"student_id": student_id})
    if not student:
        return jsonify({"error": "Student not found"}), 404
    return jsonify({
        "student_id": student.get("student_id"),
        "first_name": student.get("First_Name"),
        "last_name": student.get("Last_Name"),
        "middle_name": student.get("Middle_Name"),
        "course": student.get("Course"),
    }), 200

@admin_bp.route("/api/admin/students/<student_id>", methods=["PUT"])
def update_student(student_id):
    data = request.get_json() or {}
    update_data = {}
    if "first_name" in data: update_data["First_Name"] = data["first_name"]
    if "last_name" in data: update_data["Last_Name"] = data["last_name"]
    if "middle_name" in data: update_data["Middle_Name"] = data["middle_name"]
    if "course" in data: update_data["Course"] = data["course"]

    if not update_data:
        return jsonify({"error": "No valid fields provided"}), 400

    result = students_col.update_one({"student_id": student_id}, {"$set": update_data})
    if result.matched_count == 0:
        return jsonify({"error": "Student not found"}), 404
    return jsonify({"message": "Student updated successfully"}), 200

@admin_bp.route("/api/admin/students/<student_id>", methods=["DELETE"])
def delete_student(student_id):
    result = students_col.delete_one({"student_id": student_id})
    if result.deleted_count == 0:
        return jsonify({"error": "Student not found"}), 404
    return jsonify({"message": "Student deleted successfully"}), 200

# ==============================
# ✅ Subject Management
# ==============================
@admin_bp.route("/api/admin/subjects", methods=["GET"])
def get_subjects():
    subjects = list(subjects_col.find().sort("created_at", -1))
    return jsonify([_serialize_subject(s) for s in subjects])

@admin_bp.route("/api/admin/subjects", methods=["POST"])
def create_subject():
    data = request.get_json() or {}

    # Validate required fields
    required_fields = ["subject_code", "subject_title", "course", "year_level", "semester"]
    if not all(data.get(field) for field in required_fields):
        return jsonify({"error": "Missing required fields"}), 400

    # Build subject document
    subject_doc = {
        "subject_code": data["subject_code"],
        "subject_title": data["subject_title"],
        "course": data["course"],
        "year_level": data["year_level"],
        "semester": data["semester"],
        "created_at": datetime.datetime.utcnow()
    }

    # Insert into Mongo
    result = subjects_col.insert_one(subject_doc)

    # Fetch the inserted subject to return full object
    new_subject = subjects_col.find_one({"_id": result.inserted_id})
    if new_subject:
        new_subject["_id"] = str(new_subject["_id"])  # make JSON safe

    return jsonify(new_subject), 201

@admin_bp.route("/api/admin/subjects/<id>", methods=["PUT"])
def update_subject(id):
    data = request.get_json() or {}
    update_data = {}
    for field in ["subject_code", "subject_title", "course", "year_level", "semester"]:
        if field in data:
            update_data[field] = data[field]

    result = subjects_col.update_one({"_id": ObjectId(id)}, {"$set": update_data})
    if result.matched_count == 0:
        return jsonify({"error": "Subject not found"}), 404
    return jsonify({"message": "Subject updated successfully"}), 200

@admin_bp.route("/api/admin/subjects/<id>", methods=["DELETE"])
def delete_subject(id):
    result = subjects_col.delete_one({"_id": ObjectId(id)})
    if result.deleted_count == 0:
        return jsonify({"error": "Subject not found"}), 404
    return jsonify({"message": "Subject deleted successfully"}), 200


# ✅ Class Management Serializer
def _serialize_class(cls):
    return {
        "_id": str(cls.get("_id")),
        "subject_id": str(cls.get("subject_id")) if cls.get("subject_id") else None,
        "subject_code": cls.get("subject_code") or "-",
        "subject_title": cls.get("subject_title") or "-",
        "course": cls.get("course") or "-",
        "year_level": cls.get("year_level") or "-",
        "semester": cls.get("semester") or "-",
        "section": cls.get("section") or "-",
        "instructor_id": str(cls.get("instructor_id")) if cls.get("instructor_id") else None,
        "instructor_first_name": cls.get("instructor_first_name") or "N/A",
        "instructor_last_name": cls.get("instructor_last_name") or "N/A",
        "schedule_blocks": cls.get("schedule_blocks", []),
        "students": cls.get("students", []),
        "created_at": cls.get("created_at").isoformat() if cls.get("created_at") else None,
    }

# ✅ Fetch all classes
@admin_bp.route("/api/classes", methods=["GET"])
def get_all_classes():
    classes = list(classes_col.find().sort("created_at", -1))
    return jsonify([_serialize_class(c) for c in classes]), 200

# ✅ Fetch single class
@admin_bp.route("/api/classes/<id>", methods=["GET"])
def get_class(id):
    try:
        cls = classes_col.find_one({"_id": ObjectId(id)})
    except Exception:
        return jsonify({"error": "Invalid class ID"}), 400

    if not cls:
        return jsonify({"error": "Class not found"}), 404
    return jsonify(_serialize_class(cls)), 200

# ✅ Update class (section, semester, schedule, instructor)
@admin_bp.route("/api/classes/<id>", methods=["PUT"])
def update_class(id):
    data = request.get_json() or {}
    update_data = {}

    for field in ["section", "semester", "schedule_blocks", 
                  "instructor_id", "instructor_first_name", "instructor_last_name"]:
        if field in data:
            update_data[field] = data[field]

    if not update_data:
        return jsonify({"error": "No valid fields provided"}), 400

    try:
        result = classes_col.update_one({"_id": ObjectId(id)}, {"$set": update_data})
    except Exception:
        return jsonify({"error": "Invalid class ID"}), 400

    if result.matched_count == 0:
        return jsonify({"error": "Class not found"}), 404

    return jsonify({"message": "Class updated successfully"}), 200

# ✅ Delete class
@admin_bp.route("/api/classes/<id>", methods=["DELETE"])
def delete_class(id):
    try:
        result = classes_col.delete_one({"_id": ObjectId(id)})
    except Exception:
        return jsonify({"error": "Invalid class ID"}), 400

    if result.deleted_count == 0:
        return jsonify({"error": "Class not found"}), 404

    return jsonify({"message": "Class deleted successfully"}), 200


# ✅ Instructor Management
# Get all instructors
@admin_bp.route("/api/instructors", methods=["GET"])
def get_all_instructors():
    instructors = list(instructors_col.find().sort("first_name", 1))
    formatted = []
    for instr in instructors:
        formatted.append({
            "_id": str(instr.get("_id")),
            "instructor_id": instr.get("instructor_id"),
            "first_name": instr.get("first_name"),
            "last_name": instr.get("last_name"),
            "email": instr.get("email")
        })
    return jsonify(formatted), 200


# ✅ Assign instructor to a class
@admin_bp.route("/api/classes/<class_id>/assign-instructor", methods=["PUT"])
def assign_instructor_to_class(class_id):
    data = request.get_json() or {}
    instructor_id = data.get("instructor_id")

    if not instructor_id:
        return jsonify({"error": "Instructor ID is required"}), 400

    # Find the instructor
    instructor = instructors_col.find_one({"instructor_id": instructor_id})
    if not instructor:
        return jsonify({"error": "Instructor not found"}), 404

    # Update the class with instructor info + attendance defaults
    update_data = {
        "instructor_id": instructor.get("instructor_id"),
        "instructor_first_name": instructor.get("first_name"),
        "instructor_last_name": instructor.get("last_name"),
        "is_attendance_active": False,
        "attendance_start_time": None,
        "attendance_end_time": None,
    }

    try:
        result = classes_col.update_one(
            {"_id": ObjectId(class_id)},
            {"$set": update_data}
        )
    except Exception:
        return jsonify({"error": "Invalid class ID"}), 400

    if result.matched_count == 0:
        return jsonify({"error": "Class not found"}), 404

    return jsonify({
        "message": "Instructor assigned successfully",
        "class_id": class_id,
        "instructor": {
            "instructor_id": update_data["instructor_id"],
            "first_name": update_data["instructor_first_name"],
            "last_name": update_data["instructor_last_name"],
        },
        "attendance_defaults": {
            "is_attendance_active": update_data["is_attendance_active"],
            "attendance_start_time": update_data["attendance_start_time"],
            "attendance_end_time": update_data["attendance_end_time"],
        }
    }), 200