from config.db_config import db
from datetime import datetime
from bson import ObjectId

classes_collection = db["classes"]
students_collection = db["students"]
subjects_collection = db["subjects"]
instructors_collection = db["instructors"]

# ✅ Normalize schedule blocks consistently
def normalize_schedule_blocks(blocks):
    normalized = []
    for block in blocks or []:
        normalized.append({
            "days": block.get("days", []),
            "start": block.get("start", ""),
            "end": block.get("end", "")
        })
    return normalized


# ✅ Assign student to a class (manual/admin or auto)
def assign_student_to_subject(student_id, subject_id, course=None, year_level=None, section=None, semester=None):
    student = students_collection.find_one({
        "$or": [
            {"student_id": student_id},
            {"Student_ID": student_id}
        ]
    })
    if not student:
        return {"error": "Student not found"}

    subject = subjects_collection.find_one({"_id": ObjectId(subject_id)})
    if not subject:
        return {"error": "Subject not found"}

    instructor = instructors_collection.find_one({
        "instructor_id": subject.get("instructor_id")
    })

    student_info = {
        "student_id": student.get("student_id") or student.get("Student_ID"),
        "first_name": student.get("first_name") or student.get("First_Name"),
        "last_name": student.get("last_name") or student.get("Last_Name"),
        "course": course or student.get("course") or student.get("Course"),
        "section": section or student.get("section") or student.get("Section"),
        "year_level": year_level or subject.get("year_level"),
        "semester": semester or subject.get("semester")
    }

    # ✅ Ensure uniqueness by subject + block
    class_doc = classes_collection.find_one({
        "subject_id": str(subject_id),
        "course": student_info["course"],
        "year_level": str(student_info["year_level"]),
        "semester": student_info["semester"],
        "section": student_info["section"]
    })

    if class_doc:
        if not any(s["student_id"] == student_info["student_id"] for s in class_doc.get("students", [])):
            classes_collection.update_one(
                {"_id": class_doc["_id"]},
                {"$push": {"students": student_info}}
            )
    else:
        new_class = {
            "subject_id": str(subject_id),
            "subject_code": subject.get("subject_code"),
            "subject_title": subject.get("subject_title"),
            "instructor_id": subject.get("instructor_id"),
            "instructor_first_name": instructor.get("first_name", "N/A") if instructor else "N/A",
            "instructor_last_name": instructor.get("last_name", "N/A") if instructor else "N/A",
            "course": student_info["course"],
            "section": student_info["section"],
            "year_level": str(student_info["year_level"]),
            "semester": student_info["semester"],
            "schedule_blocks": normalize_schedule_blocks(subject.get("schedule_blocks", [])),
            "students": [student_info],
            "created_at": datetime.utcnow()
        }
        classes_collection.insert_one(new_class)

    return {"message": f"Student {student_id} assigned to {subject.get('subject_code')}"}


# ✅ Assign student via COR (using parsed block info)
def assign_student_from_cor(student, subject_doc, section, year_level, semester):
    subject_id = str(subject_doc["_id"])

    student_info = {
        "student_id": student.get("student_id") or student.get("Student_ID"),
        "first_name": student.get("first_name") or student.get("First_Name"),
        "last_name": student.get("last_name") or student.get("Last_Name"),
        "course": student.get("course") or student.get("Course"),
        "section": section or student.get("section") or student.get("Section"),
        "year_level": year_level,
        "semester": semester
    }

    class_doc = classes_collection.find_one({
        "subject_id": subject_id,
        "course": student_info["course"],
        "year_level": str(year_level),
        "semester": semester,
        "section": student_info["section"]
    })

    if class_doc:
        if not any(s["student_id"] == student_info["student_id"] for s in class_doc.get("students", [])):
            classes_collection.update_one(
                {"_id": class_doc["_id"]},
                {"$push": {"students": student_info}}
            )
    else:
        new_class = {
            "subject_id": subject_id,
            "subject_code": subject_doc.get("subject_code"),
            "subject_title": subject_doc.get("subject_title"),
            "course": student_info["course"],
            "section": student_info["section"],
            "year_level": str(year_level),
            "semester": semester,
            "schedule_blocks": normalize_schedule_blocks(subject_doc.get("schedule_blocks", [])),
            "students": [student_info],
            "created_at": datetime.utcnow()
        }
        classes_collection.insert_one(new_class)

    return {"message": "Student assigned from COR successfully"}


# ✅ Auto-assign matching students to subject (bulk for same block)
def auto_assign_matching_students(subject_id, course, year_level, section, semester):
    matching_students = students_collection.find({
        "$or": [
            {"course": course, "year_level": str(year_level), "section": section, "semester": semester},
            {"Course": course, "Year_Level": str(year_level), "Section": section, "Semester": semester}
        ]
    })

    for student in matching_students:
        student_id = student.get("student_id") or student.get("Student_ID")
        if student_id:
            assign_student_to_subject(student_id, subject_id, course, year_level, section, semester)


# ✅ Get all student-class entries for a subject
def get_students_by_subject(subject_id, course=None, year_level=None, section=None, semester=None):
    query = {"subject_id": str(subject_id)}
    if course: query["course"] = course
    if year_level: query["year_level"] = str(year_level)
    if section: query["section"] = section
    if semester: query["semester"] = semester
    return list(classes_collection.find(query))


# ✅ Get all subjects a student is enrolled in
def get_subjects_by_student(student_id):
    if not student_id:
        return []

    student_id = str(student_id).strip()
    assignments = list(classes_collection.find({
        "students.student_id": student_id
    }))

    subjects = []
    for cls in assignments:
        subjects.append({
            "subject_code": cls.get("subject_code", ""),
            "subject_title": cls.get("subject_title", ""),
            "schedule_blocks": normalize_schedule_blocks(cls.get("schedule_blocks", [])),
            "course": cls.get("course", ""),
            "section": cls.get("section", ""),
            "year_level": cls.get("year_level", ""),
            "semester": cls.get("semester", ""),
            "instructor_first_name": cls.get("instructor_first_name", "N/A"),
            "instructor_last_name": cls.get("instructor_last_name", "N/A")
        })

    return subjects


# ✅ Get all classes with subject + students
def get_all_classes_with_details():
    classes = list(classes_collection.find())
    results = []

    for cls in classes:
        subject = subjects_collection.find_one({"_id": ObjectId(cls["subject_id"])})
        results.append({
            "class_id": str(cls.get("_id")),
            "students": cls.get("students", []),
            "subject": {
                "subject_id": str(subject.get("_id")) if subject else None,
                "subject_code": subject.get("subject_code", "N/A") if subject else "N/A",
                "subject_title": subject.get("subject_title", "N/A") if subject else "N/A",
                "course": cls.get("course", "N/A"),
                "section": cls.get("section", "N/A"),
                "year_level": cls.get("year_level", "N/A"),
                "semester": cls.get("semester", "N/A"),
            },
            "schedule_blocks": normalize_schedule_blocks(cls.get("schedule_blocks", []))
        })

    return results
