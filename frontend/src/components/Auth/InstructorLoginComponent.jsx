import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

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

      if (res.data?.token) {
        toast.success("Login successful!");
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("userType", "instructor");
        localStorage.setItem("userData", JSON.stringify(res.data));
        navigate("/instructor/dashboard"); // Update if your route is different
      }
    } catch (err) {
      const msg = err.response?.data?.error || "Login failed.";
      toast.error(msg);
    }
  };

    return (
  <div className="min-h-screen bg-neutral-900 flex items-center justify-center px-4">
    <div className="bg-neutral-800 text-white p-8 rounded-xl w-full max-w-md shadow-lg">
      <h2 className="text-2xl font-bold text-center text-green-400 mb-6">Instructor Login</h2>

      <div className="space-y-4">
        <input
          type="text"
          placeholder="Instructor ID"
          className="w-full px-4 py-3 rounded-lg bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-green-400"
          value={instructorId}
          onChange={(e) => setInstructorId(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full px-4 py-3 rounded-lg bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-green-400"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleLogin}
          className="w-full mt-2 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold text-white transition"
        >
          Login
        </button>

        {/* Register prompt */}
        <p className="text-sm text-center text-gray-400 mt-4">
          Don’t have an account?{" "}
          <span
            className="text-green-400 hover:underline cursor-pointer"
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
