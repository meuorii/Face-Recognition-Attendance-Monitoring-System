import cv2
import time
import requests
import numpy as np
import threading
import torch
from scipy.spatial.distance import cosine
from collections import defaultdict
from insightface.app import FaceAnalysis

from utils.anti_spoofing import check_real_or_spoof
from models.face_db_model import (
    load_registered_faces,
    get_student_by_id
)

# -----------------------------
# Config
# -----------------------------
API_BASE        = "http://localhost:5000/api/attendance"
ACTIVE_URL      = f"{API_BASE}/active-session"
STOP_URL        = f"{API_BASE}/stop-session"
LOG_URL         = f"{API_BASE}/log"

POLL_INTERVAL   = 5
MATCH_THRESHOLD = 0.55
SKIP_FRAMES     = 5
FRAME_SIZE      = (960, 540)
PAD_RATIO       = 0.25
AS_THRESHOLD    = 0.80
AS_DOUBLECHK    = True
FORCE_REAL_HIGH = 0.98   # NEW: force REAL if p_real >= 0.98
WIN_NAME        = "Attendance Session"

# -----------------------------
# Globals
# -----------------------------
session_active  = False
user_quit_app   = False
session_skipped = False

# -----------------------------
# Init InsightFace (antelopev2)
# -----------------------------
cuda_ok = torch.cuda.is_available()
providers = ["CUDAExecutionProvider", "CPUExecutionProvider"] if cuda_ok else ["CPUExecutionProvider"]
ctx_id = 0 if cuda_ok else -1

face_app = FaceAnalysis(name="antelopev2", providers=providers)
face_app.prepare(ctx_id=ctx_id, det_size=(640, 640))

# -----------------------------
# Load registered embeddings
# -----------------------------
def load_embeddings():
    registered_faces = load_registered_faces()
    db = {}
    for student in registered_faces:
        sid = student.get("student_id") or student.get("Student_ID")
        embeddings = student.get("embeddings", {})
        if not sid:
            continue
        if sid not in db:
            db[sid] = []
        for _, vector in embeddings.items():
            vec = np.asarray(vector, dtype=np.float32)
            n = np.linalg.norm(vec)
            if n > 0:
                vec = vec / n
            db[sid].append(vec)
    print(f"📥 Loaded {len(db)} registered students.")
    return db

# -----------------------------
# Matching
# -----------------------------
def find_matching_user(live_embedding, db, threshold=MATCH_THRESHOLD):
    if live_embedding is None or not db:
        return None, None

    live = live_embedding.astype(np.float32)
    n = np.linalg.norm(live)
    if n == 0:
        return None, None
    live /= n

    user_scores = defaultdict(list)
    for sid, emb_list in db.items():
        for emb in emb_list:
            score = cosine(live, emb)
            user_scores[sid].append(score)

    if not user_scores:
        return None, None

    avg_scores = [(sid, float(sum(scores) / len(scores))) for sid, scores in user_scores.items()]
    avg_scores.sort(key=lambda x: x[1])

    if avg_scores[0][1] < threshold:
        return avg_scores[0]
    return None, None

# -----------------------------
# Backend helpers
# -----------------------------
def set_backend_inactive(subject_id: str) -> bool:
    try:
        resp = requests.post(STOP_URL, json={"subject_id": subject_id}, timeout=5)
        if 200 <= resp.status_code < 300:
            print("🛑 Backend stop successful via /stop-session")
            return True
    except Exception as e:
        print("ℹ️ STOP request failed:", e)
    print("⚠️ Could not set backend inactive (will locally skip rerun).")
    return False

def post_attendance_log(subject_meta: dict, student: dict, status: str = "Present", date_str: str = None):
    payload = {
        "subject_id": subject_meta.get("subject_id"),
        "subject_code": subject_meta.get("subject_code"),
        "subject_title": subject_meta.get("subject_title"),
        "instructor_id": subject_meta.get("instructor_id"),
        "instructor_first_name": subject_meta.get("instructor_first_name"),
        "instructor_last_name": subject_meta.get("instructor_last_name"),
        "course": subject_meta.get("course"),
        "section": subject_meta.get("section"),
        "student": {
            "student_id": student["student_id"],
            "first_name": student.get("first_name", ""),
            "last_name": student.get("last_name", "")
        },
        "status": status
    }
    if date_str:
        payload["date"] = date_str

    resp = requests.post(LOG_URL, json=payload, timeout=5)
    resp.raise_for_status()
    return resp.json()

def read_active_subject():
    r = requests.get(ACTIVE_URL, timeout=5).json()
    if not r.get("active"):
        return False, None
    subj = r.get("subject")
    if subj and isinstance(subj, dict):
        return True, subj
    sid = r.get("subject_id")
    if sid:
        return True, {"subject_id": sid}
    return True, None

# -----------------------------
# Backend Polling Thread
# -----------------------------
def poll_backend(subject_id):
    global session_active, user_quit_app
    while session_active and not user_quit_app:
        try:
            active, subj = read_active_subject()
            if not active:
                session_active = False
                break
            active_sid = (subj or {}).get("subject_id")
            if active_sid and active_sid != subject_id:
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
    nx1 = max(0, nx1); ny1 = max(0, ny1)
    nx2 = min(w - 1, nx2); ny2 = min(h - 1, ny2)
    return nx1, ny1, nx2, ny2

def _draw_small_text(img, text, org, color=(255,255,255), scale=0.55, thickness=1):
    cv2.putText(img, text, org, cv2.FONT_HERSHEY_SIMPLEX, scale, (0,0,0), thickness+2, cv2.LINE_AA)
    cv2.putText(img, text, org, cv2.FONT_HERSHEY_SIMPLEX, scale, color, thickness, cv2.LINE_AA)

def _format_mmss(elapsed_sec: float) -> str:
    m = int(elapsed_sec // 60)
    s = int(elapsed_sec % 60)
    return f"{m:02d}:{s:02d}"

# -----------------------------
# Attendance session
# -----------------------------
def run_attendance_session(subject_meta) -> bool:
    global session_active, user_quit_app
    session_active = True
    user_quit_app  = False

    subject_id = subject_meta.get("subject_id")
    if not subject_id:
        print("❌ Missing subject_id in subject_meta; aborting session.")
        return False

    db = load_embeddings()
    recognized_students = set()
    frame_count = 0
    faces = None
    t_start = time.time()

    threading.Thread(target=poll_backend, args=(subject_id,), daemon=True).start()
    print(f"📸 Attendance started for subject {subject_id}")

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

                # Anti-spoofing check
                is_real, conf, probs = check_real_or_spoof(
                    face_img, threshold=AS_THRESHOLD, double_check=AS_DOUBLECHK
                )

                # NEW: override heuristics if super high confidence
                if conf >= FORCE_REAL_HIGH:
                    is_real = True

                label = f"Spoof ({conf:.2f})"
                color = (0, 0, 255)

                if is_real:
                    sid, score = (None, None)
                    if hasattr(f, "embedding") and f.embedding is not None:
                        sid, score = find_matching_user(f.embedding, db, threshold=MATCH_THRESHOLD)

                    if sid:
                        student_data = get_student_by_id(sid) or {}
                        first = student_data.get("first_name") or student_data.get("First_Name", "")
                        last  = student_data.get("last_name")  or student_data.get("Last_Name",  "")
                        full_name = f"{first} {last}".strip() or sid

                        label = f"{full_name} ({conf:.2f})"
                        color = (40, 200, 60)

                        if sid not in recognized_students:
                            post_attendance_log(
                                subject_meta=subject_meta,
                                student={"student_id": sid, "first_name": first, "last_name": last},
                                status="Present"
                            )
                            recognized_students.add(sid)
                            print(f"✅ Marked {full_name} as Present")
                    else:
                        label = f"Unknown ({conf:.2f})"
                        color = (0, 200, 200)

                cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
                _draw_small_text(frame, label, (x1, max(18, y1 - 8)), color)

        # HUD
        elapsed = _format_mmss(time.time() - t_start)
        _draw_small_text(frame, f"Timer {elapsed}", (12, 22), (230, 230, 230), scale=0.6, thickness=1)
        _draw_small_text(frame, f"Present {len(recognized_students)}/{len(db)}", (12, 42), (180, 255, 180), scale=0.6, thickness=1)

        cv2.imshow(WIN_NAME, frame)
        k = cv2.waitKey(1) & 0xFF
        if k == ord("q"):
            user_quit_app = True
            session_active = False
            try:
                ok = set_backend_inactive(subject_id)
                if not ok:
                    print("⚠️ Backend not updated; will locally skip rerun until backend ends.")
            except Exception as e:
                print("⚠️ Failed to set backend inactive:", e)
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
    session_skipped = False

    while True:
        try:
            active, subj = read_active_subject()
            if active:
                if subj is None:
                    print("⚠️ Active session but no subject payload; waiting…")
                    session_skipped = False
                else:
                    subject_id = subj.get("subject_id")
                    if subject_id and not session_skipped:
                        run_attendance_session(subj)
                        session_skipped = True
                    elif not subject_id:
                        print("⚠️ Active session but subject_id missing; waiting…")
                    else:
                        print("⏳ Session remains active on backend; rerun skipped locally (pressed 'q').")
            else:
                print("⏳ Waiting for active session...")
                session_skipped = False
        except Exception as e:
            print("❌ Error contacting backend:", e)

        time.sleep(POLL_INTERVAL)
