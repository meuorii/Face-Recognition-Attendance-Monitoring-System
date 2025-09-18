from config.db_config import db
from datetime import datetime

attendance_logs_collection = db["attendance_logs"]

# -----------------------------
# Helpers
# -----------------------------
def _today_str():
    return datetime.now().strftime("%Y-%m-%d")


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

    try:
        # Try parsing string times
        return datetime.strptime(class_start_time, "%H:%M:%S")
    except ValueError:
        try:
            return datetime.strptime(class_start_time, "%H:%M")
        except ValueError:
            return None


# ✅ Save/append attendance for a student under (class_id, date)
def log_attendance(
    class_data,
    student_data,
    status="Present",
    class_start_time=None
):
    """
    class_data = {
        "class_id": str,
        "subject_code": str,
        "subject_title": str,
        "instructor_id": str,
        "instructor_first_name": str,
        "instructor_last_name": str,
        "course": str,
        "section": str
    }
    student_data = {
        "student_id": str,
        "first_name": str,
        "last_name": str
    }
    """

    now = datetime.now()

    # ---- compute status (Present/Late) with cutoff (>30 mins = no log) ----
    parsed_start = _parse_class_start_time(class_start_time)
    if parsed_start:
        minutes_late = (now - parsed_start).total_seconds() / 60
        if 15 <= minutes_late <= 30:
            status = "Late"
        elif minutes_late > 30:
            print("⛔ Student too late. Attendance window closed.")
            return None

    date_str = _today_str()
    time_str = _now_time_str()

    # ---- upsert document for this class/date with metadata ----
    base_filter = {"class_id": class_data["class_id"], "date": date_str}
    set_on_insert = {
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
    }

    attendance_logs_collection.update_one(
        base_filter,
        {"$setOnInsert": set_on_insert},
        upsert=True
    )

    # ---- first try to update existing student entry (if already present) ----
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

    # ---- if not present yet, push as new student entry ----
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
        "date": date_str,
        "student_id": student_data["student_id"],
        "status": status,
        "time": time_str
    }


# ✅ Check if a student already has an entry today for a class
def has_logged_attendance(student_id, class_id, date_str=None):
    if not date_str:
        date_str = _today_str()
    return attendance_logs_collection.find_one({
        "class_id": class_id,
        "date": date_str,
        "students.student_id": student_id
    }) is not None


# ✅ Fetch all logs for a student (flattened per class-date with that student's status)
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
                "date": d.get("date"),
                "student": s  # { student_id, first_name, last_name, status, time }
            })
    return results


# ✅ Attendance Report by class ID and date range (returns one doc per date with students array)
def get_attendance_logs_by_class_and_date(class_id, start_date, end_date):
    return list(attendance_logs_collection.find(
        {
            "class_id": class_id,
            "date": {"$gte": start_date, "$lte": end_date}
        },
        sort=[("date", 1)]
    ))


# ✅ Bulk mark ABSENT for students not logged by cutoff
def mark_absent_bulk(class_data, date_str, student_list):
    """
    student_list: [{student_id, first_name, last_name}, ...]
    Marks 'Absent' only if the student has no entry yet for that class/date.
    """
    base_filter = {"class_id": class_data["class_id"], "date": date_str}

    # ensure doc exists
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

    time_str = _now_time_str()

    for s in student_list:
        # only add if not present
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


# ✅ Maintenance: create useful indexes
def ensure_indexes():
    attendance_logs_collection.create_index(
        [("class_id", 1), ("date", 1)],
        unique=False
    )
    attendance_logs_collection.create_index(
        [("students.student_id", 1), ("date", 1)]
    )
