import os
import cv2
import base64
import numpy as np
import time
import traceback
from scipy.spatial.distance import cosine
from collections import defaultdict

from models.face_db_model import load_registered_faces
from utils.model_loader import get_face_model  # ✅ ArcFace model
from utils.anti_spoofing import check_real_or_spoof  # 🔑 Anti-spoof

MATCH_THRESHOLD = 0.45  # 🔧 Relaxed but strict enough
PAD_RATIO = 0.25        # padding around bbox for anti-spoof crop

# ✅ Load ArcFace + RetinaFace model once
face_model = get_face_model()


# ---------- Load registered embeddings ----------
def load_all_embeddings():
    all_embeddings = []
    registered_faces = load_registered_faces()
    print("📂 Loading registered embeddings...")

    for student in registered_faces:
        student_id = str(student.get("student_id") or student.get("Student_ID") or "").strip()
        embeddings = student.get("embeddings", {})

        for angle, vector in embeddings.items():
            try:
                vec = np.array(vector, dtype=float)
                all_embeddings.append({
                    "user_id": student_id,
                    "embedding": vec,
                    "angle": angle
                })
            except Exception as e:
                print(f"⚠️ Skipped bad embedding for {student_id}: {e}")

    print(f"📦 Total embeddings loaded: {len(all_embeddings)}")
    return all_embeddings


# ---------- Matching ----------
def find_matching_user(live_embedding, embeddings, threshold=MATCH_THRESHOLD):
    user_scores = defaultdict(list)

    for entry in embeddings:
        score = cosine(live_embedding, entry["embedding"])  # distance
        user_scores[entry["user_id"]].append(score)

    if not user_scores:
        print("❌ No users to compare.")
        return None, None, []

    # average distance per user
    avg_scores = [(user, sum(scores) / len(scores)) for user, scores in user_scores.items()]
    avg_scores.sort(key=lambda x: x[1])  # lower = better

    print("🔍 Top Match Candidates (lower = better distance):")
    for user_id, avg in avg_scores[:3]:
        print(f"  → {user_id} | Avg Cosine Distance: {avg:.4f}")

    # safeguard: avoid false positives if top2 are too close
    if len(avg_scores) >= 2:
        diff = avg_scores[1][1] - avg_scores[0][1]
        if diff < 0.02:  # was 0.05, relaxed to 0.02
            print("⚠️ Match too close between top 2:", avg_scores[:2])
            return None, None, avg_scores

    best_user, best_score = avg_scores[0]
    if best_score <= threshold:   # ✅ accept if distance <= threshold
        return best_user, best_score, avg_scores

    print(f"🚫 Best match {best_user} rejected (distance={best_score:.4f} > threshold={threshold})")
    return None, None, avg_scores



# ---------- Utils: bbox padding & clipping ----------
def _expand_and_clip_bbox(bbox, w, h, pad_ratio=0.25):
    x1, y1, x2, y2 = [int(v) for v in bbox]
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


def _pick_primary_face(faces, img_w, img_h):
    if not faces:
        return None

    def area(b):
        x1, y1, x2, y2 = [int(v) for v in b]
        return max(0, x2 - x1) * max(0, y2 - y1)

    def key(f):
        score = getattr(f, "det_score", None)
        if score is None:
            return area(getattr(f, "bbox", [0, 0, img_w, img_h]))
        return float(score) * 1e6 + area(getattr(f, "bbox", [0, 0, img_w, img_h]))

    return max(faces, key=key)


# ---------- Main face recognition ----------
def recognize_face(base64_image):
    try:
        start_total = time.time()

        # ---------- Step 0: Validate input ----------
        if not base64_image or "," not in base64_image:
            return {"error": "Invalid image input"}

        try:
            img_bytes = base64.b64decode(base64_image.split(",")[1])
            nparr = np.frombuffer(img_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        except Exception as e:
            print("❌ Base64 decode error:", e)
            return {"error": "Failed to decode image"}

        if img is None:
            return {"error": "Image decoding failed"}

        img = cv2.flip(img, 1)  # mirror correction
        H, W = img.shape[:2]

        # ---------- Step 1: Detect face ----------
        if face_model is None:
            return {"error": "Face model not initialized"}

        t1 = time.time()
        try:
            faces = face_model.get(img)
        except Exception as e:
            print("❌ Face model error:", e)
            return {"error": "Face detection failed"}

        if not faces:
            return {"error": "No face detected"}

        f = _pick_primary_face(faces, W, H)
        if f is None or not hasattr(f, "bbox"):
            return {"error": "No valid face bbox"}

        # ---------- Step 2: Anti-spoof ----------
        x1, y1, x2, y2 = _expand_and_clip_bbox(getattr(f, "bbox"), W, H, pad_ratio=PAD_RATIO)
        face_crop = img[y1:y2, x1:x2] if (y2 > y1 and x2 > x1) else img

        t0 = time.time()
        is_real, confidence, probs = check_real_or_spoof(face_crop, threshold=0.8, double_check=True)
        print(
            f"🛡️ Anti-spoof → { 'REAL ✅' if is_real else 'SPOOF 🚫' } "
            f"| real={probs['real']:.3f}, spoof={probs['spoof']:.3f}, "
            f"time={round(time.time()-t0,3)}s"
        )
        if not is_real:
            return {
                "error": "🚫 Spoof detected. Please use a real face.",
                "anti_spoof_confidence": confidence,
                "anti_spoof_probs": probs
            }

        # ---------- Step 3: Embedding ----------
        if not hasattr(f, "embedding") or f.embedding is None:
            return {"error": "No face embedding extracted"}
        live_embedding = f.embedding
        print(f"🧬 Embedding extracted in {round(time.time()-t1,3)}s")

        # ---------- Step 4: Load embeddings ----------
        embeddings = load_all_embeddings()
        if not embeddings:
            return {"error": "No registered faces in database"}

        # ---------- Step 5: Matching ----------
        t2 = time.time()
        user_id, score, all_scores = find_matching_user(live_embedding, embeddings)
        print(f"🔑 Matching done in {round(time.time()-t2,3)}s")

        if not user_id:
            top_5 = [
                {"user_id": uid, "avg_score": round(s, 4)}
                for uid, s in (all_scores[:5] if all_scores else [])
            ]
            return {
                "error": "Face not recognized",
                "top_5_matches": top_5,
                "threshold_used": MATCH_THRESHOLD,
                "anti_spoof_confidence": confidence,
                "anti_spoof_probs": probs
            }

        # ---------- Step 6: Retrieve student ----------
        registered_faces = load_registered_faces() or []
        clean_id = str(user_id).strip()
        print(f"🎯 Best match user_id = {clean_id}, score = {score:.4f}")
        print("📋 Registered IDs:", [str(s.get('student_id') or s.get('Student_ID') or '').strip() for s in registered_faces])

        student = next(
            (s for s in registered_faces
             if str(s.get("student_id") or s.get("Student_ID") or "").strip() == clean_id),
            None,
        )
        if not student:
            return {"error": f"Student record not found for {clean_id}"}

        print("✅ Total Recognition Time:", round(time.time() - start_total, 3), "s")

        return {
            "message": "Face recognized!",
            "student_id": student.get("student_id") or student.get("Student_ID"),
            "first_name": student.get("first_name") or student.get("First_Name", ""),
            "last_name": student.get("last_name") or student.get("Last_Name", ""),
            "course": student.get("course") or student.get("Course", ""),
            "section": student.get("section") or student.get("Section", ""),
            "match_score": round(score, 4),
            "anti_spoof_confidence": confidence,
            "anti_spoof_probs": probs
        }

    except Exception:
        print("❌ ERROR in recognize_face():", traceback.format_exc())
        return {"error": "Internal server error"}
