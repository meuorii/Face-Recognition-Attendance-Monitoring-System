from flask import Blueprint, request, jsonify
from models.student_model import create_student, find_student_by_student_id
from models.instructor_model import create_instructor, find_instructor_by_email, find_instructor_by_id
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token

auth_bp = Blueprint('auth', __name__)

# ✅ Unified registration route
@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.json
    role = data.get('role')

    if role == 'student':
        if find_student_by_student_id(data['student_id']):
            return jsonify({"error": "Student ID already registered"}), 400

        hashed_password = generate_password_hash(data['password'])
        student_data = {
            "student_id": data['student_id'],
            "first_name": data['first_name'],
            "last_name": data['last_name'],
            "course": data['course'],
            "section": data['section'],
            "password": hashed_password
        }

        create_student(student_data)
        return jsonify({"message": "Student registered successfully"}), 201

    elif role == 'instructor':
        if find_instructor_by_email(data['email']):
            return jsonify({"error": "Email already registered"}), 400

        hashed_password = generate_password_hash(data['password'])
        instructor_data = {
            "instructor_id": data['instructor_id'],
            "first_name": data['first_name'],
            "last_name": data['last_name'],
            "email": data['email'],
            "password": hashed_password
        }

        create_instructor(instructor_data)
        return jsonify({"message": "Instructor registered successfully"}), 201

    return jsonify({"error": "Invalid role"}), 400


# ✅ Unified login route
@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    role = data.get('role')

    if role == 'student':
        student_id = data.get('student_id')
        password = data.get('password')

        user = find_student_by_student_id(student_id)

        if not user:
            return jsonify({"error": "Student not found"}), 404
        if not check_password_hash(user['password'], password):
            return jsonify({"error": "Incorrect password"}), 401

        token = create_access_token(identity={
            "student_id": user["student_id"],
            "role": "student"
        })

        return jsonify({
            "token": token,
            "role": "student",
            "student_id": user["student_id"],
            "first_name": user["first_name"],
            "last_name": user["last_name"],
            "course": user["course"],
            "section": user["section"]
        }), 200

    elif role == 'instructor':
        instructor_id = data.get('instructor_id')
        password = data.get('password')

        user = find_instructor_by_id(instructor_id)

        if not user:
            return jsonify({"error": "Instructor not found"}), 404
        if not check_password_hash(user['password'], password):
            return jsonify({"error": "Incorrect password"}), 401

        token = create_access_token(identity={
            "instructor_id": user["instructor_id"],
            "role": "instructor"
        })

        return jsonify({
            "token": token,
            "role": "instructor",
            "instructor_id": user["instructor_id"],
            "first_name": user["first_name"],
            "last_name": user["last_name"],
            "email": user["email"]
        }), 200

    return jsonify({"error": "Invalid role specified"}), 400
