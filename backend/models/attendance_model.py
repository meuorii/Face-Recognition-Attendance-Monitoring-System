from config.db_config import db
from datetime import datetime, timedelta, timezone

attendance_logs_collection = db["attendance_logs"]

# -----------------------------
# Timezone Setup
# -----------------------------
PH_TZ = timezone(timedelta(hours=8))  # GMT+8 Philippine Time

# -----------------------------
# Helpers
# -----------------------------
def _today_date_str():
    """Return today's date as YYYY-MM-DD string (PH time)."""
    return datetime.now(PH_TZ).strftime("%Y-%m-%d")

def _parse_date_str(date_val):
    """Parse input string/datetime -> YYYY-MM-DD string (PH time)."""
    if isinstance(date_val, datetime):
        if date_val.tzinfo is None:
            date_val = date_val.replace(tzinfo=PH_TZ)
        return date_val.astimezone(PH_TZ).strftime("%Y-%m-%d")
    if isinstance(date_val, str):
        try:
            datetime.strptime(date_val, "%Y-%m-%d")
            return date_val
        except ValueError:
            return _today_date_str()
    return _today_date_str()

def _now_time_str():
    """Return HH:MM:SS in PH time (string for display)."""
    return datetime.now(PH_TZ).strftime("%H:%M:%S")

def _now_datetime():
    """Return current datetime in PH (tz-aware, stored in Mongo)."""
    return datetime.now(PH_TZ)

# -----------------------------
# Attendance Logging
# -----------------------------
def log_attendance(class_data, student_data, status="Present", date_val=None, class_start_time=None):
    now = _now_datetime()
    if date_val is None:
        date_val = _today_date_str()
    else:
        date_val = _parse_date_str(date_val)

    # ---- compute status (Present/Late/Too Late) ----
    if class_start_time:
        if isinstance(class_start_time, str):
            try:
                class_start_time = datetime.fromisoformat(
                    class_start_time.replace("Z", "+00:00")
                ).astimezone(PH_TZ)
            except Exception:
                class_start_time = None
        if isinstance(class_start_time, datetime):
            if class_start_time.tzinfo is None:
                class_start_time = class_start_time.replace(tzinfo=PH_TZ)
            minutes_late = (now - class_start_time).total_seconds() / 60
            if 15 <= minutes_late < 30:
                status = "Late"
            elif minutes_late >= 30:
                print("⛔ Too late (>30 min). No log created.")
                return None

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
            "date": date_val,   # ✅ stored as string
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
            "students.$.time": _now_time_str(),
            "students.$.time_logged": now   # ✅ real datetime
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
                "time": _now_time_str(),
                "time_logged": now   # ✅ real datetime
            }}}
        )

# -----------------------------
# Queries
# -----------------------------
def has_logged_attendance(student_id, class_id, date_val=None):
    date_val = _parse_date_str(date_val) if date_val else _today_date_str()
    return attendance_logs_collection.find_one({
        "class_id": class_id,
        "date": date_val,
        "students.student_id": student_id
    }) is not None

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
                "date": d.get("date"),  # ✅ string
                "student": {
                    **s,
                    "time_logged": s.get("time_logged").astimezone(PH_TZ).strftime("%Y-%m-%d %H:%M:%S")
                    if isinstance(s.get("time_logged"), datetime) else s.get("time_logged")
                }
            })
    return out

def get_attendance_by_class(class_id):
    docs = attendance_logs_collection.find({"class_id": class_id}).sort("date", 1)
    out = []
    for d in docs:
        out.append({
            **d,
            "_id": str(d["_id"]),
            "date": d["date"]  # ✅ already stored as string
        })
    return out

def get_attendance_logs_by_class_and_date(class_id, start_date, end_date):
    start = _parse_date_str(start_date)
    end = _parse_date_str(end_date)

    docs = attendance_logs_collection.find(
        {"class_id": class_id, "date": {"$gte": start, "$lte": end}}
    ).sort("date", 1)

    out = []
    for d in docs:
        for s in d.get("students", []):
            out.append({
                "_id": str(d.get("_id")),
                "class_id": d.get("class_id"),
                "date": d.get("date"),  # ✅ string
                "student_id": s.get("student_id"),
                "first_name": s.get("first_name"),
                "last_name": s.get("last_name"),
                "status": s.get("status"),
                "time": s.get("time"),
                "time_logged": s.get("time_logged").astimezone(PH_TZ).strftime("%Y-%m-%d %H:%M:%S")
                if isinstance(s.get("time_logged"), datetime) else s.get("time_logged")
            })
    return out

def mark_absent_bulk(class_data, date_val, student_list):
    date_val = _parse_date_str(date_val)
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
            "date": date_val,  # ✅ string
            "students": []
        }},
        upsert=True
    )

    now = _now_datetime()
    for s in student_list:
        attendance_logs_collection.update_one(
            {**base_filter, "students.student_id": {"$ne": s["student_id"]}},
            {"$push": {"students": {
                "student_id": s["student_id"],
                "first_name": s["first_name"],
                "last_name": s["last_name"],
                "status": "Absent",
                "time": _now_time_str(),
                "time_logged": now  # ✅ datetime
            }}}
        )

# -----------------------------
# Maintenance
# -----------------------------
def ensure_indexes():
    attendance_logs_collection.create_index([("class_id", 1), ("date", 1)], unique=False)
    attendance_logs_collection.create_index([("students.student_id", 1), ("date", 1)])
