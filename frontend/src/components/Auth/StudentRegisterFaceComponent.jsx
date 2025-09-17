import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaSave, FaPlay, FaCheckCircle } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { registerFaceAuto } from "../../services/api";
import * as mpFaceMesh from "@mediapipe/face_mesh";
import { Camera } from "@mediapipe/camera_utils";

const REQUIRED_ANGLES = ["front", "left", "right", "up", "down"];
const COURSES = ["BSCS", "BSINFOTECH"];

function StudentRegisterFaceComponent() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const cameraRef = useRef(null);
  const faceMeshRef = useRef(null);

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
    Middle_Name: "",
    Last_Name: "",
    Email: "",
    Contact_Number: "",
    Course: "",
  });

  const formDataRef = useRef(formData);
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);
  useEffect(() => {
    isCapturingRef.current = isCapturing;
  }, [isCapturing]);

  useEffect(() => {
    let isMounted = true;

    const setup = async () => {
      const video = videoRef.current;

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 640 },
        });
        if (!isMounted) return;

        video.srcObject = stream;
        await new Promise((resolve) => {
          video.onloadeddata = resolve;
        });
        await video.play();

        const faceMesh = new mpFaceMesh.FaceMesh({
          locateFile: (file) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
        });

        faceMesh.setOptions({
          maxNumFaces: 1,
          refineLandmarks: true,
          minDetectionConfidence: 0.6,
          minTrackingConfidence: 0.6,
        });

        faceMesh.onResults(onResults);
        faceMeshRef.current = faceMesh;

        const camera = new Camera(video, {
          onFrame: async () => {
            if (faceMeshRef.current) {
              await faceMeshRef.current.send({ image: video });
            }
          },
          width: 640,
          height: 640,
        });

        cameraRef.current = camera;
        camera.start();
      } catch (error) {
        console.error("Error accessing webcam or FaceMesh:", error);
        toast.error("Unable to access webcam.");
      }
    };

    setup();

    return () => {
      isMounted = false;
      stopCamera();
    };
  }, []);

  useEffect(() => {
    if (Object.keys(angleStatus).length === REQUIRED_ANGLES.length) {
      setIsCapturing(false);
      toast.success("🎉 All angles captured successfully!");
    }
  }, [angleStatus]);

  const stopCamera = () => {
    const video = videoRef.current;
    if (video?.srcObject) {
      video.srcObject.getTracks().forEach((track) => track.stop());
    }
    if (cameraRef.current) {
      cameraRef.current.stop();
    }
  };

  const onResults = async (results) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

    if (results.multiFaceLandmarks?.length) {
      setFaceDetected(true);

      const landmarks = results.multiFaceLandmarks[0];
      const xs = landmarks.map((p) => p.x * canvas.width);
      const ys = landmarks.map((p) => p.y * canvas.height);
      const xMin = Math.min(...xs),
        yMin = Math.min(...ys);
      const xMax = Math.max(...xs),
        yMax = Math.max(...ys);

      // Predict angle
      const detectedAngle = predictAngle(landmarks, canvas.width, canvas.height);
      setCurrentAngle(detectedAngle);

      // Draw bounding box
      ctx.beginPath();
      ctx.strokeStyle = "lime";
      ctx.lineWidth = 2;
      ctx.rect(xMin, yMin, xMax - xMin, yMax - yMin);
      ctx.stroke();

      handleAutoCapture(detectedAngle);
    } else {
      setFaceDetected(false);
    }
  };

  const handleAutoCapture = async (detectedAngle) => {
    const now = Date.now();
    const lastCapture = lastCaptureTimeRef.current[detectedAngle] || 0;
    const formReady = Object.values(formDataRef.current).every(
      (val) => String(val).trim() !== ""
    );

    if (
      isCapturingRef.current &&
      !capturedToastRef.current[detectedAngle] &&
      REQUIRED_ANGLES.includes(detectedAngle) &&
      formReady &&
      now - lastCapture > 2000
    ) {
      lastCaptureTimeRef.current[detectedAngle] = now;
      const image = captureImage();
      if (image) {
        try {
          const res = await registerFaceAuto({
            student_id: formDataRef.current.Student_ID,
            first_name: formDataRef.current.First_Name,
            middle_name: formDataRef.current.Middle_Name,
            last_name: formDataRef.current.Last_Name,
            email: formDataRef.current.Email,
            contact_number: formDataRef.current.Contact_Number,
            course: formDataRef.current.Course,
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

    if (nosePos < 0.35) return "right";   // a bit looser
    if (nosePos > 0.75) return "left";    // a bit looser
    if (upDownRatio > 1.8) return "down"; // was 2.5, relaxed
    if (upDownRatio < 0.55) return "up";  // was 0.3, relaxed
    return "front";
  };

  const captureImage = () => {
    const video = videoRef.current;
    if (!video) return null;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");

    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    return canvas.toDataURL("image/jpeg", 0.92);
  };

  const handleStartCapture = () => {
    const formReady = Object.values(formData).every(
      (val) => String(val).trim() !== ""
    );
    if (!formReady) {
      toast.warning("Please complete all fields.");
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
          Fill in your details and register your face from multiple angles.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          {/* LEFT: CAMERA + STATUS */}
          <div className="flex flex-col items-center">
            <div className="relative w-100 h-100 rounded-2xl overflow-hidden border-4 border-green-500 shadow-xl">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
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
                    Face Detected ({Object.keys(angleStatus).length}/
                    {REQUIRED_ANGLES.length})
                  </p>
                  {currentAngle && (
                    <p className="text-blue-400 text-sm">
                      Current Angle:{" "}
                      <span className="uppercase">{currentAngle}</span>
                    </p>
                  )}
                </>
              ) : (
                <p className="text-red-400 font-medium text-sm">
                  ❌ No Face Detected
                </p>
              )}
            </div>

            {/* Progress Bar */}
            <div className="w-full max-w-sm mt-4">
              <p className="text-sm text-center mb-1">
                Captured: {Object.keys(angleStatus).length} /{" "}
                {REQUIRED_ANGLES.length}
              </p>
              <div className="bg-gray-700 h-2 rounded">
                <div
                  className="bg-green-500 h-2 rounded transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Angle Status */}
            <div className="grid grid-cols-5 gap-2 mt-4">
              {REQUIRED_ANGLES.map((angle) => (
                <div
                  key={angle}
                  className="flex flex-col items-center text-center"
                >
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
                  <span className="text-xs mt-1 text-green-300 uppercase">
                    {angle}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: FORM */}
          <div>
            <div className="grid grid-cols-2 gap-4 mt-6 mb-6">
              <input
                name="Student_ID"
                placeholder="Student ID:"
                onChange={handleChange}
                className="p-3 rounded bg-neutral-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <input
                name="First_Name"
                placeholder="First Name:"
                onChange={handleChange}
                className="p-3 rounded bg-neutral-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <input
                name="Middle_Name"
                placeholder="Middle Name:"
                onChange={handleChange}
                className="p-3 rounded bg-neutral-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <input
                name="Last_Name"
                placeholder="Last Name:"
                onChange={handleChange}
                className="p-3 rounded bg-neutral-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <input
                name="Email"
                placeholder="Email:"
                type="email"
                onChange={handleChange}
                className="p-3 rounded bg-neutral-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 col-span-2"
              />
              <input
                name="Contact_Number"
                placeholder="Contact Number:"
                type="tel"
                onChange={handleChange}
                className="p-3 rounded bg-neutral-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 col-span-2"
              />
              <select
                name="Course"
                value={formData.Course}
                onChange={handleChange}
                className="p-3 rounded bg-neutral-800 text-white focus:outline-none focus:ring-2 focus:ring-green-500 col-span-2"
              >
                <option value="">Course:</option>
                {COURSES.map((course) => (
                  <option key={course} value={course}>
                    {course}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-center lg:justify-start">
              {!isCapturing &&
              Object.keys(angleStatus).length < REQUIRED_ANGLES.length ? (
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
