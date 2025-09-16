from config.db_config import db
import datetime

# Collections
students_collection = db["students"]
attendance_collection = db["attendance_logs"]

# -----------------------------
# Save / Update student face data
# -----------------------------
def save_face_data(student_id, update_fields):
    try:
        if not student_id or not update_fields:
            print("❌ Missing student_id or update_fields.")
            return False

        # Always normalize to lowercase field name
        result = students_collection.update_one(
            {"student_id": student_id},
            {"$set": update_fields},
            upsert=True
        )

        updated_fields = [k for k in update_fields.keys() if k.startswith("embeddings.")]
        print(f"✅ Face data updated for {student_id}. Fields updated: {updated_fields}")
        return True
    except Exception as e:
        print("❌ MongoDB save error:", str(e))
        return False


# -----------------------------
# Normalize student document
# -----------------------------
def normalize_student(doc):
    if not doc:
        return None
    return {
        "student_id": doc.get("student_id") or doc.get("Student_ID", ""),
        "first_name": doc.get("first_name") or doc.get("First_Name", ""),
        "last_name": doc.get("last_name") or doc.get("Last_Name", ""),
        "middle_name": doc.get("middle_name") or doc.get("Middle_Name", ""),
        "course": doc.get("course") or doc.get("Course", ""),
        "section": doc.get("section") or doc.get("Section", ""),
        "email": doc.get("email") or doc.get("Email", ""),
        "contact_number": doc.get("contact_number") or doc.get("Contact_Number", ""),
        "subjects": doc.get("subjects") or doc.get("Subjects", []),
        "created_at": doc.get("created_at"),
        "embeddings": doc.get("embeddings", {})
    }


# -----------------------------
# Load all students with embeddings
# -----------------------------
def load_registered_faces():
    try:
        registered_faces = []
        cursor = students_collection.find({"embeddings": {"$exists": True, "$ne": {}}})

        for doc in cursor:
            student = normalize_student(doc)
            if student and student["student_id"]:
                registered_faces.append(student)

        print(f"📥 Loaded {len(registered_faces)} registered students with embeddings.")
        return registered_faces
    except Exception as e:
        print("❌ MongoDB load error:", str(e))
        return []


# -----------------------------
# Lookup student by ID
# -----------------------------
def get_student_by_id(student_id):
    try:
        student = students_collection.find_one({
            "$or": [
                {"student_id": student_id},
                {"Student_ID": student_id}
            ]
        })
        return normalize_student(student)
    except Exception as e:
        print("❌ MongoDB lookup error:", str(e))
        return None


# -----------------------------
# Save attendance log
# -----------------------------
def save_attendance_log(student_id, subject_id, timestamp=None, confidence=None):
    try:
        student = get_student_by_id(student_id)
        if not student:
            print(f"⚠️ Student {student_id} not found in DB.")
            return False

        log = {
            "student_id": student["student_id"],
            "first_name": student["first_name"],
            "last_name": student["last_name"],
            "course": student["course"],
            "section": student["section"],
            "subject_id": subject_id,
            "timestamp": timestamp or datetime.datetime.utcnow(),
            "confidence": confidence,
            "status": "Present"
        }

        attendance_collection.insert_one(log)
        print(f"📝 Attendance logged: {student['first_name']} {student['last_name']} | {subject_id} | {log['timestamp']}")
        return True
    except Exception as e:
        print("❌ MongoDB attendance log error:", str(e))
        return False


# -----------------------------
# Load attendance logs
# -----------------------------
def load_attendance_logs(subject_id):
    try:
        logs = list(attendance_collection.find({"subject_id": subject_id}))
        for l in logs:
            l["_id"] = str(l["_id"])
        print(f"📊 Loaded {len(logs)} attendance logs for subject {subject_id}")
        return logs
    except Exception as e:
        print("❌ MongoDB load attendance logs error:", str(e))
        return []
