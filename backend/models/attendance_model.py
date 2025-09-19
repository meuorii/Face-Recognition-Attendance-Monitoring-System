from config.db_config import db
from datetime import datetime, timedelta

attendance_logs_collection = db["attendance_logs"]

# --------- Helpers ---------
def _today_date():
    """Return today's date normalized to midnight (datetime)."""
    return datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)

def _parse_date(date_val):
    """Parse input string/datetime -> normalized datetime (midnight)."""
    if isinstance(date_val, datetime):
        return date_val.replace(hour=0, minute=0, second=0, microsecond=0)
    if isinstance(date_val, str):
        try:
            return datetime.strptime(date_val, "%Y-%m-%d")
        except ValueError:
            return _today_date()
    return _today_date()

def _now_time():
    return datetime.now().strftime("%H:%M:%S")


# ✅ Upsert a class/day log & add/update a student entry
def log_attendance(class_data, student_data, status="Present", date_val=None):
    if date_val is None:
        date_val = _today_date()
    else:
        date_val = _parse_date(date_val)

    base_filter = {"class_id": class_data["class_id"], "date": date_val}

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
            "date": date_val,
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


# ✅ Check if the student already has an entry
def has_logged_attendance(student_id, class_id, date_val=None):
    if date_val is None:
        date_val = _today_date()
    else:
        date_val = _parse_date(date_val)

    return attendance_logs_collection.find_one({
        "class_id": class_id,
        "date": date_val,
        "students.student_id": student_id
    }) is not None


# ✅ Get all class/day docs that include this student
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
                "date": d.get("date").strftime("%Y-%m-%d"),  # ✅ return as string
                "student": s
            })
    return out


# ✅ Get all logs by class
def get_attendance_by_class(class_id):
    docs = attendance_logs_collection.find({"class_id": class_id}).sort("date", 1)
    out = []
    for d in docs:
        out.append({
            **d,
            "_id": str(d["_id"]),
            "date": d["date"].strftime("%Y-%m-%d")
        })
    return out


# ✅ Get logs in a date range for a class
def get_attendance_logs_by_class_and_date(class_id, start_date, end_date):
    start = _parse_date(start_date)
    end = _parse_date(end_date) + timedelta(days=1)

    docs = attendance_logs_collection.find(
        {"class_id": class_id, "date": {"$gte": start, "$lt": end}}
    ).sort("date", 1)

    out = []
    for d in docs:
        for s in d.get("students", []):
            out.append({
                "_id": str(d.get("_id")),
                "class_id": d.get("class_id"),
                "date": d.get("date").strftime("%Y-%m-%d"),
                "student_id": s.get("student_id"),
                "first_name": s.get("first_name"),
                "last_name": s.get("last_name"),
                "status": s.get("status"),
                "time": s.get("time"),
            })
    return out


# ✅ Bulk-mark ABSENT
def mark_absent_bulk(class_data, date_val, student_list):
    date_val = _parse_date(date_val)
    base_filter = {"class_id": class_data["class_id"], "date": date_val}

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
            "date": date_val,
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


# ✅ Maintenance: indexes
def ensure_indexes():
    attendance_logs_collection.create_index([("class_id", 1), ("date", 1)], unique=False)
    attendance_logs_collection.create_index([("students.student_id", 1), ("date", 1)])
