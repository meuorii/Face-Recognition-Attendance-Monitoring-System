from config.db_config import db

# Reference to the MongoDB 'students' collection
students_collection = db["students"]

# ✅ Create a new student (expects lowercase keys ideally)
def create_student(student_data):
    return students_collection.insert_one(student_data)

# ✅ Find one student by student_id (supports both student_id and legacy Student_ID)
def find_student_by_student_id(student_id):
    return students_collection.find_one({
        "$or": [
            {"student_id": student_id},
            {"Student_ID": student_id}
        ]
    })

# ✅ Get one student by ID (same as above, fallback support)
def get_student_by_id(student_id):
    return students_collection.find_one({
        "$or": [
            {"student_id": student_id},
            {"Student_ID": student_id}
        ]
    })

# ✅ Get all students in the system
def get_all_students():
    return list(students_collection.find({}))
