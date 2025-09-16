import cv2
import json
import numpy as np
from datetime import datetime
import mediapipe as mp
from insightface.app import FaceAnalysis

# === SETUP ===
face_model = FaceAnalysis(name='buffalo_l')
face_model.prepare(ctx_id=0)

mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(refine_landmarks=True)

angles = ["center", "left", "right", "up", "down"]
angle_prompts = {
    "center": "Look STRAIGHT at the camera",
    "left": "Turn your head LEFT",
    "right": "Turn your head RIGHT",
    "up": "Look UP slightly",
    "down": "Look DOWN slightly"
}

student_id = input("Enter student ID: ").strip()
output_json = f"student_{student_id}_embeddings.json"
embeddings = {
    "student_id": student_id,
    "created_at": datetime.utcnow().isoformat(),
    "embeddings": {}
}

# === ANGLE DETECTION HELPERS ===
def estimate_angle(landmarks):
    nose_tip = landmarks[1]
    chin = landmarks[152]
    left_eye = landmarks[33]
    right_eye = landmarks[263]

    dx = right_eye.x - left_eye.x
    dy = chin.y - nose_tip.y

    if abs(dx) > 0.07:
        return "left" if dx < 0 else "right"
    elif dy > 0.05:
        return "down"
    elif dy < -0.05:
        return "up"
    else:
        return "center"

# === CAMERA LOOP ===
cap = cv2.VideoCapture(0)
current_angle_index = 0

print("\\n📸 Face Registration Started")
print("➡️ Follow instructions and hold each pose until confirmed.")

while cap.isOpened() and current_angle_index < len(angles):
    ret, frame = cap.read()
    if not ret:
        break

    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = face_mesh.process(frame_rgb)

    display_text = angle_prompts[angles[current_angle_index]]
    cv2.putText(frame, display_text, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)

    if results.multi_face_landmarks:
        landmarks = results.multi_face_landmarks[0].landmark
        detected_angle = estimate_angle(landmarks)

        if detected_angle == angles[current_angle_index]:
            faces = face_model.get(frame)
            if faces:
                embeddings["embeddings"][angles[current_angle_index]] = faces[0].embedding.tolist()
                print(f"✅ Captured: {angles[current_angle_index]}")
                current_angle_index += 1
                cv2.waitKey(1000)
        else:
            cv2.putText(frame, f"HOLD angle: {angles[current_angle_index]}", (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)

    cv2.imshow("Multi-Angle Registration", frame)
    if cv2.waitKey(1) & 0xFF == 27:
        break

cap.release()
cv2.destroyAllWindows()

# === SAVE
if len(embeddings["embeddings"]) == len(angles):
    with open(output_json, "w") as f:
        json.dump(embeddings, f, indent=2)
    print(f"\\n✅ Face embeddings saved to: {output_json}")
else:
    print("\\n⚠️ Incomplete registration. Some angles were not captured.")
