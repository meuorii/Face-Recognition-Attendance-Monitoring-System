import { useEffect, useRef, useState } from "react";
import { detectBlink } from "../services/api";
import { Camera } from "@mediapipe/camera_utils";
import { FaceMesh } from "@mediapipe/face_mesh";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function BlinkTester() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const lastBlinkTimeRef = useRef(0);
  const [ear, setEar] = useState(null);
  const [isBlinking, setIsBlinking] = useState(false);

  useEffect(() => {
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

    faceMesh.onResults(onResults);

    const initCamera = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const videoElement = videoRef.current;
      videoElement.srcObject = stream;
      await videoElement.play();

      const camera = new Camera(videoElement, {
        onFrame: async () => {
          await faceMesh.send({ image: videoElement });
        },
        width: 640,
        height: 480,
      });

      camera.start();
    };

    initCamera();

    return () => {
      const tracks = videoRef.current?.srcObject?.getTracks();
      tracks?.forEach((track) => track.stop());
    };
  }, []);

  const onResults = async (results) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

    if (
      results.multiFaceLandmarks &&
      results.multiFaceLandmarks.length > 0
    ) {
      const rawLandmarks = results.multiFaceLandmarks[0];
      const width = canvas.width;
      const height = canvas.height;

      const formattedLandmarks = rawLandmarks.map((pt) => ({
        x: pt.x,
        y: pt.y,
      }));

      try {
        const res = await detectBlink({
          landmarks: formattedLandmarks,
          width,
          height,
        });

        const now = Date.now();
        const cooldown = 2000; // 2 seconds

        if (res.data?.ear !== undefined) {
          setEar(res.data.ear);
          setIsBlinking(res.data.is_blink);

          if (res.data.is_blink && now - lastBlinkTimeRef.current > cooldown) {
            toast.success("🟢 Blink Detected!");
            lastBlinkTimeRef.current = now;
          }
        } else {
          toast.error("❌ Blink detection failed.");
        }
      } catch (err) {
        console.error("Blink check error:", err);
        toast.error("❌ Error contacting blink API");
      }
    }
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-white p-6 flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold text-green-400 mb-4">Blink Tester</h1>

      <div className="relative w-[640px] h-[480px] border-4 border-green-500 rounded-lg overflow-hidden shadow-md">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          style={{ transform: "scaleX(-1)" }}
          autoPlay
          playsInline
          muted
        />
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
          style={{ transform: "scaleX(-1)" }}
        />
      </div>

      <div className="mt-6 text-center">
        <p className="text-xl">
          👁️ EAR: <span className="text-yellow-300">{ear ?? "--"}</span>
        </p>
        <p className="text-xl mt-2">
          {isBlinking ? (
            <span className="text-green-400 font-bold animate-pulse">Blinking</span>
          ) : (
            <span className="text-gray-400">No Blink</span>
          )}
        </p>
      </div>

      <ToastContainer position="top-right" autoClose={3000} theme="dark" />
    </div>
  );
}

export default BlinkTester;
