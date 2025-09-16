# models/instructor_model.py

from config.db_config import db

instructors_collection = db["instructors"]

def find_instructor_by_id(instructor_id):
    return instructors_collection.find_one({"instructor_id": instructor_id})

def find_instructor_by_email(email):
    return instructors_collection.find_one({"email": email})

def create_instructor(instructor_data):
    instructors_collection.insert_one(instructor_data)
