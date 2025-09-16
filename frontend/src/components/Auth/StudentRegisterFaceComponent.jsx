import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaSave, FaPlay, FaCheckCircle } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { registerFaceAuto } from "../../services/api";
import { FaceMesh } from "@mediapipe/face_mesh";
import { Camera } from "@mediapipe/camera_utils";

const REQUIRED_ANGLES = ["center", "left", "right", "up", "down"];
const COURSES = ["BSCS", "BSINFOTECH"];
const YEAR_SECTIONS = [
  "1A", "1B", "1C", "1D",
  "2A", "2B", "2C", "2D",
  "3A", "3B", "3C", "3D",
  "4A", "4B", "4C", "4D"
];

function StudentRegisterFaceComponent() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const lastCaptureTimeRef = useRef({});
  const capturedToastRef = useRef({});
  const isCapturingRef = useRef(false);

  const [angleStatus, setAngleStatus] = useState({});
  const [faceDetected, setFaceDetected] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [currentAngle, setCurrentAngle] = useState(null);

  const [formData, setFormData] = useState({
    Student_ID: "",
    First_Name: "",
    Last_Name: "",
    Middle_Name: "",
    Course: "",
    Section: "",
  });

  const formDataRef = useRef(formData);
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  useEffect(() => {
    isCapturingRef.current = isCapturing;
  }, [isCapturing]);

  useEffect(() => {
    startWebcam();
    return () => stopWebcam();
  }, []);

  useEffect(() => {
    if (Object.keys(angleStatus).length === REQUIRED_ANGLES.length) {
      setIsCapturing(false);
      toast.success("🎉 All angles captured successfully!");
    }
  }, [angleStatus]);

  const stopWebcam = () => {
    const stream = videoRef.current?.srcObject;
    if (stream) stream.getTracks().forEach((t) => t.stop());
  };

  const startWebcam = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const faceMesh = new FaceMesh({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
    });

    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.6,
      minTrackingConfidence: 0.6,
    });

    faceMesh.onResults(async (results) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

      const currentForm = formDataRef.current;

      if (results.multiFaceLandmarks?.length > 0) {
        setFaceDetected(true);
        const landmarks = results.multiFaceLandmarks[0];
        const w = canvas.width;
        const h = canvas.height;
        const detectedAngle = predictAngle(landmarks, w, h);
        setCurrentAngle(detectedAngle);

        const now = Date.now();
        const lastCapture = lastCaptureTimeRef.current[detectedAngle] || 0;
        const formReady = Object.values(currentForm).every((val) => val.trim() !== "");

        const xs = landmarks.map((p) => p.x * w);
        const ys = landmarks.map((p) => p.y * h);
        const minX = Math.min(...xs);
        const minY = Math.min(...ys);
        const maxX = Math.max(...xs);
        const maxY = Math.max(...ys);
        ctx.strokeStyle = "#00FF00";
        ctx.lineWidth = 3;
        ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);

        if (
          isCapturingRef.current &&
          !capturedToastRef.current[detectedAngle] &&
          REQUIRED_ANGLES.includes(detectedAngle) &&
          formReady &&
          now - lastCapture > 2000
        ) {
          lastCaptureTimeRef.current[detectedAngle] = now;
          const image = captureBase64();

          if (image) {
            try {
              const res = await registerFaceAuto({
                student_id: currentForm.Student_ID,
                first_name: currentForm.First_Name,
                last_name: currentForm.Last_Name,
                middle_name: currentForm.Middle_Name,
                course: currentForm.Course,
                section: currentForm.Section,
                image,
                angle: detectedAngle,
              });

              if (res.data?.success && res.data.angle === detectedAngle) {
                setAngleStatus((prev) => {
                  const updated = { ...prev, [detectedAngle]: true };
                  if (!capturedToastRef.current[detectedAngle]) {
                    capturedToastRef.current[detectedAngle] = true;
                    toast.success(`✅ Captured: ${detectedAngle}`);
                  }
                  return updated;
                });
              } else {
                toast.warn("⚠️ Server rejected image. Try again.");
              }
            } catch (error) {
              console.error("❌ Capture error:", error);
              toast.error("❌ Failed to save image.");
            }
          }
        }
      } else {
        setFaceDetected(false);
      }
    });

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      video.srcObject = stream;
      video.onloadedmetadata = async () => {
        await video.play();
        new Camera(video, {
          onFrame: async () => {
            await faceMesh.send({ image: video });
          },
          width: 640,
          height: 480,
        }).start();
      };
    } catch (err) {
      console.error("❌ Camera error:", err);
    }
  };

  const predictAngle = (landmarks, w, h) => {
    const nose = landmarks[1];
    const leftEye = landmarks[33];
    const rightEye = landmarks[263];
    const mouth = landmarks[13];

    const noseY = nose.y * h;
    const eyeMidY = ((leftEye.y + rightEye.y) / 2) * h;
    const mouthY = mouth.y * h;

    const eyeDist = rightEye.x - leftEye.x;
    const nosePos = (nose.x - leftEye.x) / (eyeDist + 1e-6);
    const upDownRatio = (noseY - eyeMidY) / (mouthY - noseY + 1e-6);

    if (nosePos < 0.3) return "right";
    if (nosePos > 0.8) return "left";
    if (upDownRatio > 2.5) return "down";
    if (upDownRatio < 0.3) return "up";
    return "center";
  };

  const captureBase64 = () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) return null;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg");
  };

  const handleStartCapture = () => {
    const formReady = Object.values(formData).every((val) => val.trim() !== "");
    if (!formReady) {
      toast.warning("Please complete all student fields before starting.");
      return;
    }
    setIsCapturing(true);
    toast.info("📸 Auto capture started. Hold each angle steadily...");
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const progressPercent =
    (Object.keys(angleStatus).length / REQUIRED_ANGLES.length) * 100;

  return (
    <div className="min-h-screen bg-neutral-900 text-white px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-green-400 text-center mb-2">
          Student Face Registration
        </h1>
        <p className="text-center text-gray-400 mb-8">
          Ensure accurate identity by registering your face from multiple angles.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          {/* LEFT SIDE: CAMERA + STATUS */}
          <div className="flex flex-col items-center">
            <div className="relative w-[400px] aspect-square border-4 border-green-600 rounded-xl overflow-hidden">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                autoPlay
                playsInline
                muted
                style={{ transform: "scaleX(-1)" }}
              />
              <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 w-full h-full pointer-events-none"
                style={{ transform: "scaleX(-1)" }}
              />
            </div>

            <div className="text-center mt-3">
              {faceDetected ? (
                <>
                  <p className="text-green-400 text-sm">
                    Face Detected ({Object.keys(angleStatus).length}/{REQUIRED_ANGLES.length})
                  </p>
                  {currentAngle && (
                    <p className="text-blue-400 text-sm">
                      Current Angle: <span className="uppercase">{currentAngle}</span>
                    </p>
                  )}
                </>
              ) : (
                <p className="text-red-400 font-medium text-sm">❌ No Face Detected</p>
              )}
            </div>

            <div className="w-full max-w-sm mt-4">
              <p className="text-sm text-center mb-1">
                Captured: {Object.keys(angleStatus).length} / {REQUIRED_ANGLES.length}
              </p>
              <div className="bg-gray-700 h-2 rounded">
                <div
                  className="bg-green-500 h-2 rounded transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-5 gap-2 mt-4">
              {REQUIRED_ANGLES.map((angle) => (
                <div key={angle} className="flex flex-col items-center text-center">
                  <div
                    className={`w-12 h-12 rounded flex items-center justify-center border text-sm font-medium ${
                      angleStatus[angle]
                        ? "bg-green-600 text-white border-green-500"
                        : "bg-neutral-800 text-gray-400 border-green-500"
                    }`}
                  >
                    {angleStatus[angle] ? (
                      <FaCheckCircle className="text-white text-lg" />
                    ) : (
                      "Pending"
                    )}
                  </div>
                  <span className="text-xs mt-1 text-green-300 uppercase">{angle}</span>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT SIDE: FORM FIELDS */}
          <div>
            <div className="grid grid-cols-2 gap-4 mt-6 mb-6">
              {["Student_ID", "First_Name", "Last_Name", "Middle_Name"].map((name) => (
                <input
                  key={name}
                  name={name}
                  placeholder={name.replace("_", " ") + ":"}
                  onChange={handleChange}
                  className="p-3 rounded bg-neutral-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              ))}
              <select
                name="Course"
                value={formData.Course}
                onChange={handleChange}
                className="p-3 rounded bg-neutral-800 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Course:</option>
                {COURSES.map((course) => (
                  <option key={course} value={course}>
                    {course}
                  </option>
                ))}
              </select>
              <select
                name="Section"
                value={formData.Section}
                onChange={handleChange}
                className="p-3 rounded bg-neutral-800 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Year & Section:</option>
                {YEAR_SECTIONS.map((section) => (
                  <option key={section} value={section}>
                    {section}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-center lg:justify-start">
              {!isCapturing && Object.keys(angleStatus).length < REQUIRED_ANGLES.length ? (
                <button
                  onClick={handleStartCapture}
                  className="bg-green-500 hover:bg-green-600 px-6 py-3 rounded-lg text-lg font-semibold flex items-center gap-2"
                >
                  <FaPlay className="text-xl" />
                  Start Capture
                </button>
              ) : (
                <button
                  onClick={() => navigate("/student/login")}
                  className="bg-blue-500 hover:bg-blue-600 px-6 py-3 rounded-lg text-lg font-semibold flex items-center gap-2"
                >
                  <FaSave className="text-xl" />
                  All Done – Proceed to Login
                </button>
              )}
            </div>
          </div>
        </div>

        <ToastContainer position="top-right" autoClose={3000} theme="dark" />
      </div>
    </div>
  );
}

export default StudentRegisterFaceComponent;
  