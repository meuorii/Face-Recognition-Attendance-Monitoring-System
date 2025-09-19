from config.db_config import db
from datetime import datetime, timedelta

attendance_logs_collection = db["attendance_logs"]

# -----------------------------
# Helpers
# -----------------------------
def _today_date():
    """Return today's date normalized to midnight (datetime)."""
    return datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)

def _now_time_str():
    return datetime.now().strftime("%H:%M:%S")

def _parse_class_start_time(class_start_time):
    """
    Ensure class_start_time is a datetime object.
    Accepts datetime or string ("HH:MM" or "HH:MM:SS").
    """
    if not class_start_time:
        return None

    if isinstance(class_start_time, datetime):
        return class_start_time

    for fmt in ("%H:%M:%S", "%H:%M"):
        try:
            return datetime.strptime(class_start_time, fmt)
        except ValueError:
            continue
    return None


# ✅ Save/append attendance for a student under (class_id, date)
def log_attendance(class_data, student_data, status="Present", class_start_time=None):
    now = datetime.utcnow()
    today_date = _today_date()   # ✅ store as datetime, not string
    time_str = _now_time_str()

    # ---- compute status (Present/Late) ----
    parsed_start = _parse_class_start_time(class_start_time)
    if parsed_start:
        minutes_late = (now - parsed_start).total_seconds() / 60
        if 15 <= minutes_late <= 30:
            status = "Late"
        elif minutes_late > 30:
            print("⛔ Student too late. Attendance window closed.")
            return None

    # ---- upsert document for this class/date ----
    base_filter = {"class_id": class_data["class_id"], "date": today_date}
    set_on_insert = {
        "class_id": class_data["class_id"],
        "subject_code": class_data.get("subject_code"),
        "subject_title": class_data.get("subject_title"),
        "instructor_id": class_data.get("instructor_id"),
        "instructor_first_name": class_data.get("instructor_first_name"),
        "instructor_last_name": class_data.get("instructor_last_name"),
        "course": class_data.get("course"),
        "section": class_data.get("section"),
        "date": today_date,   # ✅ datetime
        "students": []
    }

    attendance_logs_collection.update_one(
        base_filter,
        {"$setOnInsert": set_on_insert},
        upsert=True
    )

    # ---- update existing student entry ----
    res_update = attendance_logs_collection.update_one(
        {**base_filter, "students.student_id": student_data["student_id"]},
        {
            "$set": {
                "students.$.first_name": student_data["first_name"],
                "students.$.last_name": student_data["last_name"],
                "students.$.status": status,
                "students.$.time": time_str
            }
        }
    )

    # ---- if not yet present, push ----
    if res_update.modified_count == 0:
        attendance_logs_collection.update_one(
            base_filter,
            {
                "$push": {
                    "students": {
                        "student_id": student_data["student_id"],
                        "first_name": student_data["first_name"],
                        "last_name": student_data["last_name"],
                        "status": status,
                        "time": time_str
                    }
                }
            }
        )

    print(f"✅ {status} logged for {student_data['first_name']} {student_data['last_name']}")
    return {
        "class_id": class_data["class_id"],
        "date": today_date.strftime("%Y-%m-%d"),  # ✅ safe for API
        "student_id": student_data["student_id"],
        "status": status,
        "time": time_str
    }


# ✅ Check if a student already has an entry today for a class
def has_logged_attendance(student_id, class_id, date_val=None):
    if not date_val:
        date_val = _today_date()
    elif isinstance(date_val, str):
        date_val = datetime.strptime(date_val, "%Y-%m-%d")

    return attendance_logs_collection.find_one({
        "class_id": class_id,
        "date": date_val,
        "students.student_id": student_id
    }) is not None


# ✅ Fetch logs for a student (flattened)
def get_attendance_logs_by_student(student_id):
    docs = attendance_logs_collection.find(
        {"students.student_id": student_id},
        sort=[("date", -1)]
    )
    results = []
    for d in docs:
        s = next((x for x in d.get("students", []) if x.get("student_id") == student_id), None)
        if s:
            results.append({
                "_id": str(d.get("_id")),
                "class_id": d.get("class_id"),
                "subject_code": d.get("subject_code"),
                "subject_title": d.get("subject_title"),
                "instructor_id": d.get("instructor_id"),
                "instructor_first_name": d.get("instructor_first_name"),
                "instructor_last_name": d.get("instructor_last_name"),
                "course": d.get("course"),
                "section": d.get("section"),
                "date": d.get("date").strftime("%Y-%m-%d"),  # ✅ always return string for API
                "student": s
            })
    return results


# ✅ Attendance Report by class ID and date range
def get_attendance_logs_by_class_and_date(class_id, start_date, end_date):
    start = datetime.strptime(start_date, "%Y-%m-%d") if start_date else None
    end = (datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1)) if end_date else None

    query = {"class_id": class_id}
    if start and end:
        query["date"] = {"$gte": start, "$lt": end}

    docs = attendance_logs_collection.find(query, sort=[("date", 1)])
    results = []
    for d in docs:
        for s in d.get("students", []):
            results.append({
                "_id": str(d.get("_id")),
                "class_id": d.get("class_id"),
                "date": d.get("date").strftime("%Y-%m-%d"),
                "student_id": s.get("student_id"),
                "first_name": s.get("first_name"),
                "last_name": s.get("last_name"),
                "status": s.get("status"),
                "time": s.get("time"),
            })
    return results


# ✅ Bulk mark ABSENT
def mark_absent_bulk(class_data, date_val, student_list):
    if isinstance(date_val, str):
        date_val = datetime.strptime(date_val, "%Y-%m-%d")

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

    time_str = _now_time_str()
    for s in student_list:
        attendance_logs_collection.update_one(
            {**base_filter, "students.student_id": {"$ne": s["student_id"]}},
            {"$push": {"students": {
                "student_id": s["student_id"],
                "first_name": s["first_name"],
                "last_name": s["last_name"],
                "status": "Absent",
                "time": time_str
            }}}
        )


# ✅ Indexes
def ensure_indexes():
    attendance_logs_collection.create_index([("class_id", 1), ("date", 1)], unique=False)
    attendance_logs_collection.create_index([("students.student_id", 1), ("date", 1)])
