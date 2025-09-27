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

  // ✅ Stop capturing as soon as all angles are done
  useEffect(() => {
    if (Object.keys(angleStatus).length === REQUIRED_ANGLES.length) {
      setIsCapturing(false);
      isCapturingRef.current = false;
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
    // ✅ Guard: stop extra requests after all angles captured
    if (Object.keys(angleStatus).length === REQUIRED_ANGLES.length) return;

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

    if (nosePos < 0.35) return "right";
    if (nosePos > 0.75) return "left";
    if (upDownRatio > 1.8) return "down";
    if (upDownRatio < 0.55) return "up";
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
    isCapturingRef.current = true; // ✅ sync immediately
    toast.info("📸 Auto capture started. Hold each angle steadily...");
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const progressPercent =
    (Object.keys(angleStatus).length / REQUIRED_ANGLES.length) * 100;

  return (
    <div
      className="min-h-screen relative bg-neutral-950 text-white px-6 md:px-12 py-12 
                flex flex-col overflow-hidden"
    >
      {/* Background Glow Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/10 via-neutral-900 to-black"></div>
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-500/20 blur-[160px] rounded-full"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-green-600/20 blur-[160px] rounded-full"></div>
      <div className="relative z-10 w-full max-w-7xl mx-auto">
        <h1
          className="text-4xl md:text-5xl font-extrabold 
            bg-gradient-to-r from-emerald-400 to-green-600 
            bg-clip-text text-transparent 
            drop-shadow-lg text-center mb-4"
        >
          Student Face Registration
        </h1>
        <p
          className="text-center text-gray-300 text-lg md:text-xl 
            max-w-xl mx-auto leading-relaxed mb-10"
        >
          Fill in your details and register your face across multiple angles 
          to ensure high accuracy during attendance sessions.
        </p>

        {/* --- Layout --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          {/* LEFT: CAMERA + STATUS */}
          <div className="flex flex-col items-center">
            <div className="relative w-[380px] h-[380px] rounded-2xl overflow-hidden 
              border border-emerald-400/50 backdrop-blur-md 
              shadow-[0_0_40px_rgba(16,185,129,0.3)]">
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

            {/* Status */}
            <div className="text-center mt-4 space-y-2">
              {faceDetected ? (
                <>
                  <p className="inline-block px-4 py-1 rounded-full text-sm font-medium 
                    bg-green-500/20 text-green-400 border border-green-500/40">
                    ✅ Face Detected ({Object.keys(angleStatus).length}/{REQUIRED_ANGLES.length})
                  </p>
                  {currentAngle && (
                    <p className="inline-block px-4 py-1 rounded-full text-sm font-medium 
                      bg-blue-500/20 text-blue-400 border border-blue-500/40">
                      🎯 Current Angle: <span className="uppercase">{currentAngle}</span>
                    </p>
                  )}
                </>
              ) : (
                <p className="inline-block px-4 py-1 rounded-full text-sm font-medium 
                  bg-red-500/20 text-red-400 border border-red-500/40">
                  ❌ No Face Detected
                </p>
              )}
            </div>

            {/* Progress Bar */}
            <div className="w-full max-w-sm mt-6">
              <p className="text-sm text-center mb-2 text-gray-300">
                Captured: {Object.keys(angleStatus).length} / {REQUIRED_ANGLES.length}
              </p>
              <div className="bg-gray-800 h-3 rounded-full overflow-hidden">
                <div
                  className="h-3 rounded-full bg-gradient-to-r from-emerald-400 to-green-600 
                    transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Angle Status */}
            <div className="grid grid-cols-5 gap-4 mt-6">
              {REQUIRED_ANGLES.map((angle) => (
                <div key={angle} className="flex flex-col items-center text-center">
                  <div
                    className={`w-14 h-14 rounded-full flex items-center justify-center border-2 text-sm font-medium transition-all duration-300
                      ${
                        angleStatus[angle]
                          ? "bg-gradient-to-br from-emerald-400 to-green-600 text-white border-green-500 shadow-lg shadow-emerald-500/40"
                          : "bg-neutral-800 text-gray-400 border-gray-600"
                      }`}
                  >
                    {angleStatus[angle] ? (
                      <FaCheckCircle className="text-white text-xl" />
                    ) : (
                      "–"
                    )}
                  </div>
                  <span className="text-xs mt-2 text-gray-300 uppercase tracking-wide">
                    {angle}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: FORM */}
          <div className="w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 mb-6">
              <input name="Student_ID" placeholder="Student ID" onChange={handleChange} className="p-3 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all" />
              <input name="First_Name" placeholder="First Name" onChange={handleChange} className="p-3 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all" />
              <input name="Middle_Name" placeholder="Middle Name" onChange={handleChange} className="p-3 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all" />
              <input name="Last_Name" placeholder="Last Name" onChange={handleChange} className="p-3 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all" />
              <input name="Email" placeholder="Email" type="email" onChange={handleChange} className="p-3 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all md:col-span-2" />
              <input name="Contact_Number" placeholder="Contact Number" type="tel" onChange={handleChange} className="p-3 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all md:col-span-2" />
              <select name="Course" value={formData.Course} onChange={handleChange} className="p-3 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all md:col-span-2">
                <option value="">Course</option>
                {COURSES.map((course) => (
                  <option key={course} value={course} className="bg-neutral-900 text-white">
                    {course}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-center lg:justify-start mt-6">
              {!isCapturing &&
              Object.keys(angleStatus).length < REQUIRED_ANGLES.length ? (
                <button
                  onClick={handleStartCapture}
                  className="px-8 py-4 rounded-xl font-semibold text-lg flex items-center gap-3 
                    bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg 
                    hover:scale-105 hover:shadow-emerald-500/40 transition-all duration-300"
                >
                  <FaPlay className="text-xl" />
                  Start Capture
                </button>
              ) : (
                <button
                  onClick={() => navigate("/student/login")}
                  className="px-8 py-4 rounded-xl font-semibold text-lg flex items-center gap-3 
                    bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-lg 
                    hover:scale-105 hover:shadow-cyan-500/40 transition-all duration-300"
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
