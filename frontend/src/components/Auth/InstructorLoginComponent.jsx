import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FaLock, FaUserTie } from "react-icons/fa";

const InstructorLoginComponent = () => {
  const [instructorId, setInstructorId] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!instructorId || !password) {
      toast.error("Please fill in all fields.");
      return;
    }

    try {
      const res = await axios.post("http://localhost:5000/api/instructor/login", {
        instructor_id: instructorId,
        password,
      });

      if (res.data?.token && res.data?.instructor) {
        toast.success("Login successful!");
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("userType", "instructor");
        localStorage.setItem("userData", JSON.stringify(res.data.instructor));
        navigate("/instructor/dashboard");
      } else {
        toast.error("Invalid response from server.");
      }
    } catch (err) {
      const msg = err.response?.data?.error || "Login failed.";
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 relative overflow-hidden px-4">
      {/* Background glow accents */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-500/20 blur-[160px] rounded-full"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-green-600/20 blur-[160px] rounded-full"></div>

      {/* Glassmorphism Login Card */}
      <div className="relative z-10 w-full max-w-md p-10 rounded-2xl backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl">
        {/* Header */}
        <h2 className="text-3xl font-extrabold text-center mb-8 bg-gradient-to-r from-emerald-400 to-green-600 bg-clip-text text-transparent">
          Instructor Login
        </h2>

        <div className="space-y-5">
          {/* Instructor ID */}
          <div className="relative">
            <FaUserTie className="absolute top-1/2 left-3 transform -translate-y-1/2 text-gray-400 text-lg" />
            <input
              type="text"
              placeholder="Instructor ID"
              className="w-full pl-10 pr-4 py-3 rounded-lg bg-neutral-900/40 border border-neutral-700/50 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-white placeholder-gray-400"
              value={instructorId}
              onChange={(e) => setInstructorId(e.target.value)}
            />
          </div>

          {/* Password */}
          <div className="relative">
            <FaLock className="absolute top-1/2 left-3 transform -translate-y-1/2 text-gray-400 text-lg" />
            <input
              type="password"
              placeholder="Password"
              className="w-full pl-10 pr-4 py-3 rounded-lg bg-neutral-900/40 border border-neutral-700/50 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-white placeholder-gray-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* Login Button */}
          <button
            onClick={handleLogin}
            className="w-full py-3 rounded-lg font-semibold text-lg shadow-lg transition-all 
              bg-gradient-to-r from-emerald-500 to-green-600 text-white 
              hover:scale-105 hover:shadow-emerald-500/40"
          >
            Login
          </button>

          {/* Register Link */}
          <p className="text-sm text-center text-gray-300 mt-4">
            Don’t have an account?{" "}
            <span
              className="text-emerald-400 hover:underline cursor-pointer"
              onClick={() => navigate("/instructor/register")}
            >
              Register here
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default InstructorLoginComponent;
