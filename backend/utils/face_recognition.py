# File: utils/face_recognition.py

import cv2
import numpy as np
from datetime import datetime
from scipy.spatial.distance import cosine
from scipy.spatial import distance as dist
import mediapipe as mp
from models.face_db_model import load_registered_faces
from models.attendance_logs_model import log_attendance

REQUIRED_BLINKS = 2
CONSEC_FRAMES = 2
BLINK_RATIO = 0.75
BLINK_COOLDOWN = 10
MATCH_THRESHOLD = 0.4

mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(refine_landmarks=True, max_num_faces=1)

LEFT_EYE_IDX = [33, 160, 158, 133, 153, 144]
RIGHT_EYE_IDX = [362, 385, 387, 263, 373, 380]

def eye_aspect_ratio(eye):
    A = dist.euclidean(eye[1], eye[5])
    B = dist.euclidean(eye[2], eye[4])
    C = dist.euclidean(eye[0], eye[3])
    return (A + B) / (2.0 * C)

def find_matching_student(live_embedding, registered_faces, threshold=MATCH_THRESHOLD):
    best_match = None
    best_score = float("inf")

    for student in registered_faces:
        for angle, db_embedding in student.get("embeddings", {}).items():
            score = cosine(live_embedding, db_embedding)
            if score < threshold and score < best_score:
                best_match = student
                best_score = score

    return best_match, best_score

def handle_attendance_session(subject="Default Subject", subject_id=None, subject_start_time=None):
    registered_faces = load_registered_faces()
    seen_student_ids = set()

    cap = cv2.VideoCapture(0)
    blink_count = 0
    consec_frames = 0
    baseline_ear = None
    frame_idx = 0
    last_blink_frame = -100

    print("📌 Starting Attendance Session...")

    while True:
        ret, frame = cap.read()
        if not ret:
            continue

        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        result = face_mesh.process(rgb)

        if result.multi_face_landmarks:
            h, w = frame.shape[:2]
            landmarks = result.multi_face_landmarks[0]

            left_eye = [(int(landmarks.landmark[i].x * w), int(landmarks.landmark[i].y * h)) for i in LEFT_EYE_IDX]
            right_eye = [(int(landmarks.landmark[i].x * w), int(landmarks.landmark[i].y * h)) for i in RIGHT_EYE_IDX]

            left_ear = eye_aspect_ratio(left_eye)
            right_ear = eye_aspect_ratio(right_eye)
            ear = (left_ear + right_ear) / 2.0

            if baseline_ear is None:
                baseline_ear = ear
                print(f"👁 EAR baseline: {baseline_ear:.3f}")
            else:
                adaptive_thresh = baseline_ear * BLINK_RATIO

                if ear < adaptive_thresh:
                    consec_frames += 1
                else:
                    if consec_frames >= CONSEC_FRAMES and frame_idx - last_blink_frame > BLINK_COOLDOWN:
                        blink_count += 1
                        last_blink_frame = frame_idx
                        print(f"👁 Blink #{blink_count}")
                    consec_frames = 0

            cv2.putText(frame, f"Blinks: {blink_count}", (10, 30),
                        cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 255), 2)

            if blink_count >= REQUIRED_BLINKS:
                try:
                    result = DeepFace.represent(frame, model_name="Facenet", enforce_detection=False)
                    if result:
                        live_embedding = np.array(result[0]["embedding"])
                        student, score = find_matching_student(live_embedding, registered_faces)

                        if student and student["student_id"] not in seen_student_ids:
                            log_attendance(
                                student_data=student,
                                subject=subject,
                                subject_id=subject_id,
                                subject_start_time=subject_start_time
                            )
                            seen_student_ids.add(student["student_id"])

                            cv2.putText(frame, f"✅ {student['first_name']}", (10, 60),
                                        cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
                            print(f"✅ Attendance: {student['first_name']} {student['last_name']}")

                        blink_count = 0  # Reset for next user
                except Exception as e:
                    print("❌ DeepFace error:", e)

        frame_idx += 1
        cv2.imshow("📷 Attendance Session", frame)
        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

    cap.release()
    cv2.destroyAllWindows()
    print("📁 Attendance session ended.")

    return {
        "success": True,
        "message": "Attendance session ended.",
        "count": len(seen_student_ids)
    }
