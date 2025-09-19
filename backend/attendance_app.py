import cv2
import time
import requests
import numpy as np
import threading
import torch
from scipy.spatial.distance import cosine
from collections import defaultdict
from insightface.app import FaceAnalysis
from datetime import datetime

from utils.anti_spoofing import check_real_or_spoof
from models.face_db_model import load_registered_faces, get_student_by_id

# -----------------------------
# Config
# -----------------------------
API_BASE      = "http://localhost:5000/api/attendance"
ACTIVE_URL    = f"{API_BASE}/active-session"
STOP_URL      = f"{API_BASE}/stop-session"
LOG_URL       = f"{API_BASE}/log"

POLL_INTERVAL = 5
MATCH_THRESH  = 0.55
SKIP_FRAMES   = 5
FRAME_SIZE    = (640, 480)
PAD_RATIO     = 0.25
AS_THRESHOLD  = 0.80
AS_DOUBLECHK  = True
WIN_NAME      = "Attendance Session"

# -----------------------------
# Globals
# -----------------------------
session_active  = False
user_quit_app   = False
session_skipped = False

# -----------------------------
# Init InsightFace
# -----------------------------
cuda_ok = torch.cuda.is_available()
providers = ["CUDAExecutionProvider", "CPUExecutionProvider"] if cuda_ok else ["CPUExecutionProvider"]
ctx_id = 0 if cuda_ok else -1

face_app = FaceAnalysis(name="buffalo_l", providers=providers)
face_app.prepare(ctx_id=ctx_id, det_size=(640, 640))

# -----------------------------
# Load embeddings for CLASS only
# -----------------------------
def load_embeddings_for_class(class_meta: dict):
    registered_faces = load_registered_faces()
    allowed_ids = {s["student_id"] for s in class_meta.get("students", [])}

    print("🎯 Allowed IDs from class:", allowed_ids)

    db = {}
    for student in registered_faces:
        sid = student.get("student_id")
        if not sid or sid not in allowed_ids:
            continue

        embeddings = student.get("embeddings", {})
        if not embeddings:
            continue

        db[sid] = []
        for angle, vector in embeddings.items():
            vec = np.asarray(vector, dtype=np.float32)
            n = np.linalg.norm(vec)
            if n > 0:
                vec = vec / n
            db[sid].append(vec)
        print(f"✅ Loaded {len(embeddings)} embeddings for {sid}")

    print(f"📥 Final DB size: {len(db)} students")
    return db

# -----------------------------
# Matching (cosine distance)
# -----------------------------
def find_matching_user(live_embedding, db, threshold=MATCH_THRESH):
    if live_embedding is None or not db:
        return None, None

    live = live_embedding.astype(np.float32)
    n = np.linalg.norm(live)
    if n == 0:
        return None, None
    live /= n

    scores = []
    for sid, emb_list in db.items():
        for emb in emb_list:
            scores.append((sid, cosine(live, emb)))

    if not scores:
        return None, None

    scores.sort(key=lambda x: x[1])
    if scores[0][1] < threshold:
        return scores[0]
    return None, None

# -----------------------------
# Backend helpers
# -----------------------------
def set_backend_inactive(class_id: str) -> bool:
    try:
        resp = requests.post(STOP_URL, json={"class_id": class_id}, timeout=5)
        if resp.ok:
            print("🛑 Backend stop successful")
            return True
    except Exception as e:
        print("ℹ️ STOP request failed:", e)
    return False


def post_attendance_log(class_meta: dict, student: dict, status: str = "Present"):
    today_str = datetime.utcnow().strftime("%Y-%m-%d")  # ✅ ensure backend expects YYYY-MM-DD

    payload = {
        "class_id": class_meta.get("class_id"),
        "class_code": class_meta.get("class_code"),
        "class_title": class_meta.get("class_title"),
        "instructor_id": class_meta.get("instructor_id"),
        "instructor_first_name": class_meta.get("instructor_first_name"),
        "instructor_last_name": class_meta.get("instructor_last_name"),
        "course": class_meta.get("course"),
        "section": class_meta.get("section"),
        "student": {
            "student_id": student["student_id"],
            "first_name": student.get("first_name", ""),
            "last_name": student.get("last_name", "")
        },
        "status": status,
        "date": today_str
    }

    resp = requests.post(LOG_URL, json=payload, timeout=5)
    resp.raise_for_status()
    return resp.json()


def read_active_class():
    r = requests.get(ACTIVE_URL, timeout=5).json()
    if not r.get("active"):
        return False, None
    cls = r.get("class")
    if cls and isinstance(cls, dict):
        return True, cls
    cid = r.get("class_id")
    if cid:
        return True, {"class_id": cid}
    return True, None

# -----------------------------
# Polling thread
# -----------------------------
def poll_backend(class_id):
    global session_active, user_quit_app
    while session_active and not user_quit_app:
        try:
            active, cls = read_active_class()
            if not active:
                session_active = False
                break
            active_cid = (cls or {}).get("class_id")
            if active_cid and active_cid != class_id:
                print("🛑 Backend says session switched/stopped.")
                session_active = False
                break
        except Exception as e:
            print("⚠️ Could not reach backend:", e)
            session_active = False
            break
        time.sleep(POLL_INTERVAL)

# -----------------------------
# Helpers (UI)
# -----------------------------
def _expand_and_clip_bbox(bbox, w, h, pad_ratio=0.25):
    x1, y1, x2, y2 = [float(v) for v in bbox]
    bw, bh = (x2 - x1), (y2 - y1)
    if bw <= 0 or bh <= 0:
        return 0, 0, w - 1, h - 1
    cx, cy = (x1 + x2) / 2.0, (y1 + y2) / 2.0
    side = max(bw, bh) * (1.0 + pad_ratio)
    nx1, ny1 = int(round(cx - side / 2)), int(round(cy - side / 2))
    nx2, ny2 = int(round(cx + side / 2)), int(round(cy + side / 2))
    return max(0, nx1), max(0, ny1), min(w - 1, nx2), min(h - 1, ny2)


def _draw_small_text(img, text, org, color=(255,255,255), scale=0.55, thickness=1):
    cv2.putText(img, text, org, cv2.FONT_HERSHEY_SIMPLEX, scale, (0,0,0), thickness+2, cv2.LINE_AA)
    cv2.putText(img, text, org, cv2.FONT_HERSHEY_SIMPLEX, scale, color, thickness, cv2.LINE_AA)


def _format_mmss(elapsed_sec: float) -> str:
    m, s = divmod(int(elapsed_sec), 60)
    return f"{m:02d}:{s:02d}"

# -----------------------------
# Attendance session
# -----------------------------
def run_attendance_session(class_meta) -> bool:
    global session_active, user_quit_app
    session_active, user_quit_app = True, False

    class_id = class_meta.get("class_id")
    if not class_id:
        print("❌ Missing class_id in class_meta; aborting session.")
        return False

    db = load_embeddings_for_class(class_meta)
    recognized_students = set()
    frame_count, faces = 0, None
    t_start = time.time()

    threading.Thread(target=poll_backend, args=(class_id,), daemon=True).start()

    print(f"📸 Attendance started for class {class_id}")
    cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)

    cv2.namedWindow(WIN_NAME, cv2.WND_PROP_FULLSCREEN)
    cv2.setWindowProperty(WIN_NAME, cv2.WND_PROP_FULLSCREEN, cv2.WINDOW_FULLSCREEN)

    while session_active and not user_quit_app:
        ok, frame = cap.read()
        if not ok:
            continue

        frame = cv2.resize(frame, FRAME_SIZE)
        H, W = frame.shape[:2]
        frame_count += 1

        if frame_count % SKIP_FRAMES == 0 or faces is None:
            faces = face_app.get(frame)

        if faces:
            for f in faces:
                if not hasattr(f, "bbox"):
                    continue
                x1, y1, x2, y2 = _expand_and_clip_bbox(f.bbox, W, H, pad_ratio=PAD_RATIO)
                face_img = frame[y1:y2, x1:x2]
                if face_img.size == 0:
                    continue

                is_real, _, _ = check_real_or_spoof(face_img, threshold=AS_THRESHOLD, double_check=AS_DOUBLECHK)
                color, label = (0, 0, 255), "Spoof"
                if is_real:
                    sid, _ = (None, None)
                    if hasattr(f, "embedding") and f.embedding is not None:
                        sid, _ = find_matching_user(f.embedding, db, threshold=MATCH_THRESH)

                    if sid:
                        student = get_student_by_id(sid) or {}
                        first = student.get("first_name") or student.get("First_Name", "")
                        last  = student.get("last_name")  or student.get("Last_Name", "")
                        full_name = f"{first} {last}".strip() or sid

                        label, color = full_name, (40, 200, 60)
                        if sid not in recognized_students:
                            post_attendance_log(class_meta, {
                                "student_id": sid,
                                "first_name": first,
                                "last_name": last
                            }, "Present")
                            recognized_students.add(sid)
                            print(f"✅ Marked {full_name} as Present")
                    else:
                        label, color = "Unknown", (0, 200, 200)

                cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
                _draw_small_text(frame, label, (x1, max(18, y1 - 8)), color)

        elapsed = _format_mmss(time.time() - t_start)
        _draw_small_text(frame, f"Timer {elapsed}", (12, 22), (230, 230, 230), 0.6, 1)
        _draw_small_text(frame, f"Present {len(recognized_students)}/{len(db)}", (12, 42), (180, 255, 180), 0.6, 1)

        cv2.imshow(WIN_NAME, frame)
        if cv2.waitKey(1) & 0xFF == ord("q"):
            user_quit_app, session_active = True, False
            if not set_backend_inactive(class_id):
                print("⚠️ Backend not updated; skipping rerun until backend inactive.")
            break

    cap.release()
    cv2.destroyAllWindows()
    print("✅ Attendance loop ended.")
    return user_quit_app

# -----------------------------
# Main
# -----------------------------
if __name__ == "__main__":
    print("🚀 Attendance App is running... (CUDA:", cuda_ok, ")")

    while True:
        try:
            active, cls = read_active_class()
            if active:
                if cls is None:
                    print("⚠️ Active session but no class payload; waiting…")
                    session_skipped = False
                else:
                    class_id = cls.get("class_id")
                    if class_id and not session_skipped:
                        run_attendance_session(cls)
                        session_skipped = True
                    elif not class_id:
                        print("⚠️ Active session but class_id missing; waiting…")
                    else:
                        print("⏳ Session remains active; rerun skipped (pressed 'q').")
            else:
                print("⏳ Waiting for active session...")
                session_skipped = False
        except Exception as e:
            print("❌ Error contacting backend:", e)

        time.sleep(POLL_INTERVAL)
