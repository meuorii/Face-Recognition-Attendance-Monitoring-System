from flask import Blueprint, jsonify, request, send_from_directory
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
from datetime import datetime
import os
import re
from werkzeug.utils import secure_filename
import pdfplumber  # ✅ for parsing COR PDFs

from config.db_config import db
from models.class_model import get_subjects_by_student
from models.attendance_logs_model import get_attendance_logs_by_student

student_bp = Blueprint("student", __name__)

students_collection = db["students"]
subjects_collection = db["subjects"]
classes_collection = db["classes"]
instructors_collection = db["instructors"]

# -----------------------------
# File Upload Config
# -----------------------------
UPLOAD_FOLDER = os.path.join(os.getcwd(), "uploads", "cor")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

ALLOWED_EXTENSIONS = {"pdf", "png", "jpg", "jpeg"}


def allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


# -----------------------------
# Helpers
# -----------------------------
def _to_serializable(o):
    if isinstance(o, ObjectId):
        return str(o)
    if isinstance(o, datetime):
        return o.isoformat()
    return o


def _doc_to_jsonable(doc: dict) -> dict:
    if not isinstance(doc, dict):
        return doc
    out = {}
    for k, v in doc.items():
        if isinstance(v, dict):
            out[k] = _doc_to_jsonable(v)
        elif isinstance(v, list):
            out[k] = [
                _doc_to_jsonable(x) if isinstance(x, dict) else _to_serializable(x)
                for x in v
            ]
        else:
            out[k] = _to_serializable(v)
    return out


def _list_to_jsonable(items):
    return [
        _doc_to_jsonable(x) if isinstance(x, dict) else _to_serializable(x)
        for x in items
    ]


# -----------------------------
# Routes
# -----------------------------

# ✅ Student Dashboard
@student_bp.route("/dashboard", methods=["GET"])
@jwt_required()
def student_dashboard():
    identity = get_jwt_identity()
    student_id = identity["student_id"] if isinstance(identity, dict) else identity

    return jsonify({
        "message": f"Welcome {identity.get('first_name','Student') if isinstance(identity, dict) else 'Student'}!",
        "student_id": student_id,
    }), 200


# ✅ Upload COR and auto-assign subjects
@student_bp.route("/upload-cor", methods=["POST"])
@jwt_required()
def upload_cor():
    identity = get_jwt_identity()
    student_id = str(identity["student_id"] if isinstance(identity, dict) else identity).strip()
    print(f"\n🎓 Uploading COR for student_id={student_id}")  # DEBUG

    student_doc = students_collection.find_one({"student_id": student_id})
    if not student_doc:
        return jsonify({"error": "Student not found"}), 404

    file = request.files.get("cor_file")
    if not file:
        return jsonify({"error": "No COR file uploaded"}), 400

    if not allowed_file(file.filename):
        return jsonify({"error": "Invalid file type. Allowed: PDF, PNG, JPG, JPEG"}), 400

    safe_name = secure_filename(file.filename)
    filename = f"{student_id}_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}_{safe_name}"
    save_path = os.path.join(UPLOAD_FOLDER, filename)
    file.save(save_path)
    print(f"📂 Saved COR file: {save_path}")  # DEBUG

    # -----------------------------
    # Step 1: Parse course/year/section/semester from COR
    # -----------------------------
    course, year_level, section, semester = None, None, None, None
    try:
        if filename.lower().endswith(".pdf"):
            with pdfplumber.open(save_path) as pdf:
                text = "\n".join([p.extract_text() or "" for p in pdf.pages])
            print("🔎 Extracted COR text:", text[:200], "...")  # DEBUG (first 200 chars)

            # Extract Course and Year Digit
            m = re.search(r"Course/?Yr:\s*([A-Z]+)\s*(\d)", text, re.IGNORECASE)
            if m:
                course = m.group(1).upper().strip()       # "BSINFOTECH"
                year_digit = m.group(2)                   # "4"
                year_level = f"{year_digit}th Year"       # "4th Year"

            # Extract Section (e.g., 4C)
            m2 = re.search(r"\b(\d[A-Z])\b", text)
            if m2:
                section = m2.group(1).upper()             # "4C"

            # Extract Semester
            m3 = re.search(r"(First|1st|Second|2nd)\s+Semester", text, re.IGNORECASE)
            if m3:
                sem_value = m3.group(1).lower()
                if sem_value in ["first", "1st"]:
                    semester = "1st Sem"
                elif sem_value in ["second", "2nd"]:
                    semester = "2nd Sem"

    except Exception as e:
        print("⚠️ PDF parsing error:", e)
        return jsonify({"error": "Failed to parse COR"}), 422

    if not all([course, year_level, section, semester]):
        return jsonify({
            "error": "Could not parse COR (missing course/year/section/semester)"
        }), 422

    print(f"✅ Parsed from COR: course={course}, year_level={year_level}, section={section}, semester={semester}")

    # -----------------------------
    # Step 2: Fetch subjects for block
    # -----------------------------
    subjects_cursor = subjects_collection.find({
        "course": course,
        "year_level": year_level,
        "semester": semester
    })

    assigned_subjects = []
    for subj in subjects_cursor:
        subject_id = str(subj["_id"])

        # Fetch instructor details if available
        instructor = None
        if subj.get("instructor_id"):
            instructor = instructors_collection.find_one({"instructor_id": subj["instructor_id"]})

        student_info = {
            "student_id": student_doc.get("student_id"),
            "first_name": student_doc.get("first_name", student_doc.get("First_Name", "")),
            "last_name": student_doc.get("last_name", student_doc.get("Last_Name", "")),
            "course": course,
            "year_level": year_level,
            "semester": semester,
            "section": section
        }

        # Upsert class
        class_doc = classes_collection.find_one({
            "subject_id": subject_id,
            "course": course,
            "year_level": year_level,
            "semester": semester,
            "section": section
        })

        if class_doc:
            classes_collection.update_one(
                {"_id": class_doc["_id"]},
                {"$addToSet": {"students": student_info}}
            )
        else:
            classes_collection.insert_one({
                "subject_id": subject_id,
                "subject_code": subj["subject_code"],
                "subject_title": subj.get("subject_title", ""),
                "course": course,
                "year_level": year_level,
                "semester": semester,
                "section": section,
                "instructor_id": subj.get("instructor_id"),
                "instructor_first_name": instructor.get("first_name") if instructor else None,
                "instructor_last_name": instructor.get("last_name") if instructor else None,
                "schedule_blocks": subj.get("schedule_blocks", []),
                "students": [student_info],
                "created_at": datetime.utcnow()
            })

        # Add subject code to student's profile
        students_collection.update_one(
            {"student_id": student_id},
            {"$addToSet": {"Subjects": subj["subject_code"]}}
        )

        assigned_subjects.append({
            "subject_code": subj["subject_code"],
            "subject_title": subj.get("subject_title", ""),
            "course": course,
            "year_level": year_level,
            "semester": semester,
            "section": section,
            "instructor_id": subj.get("instructor_id"),
            "instructor_first_name": instructor.get("first_name") if instructor else None,
            "instructor_last_name": instructor.get("last_name") if instructor else None,
            "schedule_blocks": subj.get("schedule_blocks", [])
        })


    return jsonify({
        "message": "COR uploaded successfully",
        "file": filename,
        "parsed": {
            "course": course,
            "year_level": year_level,
            "section": section,
            "semester": semester
        },
        "assigned_subjects": assigned_subjects
    }), 200


# ✅ Serve uploaded COR file
@student_bp.route("/cor-file/<filename>", methods=["GET"])
@jwt_required()
def get_cor_file(filename):
    try:
        return send_from_directory(UPLOAD_FOLDER, filename, as_attachment=False)
    except Exception:
        return jsonify({"error": "File not found"}), 404


# ✅ Assigned Subjects by student_id
@student_bp.route("/<student_id>/assigned-subjects", methods=["GET"])
@jwt_required()
def get_assigned_subjects(student_id):
    try:
        # query using string-based student_id
        subjects = get_subjects_by_student(student_id) or []
        return jsonify(_list_to_jsonable(subjects)), 200
    except Exception as e:
        print("❌ Error in assigned-subjects:", str(e))
        return jsonify({"error": str(e)}), 500


# ✅ Attendance Logs (with summary)
@student_bp.route("/<student_id>/attendance-logs", methods=["GET"])
@jwt_required()
def student_attendance_logs(student_id):
    try:
        logs = get_attendance_logs_by_student(student_id) or []

        # Ensure JSON serializable
        logs_json = _list_to_jsonable(logs)

        # Compute summary
        total_sessions = len(logs_json)
        present = sum(1 for l in logs_json if l.get("status") in ["Present", "Late"])
        absent = sum(1 for l in logs_json if l.get("status") == "Absent")
        late = sum(1 for l in logs_json if l.get("status") == "Late")

        attendance_rate = round((present / total_sessions) * 100, 2) if total_sessions > 0 else 0

        return jsonify({
            "logs": logs_json,
            "summary": {
                "totalSessions": total_sessions,
                "present": present,
                "absent": absent,
                "late": late,
                "attendanceRate": attendance_rate
            }
        }), 200

    except Exception as e:
        print("❌ Error in attendance-logs:", str(e))
        return jsonify({"error": str(e)}), 500


# ✅ Weekly Schedule
@student_bp.route("/schedule/<string:student_id>", methods=["GET"])
@jwt_required()
def get_student_schedule(student_id):
    try:
        subjects = get_subjects_by_student(student_id) or []

        # Build weekly schedule: group by day
        weekly_schedule = {}

        for subj in subjects:
            for block in subj.get("schedule_blocks", []):
                days = block.get("days", [])
                start = block.get("start")
                end = block.get("end")

                for day in days:
                    if day not in weekly_schedule:
                        weekly_schedule[day] = []

                    weekly_schedule[day].append({
                        "subject_code": subj.get("subject_code"),
                        "subject_title": subj.get("subject_title"),
                        "course": subj.get("course"),
                        "section": subj.get("section"),
                        "semester": subj.get("semester"),
                        "year_level": subj.get("year_level"),
                        "instructor_first_name": subj.get("instructor_first_name"),
                        "instructor_last_name": subj.get("instructor_last_name"),
                        "start": start,
                        "end": end
                    })

        # ✅ Sort schedules per day by start time
        for day, blocks in weekly_schedule.items():
            weekly_schedule[day] = sorted(blocks, key=lambda x: x["start"] or "")

        return jsonify(weekly_schedule), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ✅ Student Overview Endpoints
@student_bp.route("/<string:student_id>/overview", methods=["GET"])
@jwt_required()
def student_overview(student_id):
    try:
        # Fetch classes enrolled
        classes = list(classes_collection.find({"students.student_id": student_id}))
        total_classes = len(classes)

        # Total sessions (attendance logs count)
        total_sessions = db["attendance_logs"].count_documents({"students.student_id": student_id})

        # Aggregate attendance stats
        pipeline = [
            {"$match": {"students.student_id": student_id}},
            {"$unwind": "$students"},
            {"$match": {"students.student_id": student_id}},
            {"$group": {
                "_id": None,
                "total_records": {"$sum": 1},
                "present": {"$sum": {"$cond": [{"$eq": ["$students.status", "Present"]}, 1, 0]}},
                "absent": {"$sum": {"$cond": [{"$eq": ["$students.status", "Absent"]}, 1, 0]}},
                "late": {"$sum": {"$cond": [{"$eq": ["$students.status", "Late"]}, 1, 0]}},
            }},
        ]
        agg = list(db["attendance_logs"].aggregate(pipeline))

        total_records = agg[0]["total_records"] if agg else 0
        present = agg[0]["present"] if agg else 0
        absent = agg[0]["absent"] if agg else 0
        late = agg[0]["late"] if agg else 0

        attendance_rate = round((present / total_records) * 100, 2) if total_records else 0

        return jsonify({
            "totalClasses": total_classes,
            "totalSessions": total_sessions,
            "attendanceRate": attendance_rate,
            "present": present,
            "absent": absent,
            "late": late,
            "totalLate": late,
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ✅ Attendance Trend (daily with present, late, absent counts)
@student_bp.route("/<string:student_id>/overview/attendance-trend", methods=["GET"])
@jwt_required()
def student_attendance_trend(student_id):
    try:
        pipeline = [
            {"$match": {"students.student_id": student_id}},
            {"$unwind": "$students"},
            {"$match": {"students.student_id": student_id}},
            {
                "$group": {
                    "_id": "$date",
                    "present": {
                        "$sum": {
                            "$cond": [{"$eq": ["$students.status", "Present"]}, 1, 0]
                        }
                    },
                    "late": {
                        "$sum": {
                            "$cond": [{"$eq": ["$students.status", "Late"]}, 1, 0]
                        }
                    },
                    "absent": {
                        "$sum": {
                            "$cond": [{"$eq": ["$students.status", "Absent"]}, 1, 0]
                        }
                    },
                }
            },
            {"$sort": {"_id": 1}},
        ]

        trend = list(db["attendance_logs"].aggregate(pipeline))

        return jsonify(trend), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ✅ Subject Breakdown
@student_bp.route("/<string:student_id>/overview/subjects", methods=["GET"])
@jwt_required()
def student_subject_breakdown(student_id):
    try:
        pipeline = [
            {"$match": {"students.student_id": student_id}},
            {"$unwind": "$students"},
            {"$match": {"students.student_id": student_id}},
            {"$group": {
                "_id": {
                    "subject_code": "$subject_code",
                    "subject_title": "$subject_title"
                },
                "present": {"$sum": {"$cond": [{"$eq": ["$students.status", "Present"]}, 1, 0]}},
                "absent": {"$sum": {"$cond": [{"$eq": ["$students.status", "Absent"]}, 1, 0]}},
                "late": {"$sum": {"$cond": [{"$eq": ["$students.status", "Late"]}, 1, 0]}},
                "total": {"$sum": 1}
            }},
            {"$project": {
                "_id": 0,
                "subject_code": "$_id.subject_code",
                "subject_title": "$_id.subject_title",
                "present": 1,
                "absent": 1,
                "late": 1,
                "rate": {
                    "$cond": [
                        {"$eq": ["$total", 0]},
                        0,
                        {"$round": [{"$divide": ["$present", "$total"]}, 2]}
                    ]
                }
            }}
        ]
        subjects = list(db["attendance_logs"].aggregate(pipeline))
        return jsonify(subjects), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ✅ Recent Attendance Logs
@student_bp.route("/<string:student_id>/overview/recent-logs", methods=["GET"])
@jwt_required()
def student_recent_logs(student_id):
    try:
        logs = list(db["attendance_logs"].find(
            {"students.student_id": student_id},
            {"_id": 0, "date": 1, "subject_code": 1, "subject_title": 1, "students": 1}
        ).sort("date", -1).limit(10))

        results = []
        for log in logs:
            for s in log.get("students", []):
                if s.get("student_id") == student_id:
                    results.append({
                        "date": log.get("date"),
                        "subject_code": log.get("subject_code"),
                        "subject_title": log.get("subject_title"),
                        "status": s.get("status"),
                        "time": s.get("time"),
                    })
        return jsonify(results), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

