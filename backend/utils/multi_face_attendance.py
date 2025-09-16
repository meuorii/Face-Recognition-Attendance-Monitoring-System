import cv2
import numpy as np
import time
from datetime import datetime
from utils.model_loader import get_face_model
from models.face_db_model import load_registered_faces
from models.attendance_logs_model import log_attendance
from scipy.spatial.distance import cosine

# Settings
MATCH_THRESHOLD = 0.40
ATTENDANCE_DELAY = 5  # seconds before same face can be logged again

# Load InsightFace model
face_model = get_face_model()

# Load all registered face embeddings
def load_embeddings():
    print("\U0001F4C2 Loading registered face embeddings...")
    all_faces = load_registered_faces()
    embeddings = []
    for face in all_faces:
        student_id = face.get("student_id") or face.get("Student_ID")
        full_name = f"{face.get('first_name', '')} {face.get('last_name', '')}".strip()
        for angle, vector in face.get("embeddings", {}).items():
            embeddings.append({
                "student_id": student_id,
                "name": full_name,
                "embedding": np.array(vector, dtype=float)
            })
    print(f"✅ Loaded {len(embeddings)} embeddings.")
    return embeddings

# Match a face embedding
def match_face(live_embedding, registered_embeddings, threshold=MATCH_THRESHOLD):
    best_match = None
    best_score = float("inf")

    for entry in registered_embeddings:
        score = cosine(live_embedding, entry["embedding"])
        if score < threshold and score < best_score:
            best_match = entry
            best_score = score

    return best_match, best_score

# Main attendance loop
def start_attendance_session(subject="Default Subject", subject_id=None, subject_start_time=None):
    embeddings = load_embeddings()
    seen = {}  # student_id: timestamp

    cap = cv2.VideoCapture(0)
    print("\U0001F3A5 Starting classroom attendance...")

    while True:
        ret, frame = cap.read()
        if not ret:
            continue

        faces = face_model.get(frame)

        for face in faces:
            if not hasattr(face, "embedding"):
                continue

            bbox = face.bbox.astype(int)
            x1, y1, x2, y2 = bbox
            embedding = face.embedding

            matched, score = match_face(embedding, embeddings)
            if matched:
                student_id = matched["student_id"]
                full_name = matched["name"]

                # Prevent duplicate logging every X seconds
                last_seen = seen.get(student_id)
                now = time.time()
                if not last_seen or now - last_seen >= ATTENDANCE_DELAY:
                    log_attendance(
                        student_data={
                            "student_id": student_id,
                            "first_name": full_name.split()[0],
                            "last_name": full_name.split()[-1]
                        },
                        subject=subject,
                        subject_id=subject_id,
                        subject_start_time=subject_start_time or datetime.now().isoformat()
                    )
                    print(f"✅ Attendance logged for {full_name}")
                    seen[student_id] = now

                # Draw green box and name
                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                cv2.putText(frame, full_name, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)
            else:
                # Draw red box and label as Unknown
                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 0, 255), 2)
                cv2.putText(frame, "Unknown", (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 0, 255), 2)

        cv2.imshow("\U0001F4F7 Classroom Attendance", frame)
        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

    cap.release()
    cv2.destroyAllWindows()
    print("\U0001F4C1 Attendance session ended.")
