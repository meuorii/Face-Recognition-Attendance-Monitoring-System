// src/components/Student/StudentFaceLoginComponent.jsx
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import { FaCamera, FaUserPlus } from "react-icons/fa";
import { studentFaceLogin } from "../../services/api";
import * as mpFaceMesh from "@mediapipe/face_mesh";
import { Camera } from "@mediapipe/camera_utils";
import "react-toastify/dist/ReactToastify.css";

function StudentFaceLoginComponent() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const cameraRef = useRef(null);
  const faceMeshRef = useRef(null);

  const [faceDetected, setFaceDetected] = useState(false);
  const [recognizedStudent, setRecognizedStudent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // ✅ Redirect if already logged in
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userType = localStorage.getItem("userType");
    if (token && userType === "student") {
      navigate("/student/dashboard", { replace: true });
    }
  }, [navigate]);

  // ✅ Setup MediaPipe FaceMesh
  useEffect(() => {
    let isMounted = true;

    const setup = async () => {
      try {
        const video = videoRef.current;
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (!isMounted) return;

        video.srcObject = stream;
        await new Promise((resolve) => (video.onloadeddata = resolve));
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
      } catch (err) {
        console.error("Webcam/FaceMesh error:", err);
        toast.error("Unable to access webcam.");
      }
    };

    setup();
    return () => {
      isMounted = false;
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    const video = videoRef.current;
    if (video?.srcObject) {
      video.srcObject.getTracks().forEach((t) => t.stop());
    }
    cameraRef.current?.stop();
  };

  const onResults = (results) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    if (!video.videoWidth || !video.videoHeight) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

    if (results.multiFaceLandmarks?.length) {
      if (!faceDetected) setFaceDetected(true);

      const landmarks = results.multiFaceLandmarks[0];
      const xs = landmarks.map((p) => p.x * canvas.width);
      const ys = landmarks.map((p) => p.y * canvas.height);
      const xMin = Math.min(...xs),
        yMin = Math.min(...ys);
      const xMax = Math.max(...xs),
        yMax = Math.max(...ys);

      ctx.beginPath();
      ctx.strokeStyle = "lime";
      ctx.lineWidth = 2;
      ctx.rect(xMin, yMin, xMax - xMin, yMax - yMin);
      ctx.stroke();
    } else {
      if (faceDetected) setFaceDetected(false);
    }
  };

  const captureImage = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      toast.error("⚠️ Video not ready yet.");
      return null;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1); // mirror
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    return canvas.toDataURL("image/jpeg");
  };

  const handleScanFace = async () => {
    if (isLoggingIn || loading) return;

    const imgData = captureImage();
    if (!imgData) return;

    setLoading(true);
    try {
      const res = await studentFaceLogin({ image: imgData });
      const data = res.data;

      if (res.status === 200 && data?.student) {
        const student = data.student;

        setRecognizedStudent(student);
        toast.success(`🎉 Welcome, ${student.first_name}! Logging in...`);

        // ✅ Delay navigation so toast can show
        setTimeout(() => {
          loginStudent(data.token, student);
        }, 1500);
      } else {
        toast.error("❌ Face not recognized. Try again or register.");
      }
    } catch (err) {
      console.error("Face login error:", err);
      toast.error(err.response?.data?.error || "Server error.");
    } finally {
      setLoading(false);
    }
  };

  const loginStudent = (token, student) => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);

    localStorage.setItem("token", token);
    localStorage.setItem("userType", "student");
    localStorage.setItem("userData", JSON.stringify(student));

    navigate("/student/dashboard", { replace: true });
  };

  const handleRegister = () => {
    navigate("/student/register");
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-white flex flex-col items-center justify-center px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-green-400 mb-2">Student Face Login</h1>
        <p className="text-gray-300 text-lg">
          Align your face and click scan to login
        </p>
      </div>

      <div className="relative w-80 h-80 rounded-2xl overflow-hidden border-4 border-green-500 shadow-xl mb-6">
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

      <div className="text-center mb-6">
        {recognizedStudent ? (
          <p className="text-xl text-green-300 font-semibold mb-1">
            Welcome {recognizedStudent.first_name}! 👋
          </p>
        ) : faceDetected ? (
          <p className="text-blue-300">Face detected — ready to scan</p>
        ) : (
          <p className="text-gray-400">Align your face to the camera</p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-6 justify-center items-center text-center">
        <div>
          <button
            onClick={handleScanFace}
            disabled={loading || isLoggingIn}
            className="bg-green-500 hover:bg-green-600 disabled:opacity-50 px-6 py-3 rounded-lg text-lg font-semibold flex items-center justify-center gap-2 min-w-[200px]"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>
                Scanning...
              </>
            ) : (
              <>
                <FaCamera />
                Scan Face
              </>
            )}
          </button>
          <p className="text-sm text-gray-400 mt-2">Start face recognition</p>
        </div>

        <div>
          <button
            onClick={handleRegister}
            className="bg-blue-500 hover:bg-blue-600 px-6 py-3 rounded-lg text-lg font-semibold flex items-center justify-center gap-2 min-w-[200px]"
          >
            <FaUserPlus />
            Register
          </button>
          <p className="text-sm text-gray-400 mt-2">Register a new student</p>
        </div>
      </div>

      <ToastContainer position="top-right" autoClose={3000} theme="dark" />
    </div>
  );
}

export default StudentFaceLoginComponent;
