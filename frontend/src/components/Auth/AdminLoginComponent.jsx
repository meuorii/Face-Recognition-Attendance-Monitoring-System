// src/components/Admin/AdminLoginComponent.jsx
import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const AdminLoginComponent = () => {
  const [adminId, setAdminId] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!adminId || !password) {
      toast.error("Please fill in all fields.");
      return;
    }

    try {
      const res = await axios.post("http://localhost:5000/api/admin/login", {
        user_id: adminId,
        password,
      });

      if (res.data?.token) {
        toast.success("Login successful!");
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("userType", "admin");
        localStorage.setItem("userData", JSON.stringify(res.data));

        navigate("/admin/dashboard"); // ✅ redirect after login
      }
    } catch (err) {
      const msg = err.response?.data?.error || "Login failed.";
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-900 flex items-center justify-center px-4">
      <div className="bg-neutral-800 text-white p-8 rounded-xl w-full max-w-md shadow-lg">
        <h2 className="text-2xl font-bold text-center text-green-400 mb-6">
          Admin Login
        </h2>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Admin ID"
            className="w-full px-4 py-3 rounded-lg bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-green-400"
            value={adminId}
            onChange={(e) => setAdminId(e.target.value)}
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
            Don’t have an admin account?{" "}
            <span
              className="text-green-400 hover:underline cursor-pointer"
              onClick={() => navigate("/admin/register")}
            >
              Register here
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginComponent;
