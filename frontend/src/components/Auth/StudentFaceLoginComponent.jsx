// src/components/Student/StudentFaceLoginComponent.jsx
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
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
  const [cooldownUntil, setCooldownUntil] = useState(0);

  const attemptingRef = useRef(false);

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
      if (!faceDetected) {
        setFaceDetected(true);

        if (
          !attemptingRef.current &&
          !isLoggingIn &&
          !loading &&
          !recognizedStudent &&
          Date.now() >= cooldownUntil
        ) {
          attemptingRef.current = true;
          setTimeout(() => {
            handleScanFace();
          }, 800);
        }
      }

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
      if (faceDetected) {
        setFaceDetected(false);
        attemptingRef.current = false;
      }
    }
  };

  const captureImage = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) return null;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    return canvas.toDataURL("image/jpeg");
  };

  const handleScanFace = async () => {
    if (isLoggingIn || loading) return;
    if (Date.now() < cooldownUntil) return;

    setLoading(true);
    const imgData = captureImage();
    if (!imgData) {
      setLoading(false);
      return;
    }

    try {
      const res = await studentFaceLogin({ image: imgData });
      const data = res.data;

      if (res.status === 200 && data?.student) {
        if (data.anti_spoof_probs && data.anti_spoof_probs.real < 0.8) {
          toast.error(
            `🚫 Spoof suspected (real=${(
              data.anti_spoof_probs.real * 100
            ).toFixed(1)}%)`
          );
          attemptingRef.current = false;
          setCooldownUntil(Date.now() + 5000);
          return;
        }

        const student = data.student;
        setRecognizedStudent(student);
        toast.success(`🎉 Welcome, ${student.first_name}! Logging in...`);

        setTimeout(() => {
          loginStudent(data.token, student);
        }, 1000);
      } else {
        toast.error("❌ Face not recognized. Try again.");
        attemptingRef.current = false;
        setCooldownUntil(Date.now() + 5000);
      }
    } catch (err) {
      console.error("Face login error:", err);
      toast.error(err.response?.data?.error || "Server error.");
      attemptingRef.current = false;
      setCooldownUntil(Date.now() + 5000);
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

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center bg-neutral-950 text-white px-4 py-10 overflow-hidden">
      {/* Glow background */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-500/20 blur-[160px] rounded-full"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-green-600/20 blur-[160px] rounded-full"></div>

      {/* Header */}
      <div className="text-center mb-8 relative z-10">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-2 bg-gradient-to-r from-emerald-400 to-green-600 bg-clip-text text-transparent">
          Student Face Login
        </h1>
        <p className="text-gray-300 text-lg">
          Align your face and get logged in automatically
        </p>
      </div>

      {/* Webcam Frame */}
      <div className={`relative w-[320px] h-[320px] md:w-[420px] md:h-[420px] rounded-2xl overflow-hidden border-4 transition-all shadow-2xl ${faceDetected ? "border-emerald-400 shadow-emerald-500/40" : "border-gray-700"}`}>
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

      {/* Status Feedback */}
      <div className="text-center mt-6 relative z-10">
        {faceDetected ? (
          recognizedStudent ? (
            <p className="text-xl font-semibold text-emerald-400 animate-pulse">
              🎉 Welcome {recognizedStudent.first_name}!
            </p>
          ) : (
            <p className="text-lg text-blue-300 animate-pulse">
              Face detected — scanning...
            </p>
          )
        ) : (
          <p className="text-gray-400">Please align your face with the camera</p>
        )}
      </div>

      <ToastContainer position="top-right" autoClose={3000} theme="dark" />
    </div>
  );
}

export default StudentFaceLoginComponent;
