from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from dotenv import load_dotenv
import os

# --- Load environment variables ---
load_dotenv()

# --- Flask app init ---
app = Flask(__name__)

# ✅ CORS Configuration
CORS(
    app,
    resources={r"/*": {"origins": ["http://localhost:5173"]}},  # allow your React frontend
    supports_credentials=True,
    expose_headers=["Content-Type", "Authorization"],
    allow_headers=["Content-Type", "Authorization"],
    methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"]
)

# --- Secrets / Config ---
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "fallback-secret")
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "fallback-jwt-secret")
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = False  # you can set timedelta if desired

# Ensure PyJWT in admin_routes.py sees the same secret by default
os.environ.setdefault("JWT_SECRET", app.config["JWT_SECRET_KEY"])

# --- JWT Manager ---
jwt = JWTManager(app)

# --- Blueprints ---
from routes.auth_routes import auth_bp
from routes.student_routes import student_bp
from routes.instructor_routes import instructor_bp
from routes.attendance_routes import attendance_bp
from routes.face_routes import face_bp
from routes.blink_routes import blink_bp
from routes.admin_routes import admin_bp  # ✅ NEW: Admin routes

# If you're using Flask-Limiter in face_routes, attach it here
try:
    limiter.init_app(app)  # safe if limiter already bound
except Exception:
    pass

# Register with prefixes (note: admin_bp already includes '/api/admin/...' in its routes)
app.register_blueprint(auth_bp, url_prefix="/api/auth")
app.register_blueprint(student_bp, url_prefix="/api/student")
app.register_blueprint(instructor_bp, url_prefix="/api/instructor")
app.register_blueprint(attendance_bp, url_prefix="/api/attendance")
app.register_blueprint(face_bp, url_prefix="/api/face")
app.register_blueprint(blink_bp, url_prefix="/api/blink")
app.register_blueprint(admin_bp)  # ✅ no extra prefix to avoid '/api/api/admin'

# --- Health & Root ---
@app.route("/")
def home():
    return "Face Recognition Attendance Backend is running..."

@app.route("/healthz")
def healthz():
    return jsonify(status="ok"), 200

# --- Friendly error handlers (optional) ---
@app.errorhandler(404)
def not_found(_):
    return jsonify(error="Not found"), 404

@app.errorhandler(500)
def server_error(e):
    return jsonify(error="Server error", detail=str(e)), 500

# --- Run ---
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", "5000")), debug=True)
