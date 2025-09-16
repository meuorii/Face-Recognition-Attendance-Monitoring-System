from flask import Blueprint, request, jsonify
from utils.blink_detection import detect_blink_from_landmarks

blink_bp = Blueprint("blink", __name__)

@blink_bp.route("/blink-detect", methods=["POST"])
def blink_detect():
    print("📥 Received /blink-detect request")

    try:
        data = request.get_json()

        if not data:
            return jsonify({"error": "No data received"}), 400

        landmarks = data.get("landmarks")
        width = data.get("width")
        height = data.get("height")

        if not isinstance(landmarks, list) or not width or not height:
            return jsonify({"error": "Missing or invalid landmarks/size"}), 400

        if len(landmarks) < max(362, 385):  # Safe check
            return jsonify({"error": "Not enough landmarks provided"}), 400

        print(f"🧠 Processing EAR with width={width}, height={height}, landmarks={len(landmarks)}")

        result = detect_blink_from_landmarks(landmarks, width, height)

        print("📊 EAR Result:", result)
        return jsonify(result), 200

    except Exception as e:
        print("❌ Exception in /blink-detect:", str(e))
        return jsonify({"error": "Internal server error"}), 500
