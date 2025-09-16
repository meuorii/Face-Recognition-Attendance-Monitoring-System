import datetime
from bson import ObjectId
from config.db_config import db
from models.attendance_model import has_logged_attendance

classes_collection = db["classes"]

attendance_active = False
current_class_id = None


def _today_str_utc():
    return datetime.datetime.utcnow().date().isoformat()


def refresh_session_state_from_db():
    global attendance_active, current_class_id
    active = classes_collection.find_one({"is_attendance_active": True}, {"_id": 1})
    if active:
        attendance_active = True
        current_class_id = str(active["_id"])
    else:
        attendance_active = False
        current_class_id = None


def start_attendance_session(class_id, instructor_id=None):
    global attendance_active, current_class_id

    active = classes_collection.find_one({"is_attendance_active": True})
    if active:
        print(f"⚠️ Attendance session already running for {active['_id']}")
        return False

    result = classes_collection.update_one(
        {"_id": ObjectId(class_id)},
        {"$set": {
            "is_attendance_active": True,
            "attendance_start_time": datetime.datetime.utcnow(),
            "attendance_end_time": None,
            "activated_by": instructor_id or "system"
        }}
    )

    if result.modified_count == 0:
        print(f"⚠️ Class {class_id} not updated (maybe wrong ObjectId?)")
        attendance_active = False
        current_class_id = None
        return False

    attendance_active = True
    current_class_id = class_id
    print(f"✅ Attendance session started for class {class_id}")
    return True


def stop_attendance_session(class_id=None):
    global attendance_active, current_class_id

    if not attendance_active:
        active = classes_collection.find_one({"is_attendance_active": True}, {"_id": 1})
        if not active:
            print("⚠️ No active session to stop")
            return False
        current_class_id = str(active["_id"])

    if class_id and class_id != current_class_id:
        print(f"⚠️ Tried to stop session for {class_id}, but active session is {current_class_id}")
        return False

    result = classes_collection.update_one(
        {"_id": ObjectId(current_class_id), "is_attendance_active": True},
        {"$set": {
            "is_attendance_active": False,
            "attendance_end_time": datetime.datetime.utcnow()
        }}
    )

    if result.modified_count == 0:
        print(f"⚠️ Class {current_class_id} not updated on stop")
        return False

    print(f"🛑 Attendance session stopped for class {current_class_id}")
    attendance_active = False
    current_class_id = None
    return True


def already_logged_today(student_id, class_id, date_str=None):
    if date_str is None:
        date_str = _today_str_utc()
    return has_logged_attendance(student_id, class_id, date_str)
