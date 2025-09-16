import numpy as np

LEFT_EYE = [362, 385, 387, 263, 373, 380]
RIGHT_EYE = [33, 160, 158, 133, 153, 144]
EAR_THRESHOLD = 0.17

def calculate_ear(eye):
    A = np.linalg.norm(eye[1] - eye[5])
    B = np.linalg.norm(eye[2] - eye[4])
    C = np.linalg.norm(eye[0] - eye[3])
    return (A + B) / (2.0 * C)

def detect_blink_from_landmarks(landmarks, width, height):
    try:
        landmark_points = np.array([[lm['x'] * width, lm['y'] * height] for lm in landmarks])

        left_eye = landmark_points[LEFT_EYE]
        right_eye = landmark_points[RIGHT_EYE]

        left_ear = calculate_ear(left_eye)
        right_ear = calculate_ear(right_eye)
        avg_ear = (left_ear + right_ear) / 2.0

        is_blink = float(avg_ear) < EAR_THRESHOLD  # safely cast to Python bool

        print("🔎 LEFT_EYE:", left_eye)
        print("🔎 RIGHT_EYE:", right_eye)
        print("🔢 EAR: Left =", left_ear, ", Right =", right_ear, ", Avg =", avg_ear)
        print("✅ Blink Detected?", is_blink)

        return {
            "ear": round(float(avg_ear), 4),
            "is_blink": bool(is_blink)
        }

    except Exception as e:
        print("❌ Error in blink detection:", str(e))
        return {
            "error": str(e),
            "ear": 0.0,
            "is_blink": False
        }
