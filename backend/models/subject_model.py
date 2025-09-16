from config.db_config import db
from bson import ObjectId
from datetime import datetime

subjects_collection = db["subjects"]

# ✅ Create a new subject (with created_at, year_level, semester)
def create_subject(subject_data):
    subject_data["created_at"] = datetime.utcnow()
    subject_data.setdefault("year_level", None)
    subject_data.setdefault("semester", None)
    return subjects_collection.insert_one(subject_data)

# ✅ Find a subject by subject_code (avoid duplicates / match COR)
def get_subject_by_code(subject_code):
    return subjects_collection.find_one({"subject_code": subject_code})

# ✅ Get one subject by Mongo _id
def get_subject_by_id(subject_id):
    return subjects_collection.find_one({"_id": ObjectId(subject_id)})

# ✅ Get subjects for a course (all year levels & semesters)
def get_subjects_by_course(course):
    return list(subjects_collection.find({"course": course}))

# ✅ Get subjects for a specific course + year_level
def get_subjects_by_course_year(course, year_level):
    return list(subjects_collection.find({
        "course": course,
        "year_level": year_level
    }))

# ✅ Get subjects for a specific course + semester
def get_subjects_by_course_semester(course, semester):
    return list(subjects_collection.find({
        "course": course,
        "semester": semester
    }))

# ✅ Get subjects for a specific course + year_level + semester
def get_subjects_by_course_year_semester(course, year_level, semester):
    return list(subjects_collection.find({
        "course": course,
        "year_level": year_level,
        "semester": semester
    }))

# ✅ Get all subjects created by an instructor
def get_subjects_by_instructor(instructor_id):
    return list(subjects_collection.find({"instructor_id": instructor_id}))

# ✅ Get ALL subjects (optionally filter by semester or year_level)
def list_all_subjects(year_level=None, semester=None):
    query = {}
    if year_level:
        query["year_level"] = year_level
    if semester:
        query["semester"] = semester
    return list(subjects_collection.find(query))

# ✅ Activate / deactivate attendance session
def update_subject_attendance_status(subject_id, is_active, activated_by=None):
    update_data = {
        "is_attendance_active": is_active,
        "attendance_start_time": datetime.utcnow() if is_active else None
    }

    if is_active:
        update_data["last_activated_by"] = activated_by
        update_data["last_activated_at"] = datetime.utcnow()
    else:
        update_data["last_activated_by"] = None
        update_data["last_activated_at"] = None

    result = subjects_collection.update_one(
        {"_id": ObjectId(subject_id)},
        {"$set": update_data}
    )

    if result.modified_count == 0:
        print(f"⚠️ Subject {subject_id} not updated. Maybe wrong ObjectId?")
    else:
        print(f"✅ Updated subject {subject_id} → {update_data}")

    return result
