import { useEffect, useState, useRef } from "react";
import { toast } from "react-toastify";
import { FaceDetection } from "@mediapipe/face_detection";
import { Camera } from "@mediapipe/camera_utils";

function DebugRegisterFaceComponent() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const angles = ["Center", "Left", "Right", "Up", "Down"];
  const [currentAngleIndex, setCurrentAngleIndex] = useState(0);
  const [capturedFaces, setCapturedFaces] = useState({});
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    startWebcam();
  }, []);

  const startWebcam = async () => {
    const video = videoRef.current;
    const faceDetection = new FaceDetection({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`,
    });

    faceDetection.setOptions({ model: "short", minDetectionConfidence: 0.5 });
    faceDetection.onResults(onResults);

    const camera = new Camera(video, {
      onFrame: async () => {
        await faceDetection.send({ image: video });
      },
      width: 640,
      height: 480,
    });

    camera.start();
  };

  const onResults = (results) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

    const angle = angles[currentAngleIndex];

    if (results.detections.length > 0 && isCapturing) {
      const detection = results.detections[0];
      const x = detection.boundingBox.xCenter;
      const y = detection.boundingBox.yCenter;

      console.log(`Angle: ${angle}, x: ${x.toFixed(2)}, y: ${y.toFixed(2)}`);

      if (!capturedFaces[angle.toLowerCase()]) {
        const image = captureImage();
        setCapturedFaces((prev) => ({
          ...prev,
          [angle.toLowerCase()]: image,
        }));
        toast.success(`Captured: ${angle}`);
        if (currentAngleIndex < angles.length - 1) {
          setTimeout(() => {
            setCurrentAngleIndex((prev) => prev + 1);
          }, 1000);
        } else {
          toast.success("✅ All angles captured!");
          setIsCapturing(false);
        }
      }
    }
  };

  const captureImage = () => {
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg");
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <h2 className="text-2xl mb-4">DEBUG FACE REGISTRATION</h2>
      <p className="mb-4">Current Angle: <span className="text-green-400">{angles[currentAngleIndex]}</span></p>

      <div className="relative w-fit">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-80 h-80 border-4 border-white rounded"
        />
        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          className="absolute top-0 left-0 w-80 h-80 pointer-events-none"
        />
      </div>

      <button
        onClick={() => {
          setIsCapturing(true);
          setCurrentAngleIndex(0);
          setCapturedFaces({});
          toast.info("Started debug capturing...");
        }}
        className="mt-6 bg-green-600 hover:bg-green-700 px-6 py-3 rounded text-white font-bold"
      >
        Start Debug Capture
      </button>
    </div>
  );
}

export default DebugRegisterFaceComponent;
