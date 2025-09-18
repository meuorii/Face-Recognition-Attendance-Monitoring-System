from config.db_config import db
from datetime import datetime

attendance_logs_collection = db["attendance_logs"]

# --------- Helpers ---------
def _today_str():
    return datetime.now().strftime("%Y-%m-%d")

def _now_time():
    return datetime.now().strftime("%H:%M:%S")

# ✅ Upsert a class/day log & add/update a student entry
def log_attendance(class_data, student_data, status="Present", date_str=None):
    """
    class_data: {
        "class_id": str,
        "subject_code": str,
        "subject_title": str,
        "instructor_id": str,
        "instructor_first_name": str,
        "instructor_last_name": str,
        "course": str,
        "section": str
    }
    student_data: {
        "student_id": str,
        "first_name": str,
        "last_name": str
    }
    status: "Present" | "Late" | "Absent"
    """
    if date_str is None:
        date_str = _today_str()

    base_filter = {"class_id": class_data["class_id"], "date": date_str}

    # Ensure the class/day document exists
    attendance_logs_collection.update_one(
        base_filter,
        {"$setOnInsert": {
            "class_id": class_data["class_id"],
            "subject_code": class_data.get("subject_code"),
            "subject_title": class_data.get("subject_title"),
            "instructor_id": class_data.get("instructor_id"),
            "instructor_first_name": class_data.get("instructor_first_name"),
            "instructor_last_name": class_data.get("instructor_last_name"),
            "course": class_data.get("course"),
            "section": class_data.get("section"),
            "date": date_str,
            "students": []
        }},
        upsert=True
    )

    # Try to update existing student entry first
    res = attendance_logs_collection.update_one(
        {**base_filter, "students.student_id": student_data["student_id"]},
        {"$set": {
            "students.$.first_name": student_data["first_name"],
            "students.$.last_name": student_data["last_name"],
            "students.$.status": status,
            "students.$.time": _now_time()
        }}
    )

    # If not present, push a new student entry
    if res.modified_count == 0:
        attendance_logs_collection.update_one(
            base_filter,
            {"$push": {"students": {
                "student_id": student_data["student_id"],
                "first_name": student_data["first_name"],
                "last_name": student_data["last_name"],
                "status": status,
                "time": _now_time()
            }}}
        )

# ✅ Check if the student already has an entry (for this class & date)
def has_logged_attendance(student_id, class_id, date_str=None):
    if date_str is None:
        date_str = _today_str()
    return attendance_logs_collection.find_one({
        "class_id": class_id,
        "date": date_str,
        "students.student_id": student_id
    }) is not None

# ✅ Get all class/day docs that include this student (with that student’s entry)
def get_attendance_by_student(student_id):
    docs = attendance_logs_collection.find(
        {"students.student_id": student_id}
    ).sort("date", -1)

    out = []
    for d in docs:
        s = next((x for x in d.get("students", []) if x.get("student_id") == student_id), None)
        if s:
            out.append({
                "_id": str(d.get("_id")),
                "class_id": d.get("class_id"),
                "subject_code": d.get("subject_code"),
                "subject_title": d.get("subject_title"),
                "instructor_id": d.get("instructor_id"),
                "instructor_first_name": d.get("instructor_first_name"),
                "instructor_last_name": d.get("instructor_last_name"),
                "course": d.get("course"),
                "section": d.get("section"),
                "date": d.get("date"),
                "student": s  # {student_id, first_name, last_name, status, time}
            })
    return out

# ✅ Get all logs by class (each doc = one date, with students[])
def get_attendance_by_class(class_id):
    return list(
        attendance_logs_collection.find({"class_id": class_id}).sort("date", 1)
    )

# ✅ Get logs in a date range for a class (each doc = one date, with students[])
def get_attendance_logs_by_class_and_date(class_id, start_date, end_date):
    return list(attendance_logs_collection.find(
        {
            "class_id": class_id,
            "date": {"$gte": start_date, "$lte": end_date}
        }
    ).sort("date", 1))

# ✅ Optional: bulk-mark ABSENT for students who didn’t log by cutoff
def mark_absent_bulk(class_data, date_str, student_list):
    base_filter = {"class_id": class_data["class_id"], "date": date_str}

    attendance_logs_collection.update_one(
        base_filter,
        {"$setOnInsert": {
            "class_id": class_data["class_id"],
            "subject_code": class_data.get("subject_code"),
            "subject_title": class_data.get("subject_title"),
            "instructor_id": class_data.get("instructor_id"),
            "instructor_first_name": class_data.get("instructor_first_name"),
            "instructor_last_name": class_data.get("instructor_last_name"),
            "course": class_data.get("course"),
            "section": class_data.get("section"),
            "date": date_str,
            "students": []
        }},
        upsert=True
    )

    for s in student_list:
        attendance_logs_collection.update_one(
            {**base_filter, "students.student_id": {"$ne": s["student_id"]}},
            {"$push": {"students": {
                "student_id": s["student_id"],
                "first_name": s["first_name"],
                "last_name": s["last_name"],
                "status": "Absent",
                "time": _now_time()
            }}}
        )

# ✅ Maintenance: create useful indexes
def ensure_indexes():
    attendance_logs_collection.create_index(
        [("class_id", 1), ("date", 1)],
        unique=False  # set to True if you want strict one doc per class/day
    )
    attendance_logs_collection.create_index(
        [("students.student_id", 1), ("date", 1)]
    )
