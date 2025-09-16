# models/admin_model.py
from config.db_config import db
from pymongo.errors import DuplicateKeyError

admins_collection = db["admins"]

# Create unique indexes once (safe if called multiple times)
def _ensure_indexes():
    try:
        admins_collection.create_index("user_id", unique=True, name="uniq_user_id")
        admins_collection.create_index("email", unique=True, name="uniq_email")
    except Exception:
        # Index may already exist or DB not ready; ignore at import-time
        pass

_ensure_indexes()

def find_admin_by_user_id(user_id):
    """Used by login to fetch full doc (including password hash)."""
    return admins_collection.find_one({"user_id": user_id})

def find_admin_by_email(email):
    """Used by registration to check existence."""
    return admins_collection.find_one({"email": email})

def create_admin(admin_data):
    """
    Inserts an admin document.
    Returns inserted_id.
    Raises DuplicateKeyError if user_id/email already exists.
    """
    res = admins_collection.insert_one(admin_data)
    return res.inserted_id

# Optional helpers

def list_admins_public(limit=100):
    """
    Returns admins without password field for safe listing in UI.
    """
    cur = admins_collection.find({}, {"password": 0}).limit(limit)
    return list(cur)

def get_admin_public_by_user_id(user_id):
    """
    Public-facing view for 'me' endpoints (no password).
    """
    return admins_collection.find_one({"user_id": user_id}, {"password": 0})
