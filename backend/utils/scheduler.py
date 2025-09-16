# utils/scheduler.py
from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime, timedelta
from config.db_config import db
from utils.face_recognition import handle_attendance_session

subjects_collection = db["subjects"]
seen_subjects = set()  # prevent re-triggering

def auto_activate_attendance():
    now = datetime.now()
    day_code = now.strftime("%a")[0].upper()
    current_time = now.strftime("%H:%M")

    subjects = subjects_collection.find({"is_attendance_active": False})
    for subj in subjects:
        if day_code in subj.get("schedule", ""):
            try:
                start_str, end_str = subj["schedule_time"].split("-")

                if start_str <= current_time <= end_str:
                    if subj["_id"] in seen_subjects:
                        continue

                    subjects_collection.update_one(
                        {"_id": subj["_id"]},
                        {"$set": {
                            "is_attendance_active": True,
                            "attendance_start_time": now
                        }}
                    )

                    print(f"[AUTO] ✅ Activated: {subj['subject_code']}")

                    handle_attendance_session(
                        subject=subj.get("subject_name", "Unknown"),
                        subject_id=subj.get("subject_code"),
                        subject_start_time=now
                    )

                    seen_subjects.add(subj["_id"])

            except Exception as e:
                print(f"⛔ Error in {subj.get('subject_code')}: {e}")

def auto_stop_attendance():
    now = datetime.now()

    active_subjects = subjects_collection.find({"is_attendance_active": True})
    for subj in active_subjects:
        try:
            start_str, end_str = subj["schedule_time"].split("-")
            end_dt = datetime.strptime(end_str, "%H:%M").time()

            # Combine today's date with end time
            end_time_with_grace = datetime.combine(now.date(), end_dt) + timedelta(minutes=30)

            if now > end_time_with_grace:
                subjects_collection.update_one(
                    {"_id": subj["_id"]},
                    {"$set": {
                        "is_attendance_active": False,
                        "attendance_start_time": None
                    }}
                )
                print(f"[AUTO] ⛔ Deactivated: {subj['subject_code']} (grace period over)")

        except Exception as e:
            print(f"⛔ Error auto-stopping {subj.get('subject_code')}: {e}")

def start_scheduler():
    scheduler = BackgroundScheduler()
    scheduler.add_job(auto_activate_attendance, 'interval', minutes=1)
    scheduler.add_job(auto_stop_attendance, 'interval', minutes=1)
    scheduler.start()
