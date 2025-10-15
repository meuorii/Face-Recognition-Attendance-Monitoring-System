# attendance_app.py
import cv2
import time
import requests
import numpy as np
import threading
import torch
from scipy.spatial.distance import cosine
from insightface.app import FaceAnalysis
from datetime import datetime, timedelta, timezone
from dateutil import parser
from typing import Dict, Tuple, Optional, List

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
SKIP_FRAMES   = 2
PAD_RATIO     = 0.05
AS_THRESHOLD  = 0.65
AS_DOUBLECHK  = True
WIN_NAME      = "Attendance Session"

# Camera resolution presets
CAMERA_QUALITY = "1080p"  # options: "720p", "1080p", "4k"
RESOLUTIONS = {
    "720p":  (1280, 720),
    "1080p": (1920, 1080),
    "4k":    (3840, 2160)
}

# Multi-face & tracking
MAX_FACES              = 15
MIN_FACE_SIZE          = 60
IOU_MATCH_THRESH       = 0.30
TRACK_TIMEOUT_SEC      = 1.5
TRACK_COOLDOWN_SEC     = 2.5

# Philippine Standard Time (UTC+8)
PH_TZ = timezone(timedelta(hours=8))

# -----------------------------
# Globals
# -----------------------------
session_active  = False
user_quit_app   = False
session_skipped = False

# -----------------------------
# Init InsightFace
# -----------------------------
cuda_ok = False
providers = ["CPUExecutionProvider"]
ctx_id = -1
print("🧠 Running on CPU mode (real-time smooth detection)")

torch.set_num_threads(4)

face_app = FaceAnalysis(name="buffalo_l", providers=providers)
face_app.prepare(ctx_id=ctx_id, det_size=(320, 320))

# -----------------------------
# Load embeddings for CLASS only
# -----------------------------
def load_embeddings_for_class(class_meta: dict) -> Dict[str, List[np.ndarray]]:
    registered_faces = load_registered_faces()
    allowed_ids = {s["student_id"] for s in class_meta.get("students", [])}
    print("🎯 Allowed IDs from class:", allowed_ids)

    db: Dict[str, List[np.ndarray]] = {}
    for student in registered_faces:
        sid = student.get("student_id")
        if not sid or sid not in allowed_ids:
            continue

        embeddings = student.get("embeddings", {})
        if not embeddings:
            continue

        bank: List[np.ndarray] = []
        for _, vector in embeddings.items():
            vec = np.asarray(vector, dtype=np.float32)
            n = np.linalg.norm(vec)
            if n > 0:
                vec = vec / n
            bank.append(vec)
        if bank:
            db[sid] = bank
            print(f"✅ Loaded {len(bank)} embeddings for {sid}")

    print(f"📥 Final DB size: {len(db)} students")
    return db

# -----------------------------
# Matching (cosine distance)
# -----------------------------
def find_matching_user(live_embedding: np.ndarray, db: Dict[str, List[np.ndarray]], threshold: float = MATCH_THRESH) -> Tuple[Optional[str], Optional[float]]:
    if live_embedding is None or not db:
        return None, None

    live = live_embedding.astype(np.float32)
    n = np.linalg.norm(live)
    if n == 0:
        return None, None
    live /= n

    best_sid, best_dist = None, 9e9
    for sid, emb_list in db.items():
        for emb in emb_list:
            d = cosine(live, emb)
            if d < best_dist:
                best_sid, best_dist = sid, d

    if best_sid is not None and best_dist < threshold:
        return best_sid, best_dist
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
    today_str = datetime.now(PH_TZ).strftime("%Y-%m-%d")
    payload = {
        "class_id": class_meta.get("class_id"),
        "student": {
            "student_id": student["student_id"],
            "first_name": student.get("first_name", ""),
            "last_name": student.get("last_name", "")
        },
        "status": status,
        "date": today_str
    }
    try:
        resp = requests.post(LOG_URL, json=payload, timeout=5)
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        print("⚠️ Failed to log attendance:", e)
        return None

def read_active_class():
    try:
        r = requests.get(ACTIVE_URL, timeout=5).json()
        if not r.get("active"):
            return False, None
        cls = r.get("class")
        if cls and isinstance(cls, dict):
            return True, cls
        cid = r.get("class_id")
        if cid:
            return True, {"class_id": cid}
    except Exception as e:
        print("⚠️ Failed to read active class:", e)
    return False, None

# -----------------------------
# Polling thread
# -----------------------------
def poll_backend(class_id):
    global session_active, user_quit_app
    while session_active and not user_quit_app:
        active, cls = read_active_class()
        if not active:
            session_active = False
            break
        active_cid = (cls or {}).get("class_id")
        if active_cid and active_cid != class_id:
            print("🛑 Backend says session switched/stopped.")
            session_active = False
            break
        time.sleep(POLL_INTERVAL)

# -----------------------------
# Helpers (UI/Math)
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

def _draw_small_text(img, text, org, color=(255, 255, 255), scale=0.55, thickness=1):
    cv2.putText(img, text, org, cv2.FONT_HERSHEY_SIMPLEX, scale, (0, 0, 0), thickness + 2, cv2.LINE_AA)
    cv2.putText(img, text, org, cv2.FONT_HERSHEY_SIMPLEX, scale, color, thickness, cv2.LINE_AA)

def _format_mmss(elapsed_sec: float) -> str:
    m, s = divmod(int(elapsed_sec), 60)
    return f"{m:02d}:{s:02d}"

def _now() -> float:
    return time.perf_counter()

def _iou(a: Tuple[int, int, int, int], b: Tuple[int, int, int, int]) -> float:
    ax1, ay1, ax2, ay2 = a
    bx1, by1, bx2, by2 = b
    ix1, iy1 = max(ax1, bx1), max(ay1, by1)
    ix2, iy2 = min(ax2, bx2), min(ay2, by2)
    iw, ih = max(0, ix2 - ix1), max(0, iy2 - iy1)
    inter = iw * ih
    if inter <= 0:
        return 0.0
    a_area = (ax2 - ax1) * (ay2 - ay1)
    b_area = (bx2 - bx1) * (by2 - by1)
    return inter / float(a_area + b_area - inter + 1e-6)

# -----------------------------
# Attendance session (multi-face w/ short tracker)
# -----------------------------
def run_attendance_session(class_meta) -> bool:
    global session_active, user_quit_app
    session_active, user_quit_app = True, False

    class_id = class_meta.get("class_id")
    if not class_id:
        print("❌ Missing class_id in class_meta; aborting session.")
        return False

    # Late grace period
    start_str = class_meta.get("attendance_start_time")
    grace_period = 15 * 60
    start_dt = None
    if start_str:
        try:
            start_dt = parser.parse(start_str)
            if start_dt.tzinfo is None:
                start_dt = start_dt.replace(tzinfo=PH_TZ)
            else:
                start_dt = start_dt.astimezone(PH_TZ)
            print(f"🕒 Parsed start_dt={start_dt} | Grace={grace_period}s")
        except Exception as e:
            print("⚠️ Failed to parse start time:", e)

    # Load database
    db = load_embeddings_for_class(class_meta)
    recognized_students = set()
    tracks: Dict[int, dict] = {}
    next_track_id = 1

    frame_count, fps = 0, 0.0
    t_start_wall, t_last_fps = time.time(), _now()

    threading.Thread(target=poll_backend, args=(class_id,), daemon=True).start()

    print(f"📸 Attendance started for class {class_id}")
    cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)
    if not cap.isOpened():
        print("❌ Camera not available.")
        return False

    # Camera resolution
    W, H = RESOLUTIONS.get(CAMERA_QUALITY, (1920, 1080))
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, W)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, H)
    cap.set(cv2.CAP_PROP_FPS, 60)

    actual_w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    actual_h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    print(f"📷 Camera initialized at {actual_w}x{actual_h} (requested {CAMERA_QUALITY})")

    cv2.namedWindow(WIN_NAME, cv2.WINDOW_NORMAL)

    # ---------------- Threaded capture ----------------
    from collections import deque
    from concurrent.futures import ThreadPoolExecutor

    frame_queue = deque(maxlen=5)
    executor = ThreadPoolExecutor(max_workers=2)
    future_faces = None

    def camera_thread():
        while session_active and not user_quit_app:
            ok, f = cap.read()
            if ok:
                frame_queue.append(f)

    threading.Thread(target=camera_thread, daemon=True).start()

    # ---------------- Main loop ----------------
    faces = None
    future_faces = None
    while session_active and not user_quit_app:
        if not frame_queue:
            time.sleep(0.001)
            continue

        frame = frame_queue.popleft()
        H, W = frame.shape[:2]
        frame_count += 1

        # FPS update
        now_perf = _now()
        dt = now_perf - t_last_fps
        if dt > 0:
            fps = 0.9 * fps + 0.1 * (1.0 / dt)
        t_last_fps = now_perf

        # Adaptive skip frames
        SKIP_FRAMES = 1

        # Async detection
        if future_faces is None:
            future_faces = executor.submit(face_app.get, frame.copy())

       
        if future_faces and future_faces.done():
            try:
                new_faces = future_faces.result()
                if new_faces is not None:
                    faces = new_faces
            except Exception as e:
                print("⚠️ Face detection error:", e)
                faces = None

            future_faces = executor.submit(face_app.get, frame.copy())

        # Build detections
        detections = []
        if faces:
            for f in faces:
                if not hasattr(f, "bbox"):
                    continue
                x1, y1, x2, y2 = [int(v) for v in f.bbox]
                if (x2 - x1) < MIN_FACE_SIZE or (y2 - y1) < MIN_FACE_SIZE:
                    continue
                detections.append(((x1, y1, x2, y2), f))
            detections.sort(key=lambda it: (it[0][2]-it[0][0]) * (it[0][3]-it[0][1]), reverse=True)
            detections = detections[:MAX_FACES]
            # --- Apply Non-Maximum Suppression (remove overlapping duplicates) ---
            def nms(dets, iou_thresh=0.35):
                if not dets:
                    return []
                boxes = np.array([d[0] for d in dets])
                scores = np.array([(d[1].det_score if hasattr(d[1], "det_score") else 1.0) for d in dets])
                idxs = scores.argsort()[::-1]
                keep = []
                while len(idxs) > 0:
                    i = idxs[0]
                    keep.append(dets[i])
                    if len(idxs) == 1:
                        break
                    rest = idxs[1:]
                    ious = np.array([_iou(boxes[i], boxes[j]) for j in rest])
                    idxs = rest[ious < iou_thresh]
                return keep

            detections = nms(detections)


        # IoU match
        unmatched_det_idxs = set(range(len(detections)))
        det_to_track: Dict[int, int] = {}

        for tid, t in list(tracks.items()):
            t_bbox = t["bbox"]
            best_iou, best_idx = 0.0, -1
            for i in unmatched_det_idxs:
                det_bbox, _ = detections[i]
                iou = _iou(t_bbox, det_bbox)
                if iou > best_iou:
                    best_iou, best_idx = iou, i

            # if stable enough, update track
            if best_iou >= 0.25:  # slightly relaxed to prevent flicker
                det_to_track[best_idx] = tid
                unmatched_det_idxs.remove(best_idx)

                # --- smooth only if overlap is strong ---
                if best_iou > 0.6:
                    old_bbox = np.array(t_bbox, dtype=np.float32)
                    new_bbox = np.array(detections[best_idx][0], dtype=np.float32)
                    smoothed_bbox = old_bbox * 0.7 + new_bbox * 0.3
                    tracks[tid]["bbox"] = tuple(map(int, smoothed_bbox))
                else:
                    tracks[tid]["bbox"] = detections[best_idx][0]

                tracks[tid]["last_seen"] = now_perf
            else:
                # increment "missed" counter
                t.setdefault("missed", 0)
                t["missed"] += 1

        # Drop stale tracks only if unseen for 1s
        for tid in list(tracks.keys()):
            tr = tracks[tid]
            if now_perf - tr["last_seen"] > 1.0 or tr.get("missed", 0) > 5:
                tracks.pop(tid, None)

        # New tracks
        for i in unmatched_det_idxs:
            det_bbox, _ = detections[i]
            tracks[next_track_id] = {
                "bbox": det_bbox,
                "last_seen": now_perf,
                "last_eval": 0.0,
                "label": "…",
                "color": (200, 200, 200),
                "sid": None,
            }
            det_to_track[i] = next_track_id
            next_track_id += 1

        # Drop stale
        for tid, tr in tracks.items():
            if now_perf - tr["last_seen"] > 0.5:
                x1, y1, x2, y2 = tr["bbox"]
                tr["bbox"] = (x1 + 0.5, y1 + 0.5, x2 + 0.5, y2 + 0.5)

            x1, y1, x2, y2 = map(int, tr["bbox"])
            cv2.rectangle(frame, (x1, y1), (x2, y2), tr["color"], 2)
            _draw_small_text(frame, f"{tr['label']}", (x1, max(18, y1 - 8)), tr["color"])
            _draw_small_text(frame, f"Tracks {len(tracks)}", (12, 82), (230, 230, 230), 0.6, 1)


        # Evaluate each assigned track
        for i, (bbox, face_obj) in enumerate(detections):
            tid = det_to_track.get(i)
            if tid is None or tid not in tracks:
                continue

            tr = tracks[tid]
            if (now_perf - tr["last_eval"]) < (TRACK_COOLDOWN_SEC * 1.5):
                continue

            x1, y1, x2, y2 = _expand_and_clip_bbox(bbox, W, H, pad_ratio=PAD_RATIO)
            face_img = frame[y1:y2, x1:x2]
            if face_img.size == 0:
                continue

            try:
                face_h, face_w = y2 - y1, x2 - x1
                face_area = face_h * face_w
                if face_h < 100 or face_w < 100:
                    is_real = True
                else: 
                    if face_h < 160 or face_w < 160:
                        face_img = cv2.resize(face_img, None, fx=1.5, fy=1.5, interpolation=cv2.INTER_CUBIC)
                # Downscale to reduce anti-spoof lag
                dynamic_thresh = 0.65 if face_area < 35000 else AS_THRESHOLD
                face_small = cv2.resize(face_img, (96, 96))
                is_real, _, _ = check_real_or_spoof(face_small, threshold=dynamic_thresh, double_check=False)
                gray = cv2.cvtColor(face_img, cv2.COLOR_BGR2GRAY)
                gray = cv2.equalizeHist(gray)
                face_img = cv2.cvtColor(gray, cv2.COLOR_GRAY2BGR)
            except Exception as e:
                print("⚠️ Anti-spoof error:", e)
                is_real = False

            color, label, sid = (0, 0, 255), "Spoof", None
            if is_real:
                emb = getattr(face_obj, "embedding", None)
                if emb is None or not isinstance(emb, np.ndarray):
                    emb = getattr(face_obj, "normed_embedding", None)
                if emb is not None:
                    sid, _dist = find_matching_user(emb, db, threshold=MATCH_THRESH)

                if sid:
                    student = get_student_by_id(sid) or {}
                    first = student.get("first_name") or student.get("First_Name", "")
                    last = student.get("last_name") or student.get("Last_Name", "")
                    full_name = f"{first} {last}".strip() or sid

                    status, color = "Present", (40, 200, 60)
                    if start_dt:
                        now_local = datetime.now(PH_TZ)
                        deadline = start_dt + timedelta(seconds=grace_period)
                        if now_local > deadline:
                            status, color = "Late", (0, 255, 255)

                    label = f"{full_name} ({status})"

                    if sid not in recognized_students:
                        post_attendance_log(class_meta, {"student_id": sid, "first_name": first, "last_name": last}, status)
                        recognized_students.add(sid)
                        print(f"✅ Marked {full_name} as {status}")
                else:
                    label, color = "Unknown", (0, 200, 200)

            tr.update({"label": label, "color": color, "sid": sid, "last_eval": now_perf})

        # Draw boxes
        for tid, tr in tracks.items():
            x1, y1, x2, y2 = map(int, tr["bbox"])
            cv2.rectangle(frame, (x1, y1), (x2, y2), tr["color"], 2)
            _draw_small_text(frame, f"{tr['label']}", (x1, max(18, y1 - 8)), tr["color"])

        elapsed = _format_mmss(time.time() - t_start_wall)
        _draw_small_text(frame, f"Timer {elapsed}", (12, 22), (230, 230, 230), 0.6, 1)
        _draw_small_text(frame, f"FPS {fps:.1f}", (12, 42), (230, 230, 230), 0.6, 1)
        _draw_small_text(frame, f"Faces {len(detections)}  Recognized {len(recognized_students)}/{len(db)}", (12, 62), (180, 255, 180), 0.6, 1)

        # Render at smaller size for speed
        display = cv2.resize(frame, (1280, 720))
        cv2.imshow(WIN_NAME, display)

        if cv2.waitKey(1) & 0xFF == ord("q"):
            user_quit_app, session_active = True, False
            set_backend_inactive(class_id)
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

        time.sleep(POLL_INTERVAL)