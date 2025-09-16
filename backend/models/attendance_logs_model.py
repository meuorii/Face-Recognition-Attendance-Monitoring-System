from config.db_config import db
from datetime import datetime

attendance_logs_collection = db["attendance_logs"]

# -----------------------------
# Helpers
# -----------------------------
def _today_str():
    return datetime.now().strftime("%Y-%m-%d")


# ✅ Save/append attendance for a student under (subject_id, date)
def log_attendance(
    subject_data,
    student_data,
    subject_start_time=None
):
    """
    subject_data = {
        "subject_id": str,
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

    # ---- compute status (Present/Late) with cutoff (>30 mins = no log) ----
    now = datetime.now()
    status = "Present"
    if subject_start_time:
        minutes_late = (now - subject_start_time).total_seconds() / 60
        if 15 <= minutes_late <= 30:
            status = "Late"
        elif minutes_late > 30:
            print("⛔ Student too late. Attendance window closed.")
            return None

    date_str = _today_str()

    # ---- upsert document for this subject/date with metadata ----
    base_filter = {"subject_id": subject_data["subject_id"], "date": date_str}
    set_on_insert = {
        "subject_id": subject_data["subject_id"],
        "subject_code": subject_data.get("subject_code"),
        "subject_title": subject_data.get("subject_title"),
        "instructor_id": subject_data.get("instructor_id"),
        "instructor_first_name": subject_data.get("instructor_first_name"),
        "instructor_last_name": subject_data.get("instructor_last_name"),
        "course": subject_data.get("course"),
        "section": subject_data.get("section"),
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
                "students.$.status": status
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
                        "status": status
                    }
                }
            }
        )

    print(f"✅ {status} logged for {student_data['first_name']} {student_data['last_name']}")
    return {
        "subject_id": subject_data["subject_id"],
        "date": date_str,
        "student_id": student_data["student_id"],
        "status": status
    }


# ✅ Check if a student already has an entry today for a subject
def has_logged_today(student_id, subject_id, date_str=None):
    if not date_str:
        date_str = _today_str()
    return attendance_logs_collection.find_one({
        "subject_id": subject_id,
        "date": date_str,
        "students.student_id": student_id
    }) is not None


# ✅ Fetch all logs for a student (flattened per subject-date with that student's status)
def get_attendance_logs_by_student(student_id):
    docs = attendance_logs_collection.find(
        {"students.student_id": student_id},
        sort=[("date", -1)]
    )
    results = []
    for d in docs:
        # find that student's entry inside the array
        s = next((x for x in d.get("students", []) if x.get("student_id") == student_id), None)
        if s:
            results.append({
                "_id": d.get("_id"),
                "subject_id": d.get("subject_id"),
                "subject_code": d.get("subject_code"),
                "subject_title": d.get("subject_title"),
                "instructor_id": d.get("instructor_id"),
                "instructor_first_name": d.get("instructor_first_name"),
                "instructor_last_name": d.get("instructor_last_name"),
                "course": d.get("course"),
                "section": d.get("section"),
                "date": d.get("date"),
                "student": s  # { student_id, first_name, last_name, status }
            })
    return results


# ✅ Attendance Report by subject ID and date range (returns one doc per date with students array)
def get_attendance_logs_by_subject_and_date(subject_id, start_date, end_date):
    return list(attendance_logs_collection.find(
        {
            "subject_id": subject_id,
            "date": {"$gte": start_date, "$lte": end_date}
        },
        sort=[("date", 1)]
    ))


# ✅ (Optional) Bulk mark ABSENT for students not logged by cutoff
def mark_absent_bulk(subject_data, date_str, student_list):
    """
    student_list: [{student_id, first_name, last_name}, ...]
    Marks 'Absent' only if the student has no entry yet for that subject/date.
    """
    base_filter = {"subject_id": subject_data["subject_id"], "date": date_str}

    # ensure doc exists
    attendance_logs_collection.update_one(
        base_filter,
        {"$setOnInsert": {
            "subject_id": subject_data["subject_id"],
            "subject_code": subject_data.get("subject_code"),
            "subject_title": subject_data.get("subject_title"),
            "instructor_id": subject_data.get("instructor_id"),
            "instructor_first_name": subject_data.get("instructor_first_name"),
            "instructor_last_name": subject_data.get("instructor_last_name"),
            "course": subject_data.get("course"),
            "section": subject_data.get("section"),
            "date": date_str,
            "students": []
        }},
        upsert=True
    )

    for s in student_list:
        # only add if not present
        attendance_logs_collection.update_one(
            {**base_filter, "students.student_id": {"$ne": s["student_id"]}},
            {"$push": {"students": {
                "student_id": s["student_id"],
                "first_name": s["first_name"],
                "last_name": s["last_name"],
                "status": "Absent"
            }}}
        )
