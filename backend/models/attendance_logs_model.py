from config.db_config import db
from datetime import datetime, timedelta, timezone

attendance_logs_collection = db["attendance_logs"]
classes_collection = db["classes"]

# -----------------------------
# Timezone Setup
# -----------------------------
PH_TZ = timezone(timedelta(hours=8))  # GMT+8 Philippine Time


# -----------------------------
# Helpers
# -----------------------------
def _today_date_str():
    """Return today's date as YYYY-MM-DD (PH time, string)."""
    return datetime.now(PH_TZ).strftime("%Y-%m-%d")


def _now_time_str():
    """Return current time HH:MM:SS (PH time)."""
    return datetime.now(PH_TZ).strftime("%H:%M:%S")


def _now_datetime():
    """Return current datetime (PH time, with tzinfo)."""
    return datetime.now(PH_TZ)


def _parse_date_str(date_val):
    """Parse string/datetime into YYYY-MM-DD string (PH time)."""
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


def _parse_class_start_time(class_start_time):
    """Parse attendance_start_time into datetime (PH local time)."""
    if not class_start_time:
        return None
    if isinstance(class_start_time, datetime):
        if class_start_time.tzinfo is None:
            return class_start_time.replace(tzinfo=PH_TZ)
        return class_start_time.astimezone(PH_TZ)

    try:
        parsed = datetime.fromisoformat(str(class_start_time).replace("Z", "+00:00"))
        return parsed.astimezone(PH_TZ)
    except Exception:
        pass

    for fmt in ("%H:%M:%S", "%H:%M"):
        try:
            parsed = datetime.strptime(class_start_time, fmt)
            return datetime.now(PH_TZ).replace(
                hour=parsed.hour, minute=parsed.minute,
                second=getattr(parsed, "second", 0), microsecond=0
            )
        except ValueError:
            continue
    return None


# -----------------------------
# Session Control
# -----------------------------
def close_attendance_session(class_id: str):
    """Mark attendance session as closed for a class."""
    classes_collection.update_one(
        {"class_id": class_id},
        {"$set": {"is_attendance_active": False, "active_session_id": None}}
    )
    print(f"⛔ Attendance session auto-closed for class {class_id}")


# -----------------------------
# Attendance Functions
# -----------------------------
def log_attendance(class_data, student_data, status="Present", class_start_time=None):
    now = _now_datetime()          # full datetime in PH
    today_date = _today_date_str() # string date
    time_str = _now_time_str()

    # ---- Late computation ----
    parsed_start = _parse_class_start_time(class_start_time)
    if parsed_start:
        minutes_late = (now - parsed_start).total_seconds() / 60
        if 1 <= minutes_late < 15:
            status = "Late"
        elif minutes_late >= 30:
            close_attendance_session(class_data["class_id"])
            print("⛔ Too late. Attendance window closed.")
            return None

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
        "date": today_date,    # ✅ stored as string YYYY-MM-DD
        "students": []
    }

    attendance_logs_collection.update_one(
        base_filter,
        {"$setOnInsert": set_on_insert},
        upsert=True
    )

    res_update = attendance_logs_collection.update_one(
        {**base_filter, "students.student_id": student_data["student_id"]},
        {"$set": {
            "students.$.first_name": student_data["first_name"],
            "students.$.last_name": student_data["last_name"],
            "students.$.status": status,
            "students.$.time": time_str,
            "students.$.time_logged": now   # ✅ real datetime
        }}
    )

    if res_update.modified_count == 0:
        attendance_logs_collection.update_one(
            base_filter,
            {"$push": {"students": {
                "student_id": student_data["student_id"],
                "first_name": student_data["first_name"],
                "last_name": student_data["last_name"],
                "status": status,
                "time": time_str,
                "time_logged": now
            }}}
        )

    print(f"✅ {status} logged for {student_data['first_name']} {student_data['last_name']}")
    return {
        "class_id": class_data["class_id"],
        "date": today_date,
        "student_id": student_data["student_id"],
        "status": status,
        "time": time_str
    }


def has_logged_attendance(student_id, class_id, date_val=None):
    date_val = _parse_date_str(date_val) if date_val else _today_date_str()
    return attendance_logs_collection.find_one({
        "class_id": class_id,
        "date": date_val,
        "students.student_id": student_id
    }) is not None


def get_attendance_logs_by_student(student_id):
    docs = attendance_logs_collection.find(
        {"students.student_id": student_id}
    ).sort("date", -1)

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

                # 🔽 Flattened student fields
                "student_id": s.get("student_id"),
                "first_name": s.get("first_name"),
                "last_name": s.get("last_name"),
                "status": s.get("status"),
                "time": s.get("time"),
                "time_logged": (
                    s.get("time_logged").astimezone(PH_TZ).strftime("%H:%M:%S")
                    if isinstance(s.get("time_logged"), datetime)
                    else s.get("time_logged")
                ),
            })
    return results



def get_attendance_logs_by_class_and_date(class_id, start_date, end_date):
    start = _parse_date_str(start_date)
    end = _parse_date_str(end_date)

    docs = attendance_logs_collection.find(
        {"class_id": class_id, "date": {"$gte": start, "$lte": end}}
    ).sort("date", 1)

    results = []
    for d in docs:
        for s in d.get("students", []):
            results.append({
                "_id": str(d.get("_id")),
                "class_id": d.get("class_id"),
                "date": d.get("date"),
                "student_id": s.get("student_id"),
                "first_name": s.get("first_name"),
                "last_name": s.get("last_name"),
                "status": s.get("status"),
                "time": s.get("time"),
                "time_logged": s.get("time_logged").astimezone(PH_TZ).strftime("%H:%M:%S")
                if isinstance(s.get("time_logged"), datetime) else s.get("time_logged")
            })
    return results


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
            "date": date_val,
            "students": []
        }},
        upsert=True
    )

    now = _now_datetime()
    time_str = _now_time_str()
    for s in student_list:
        attendance_logs_collection.update_one(
            {**base_filter, "students.student_id": {"$ne": s["student_id"]}},
            {"$push": {"students": {
                "student_id": s["student_id"],
                "first_name": s["first_name"],
                "last_name": s["last_name"],
                "status": "Absent",
                "time": time_str,
                "time_logged": now
            }}}
        )


def ensure_indexes():
    attendance_logs_collection.create_index([("class_id", 1), ("date", 1)], unique=False)
    attendance_logs_collection.create_index([("students.student_id", 1), ("date", 1)])
