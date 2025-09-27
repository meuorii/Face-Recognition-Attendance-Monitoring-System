// src/components/Admin/AdminLoginComponent.jsx
import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FaUserShield, FaLock } from "react-icons/fa"; // ✅ Icons

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
        localStorage.setItem("userData", JSON.stringify(res.data.admin));

        navigate("/admin/dashboard"); // ✅ redirect after login
      }
    } catch (err) {
      const msg = err.response?.data?.error || "Login failed.";
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-neutral-950">
      {/* Background Glow Effects */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-500/20 blur-[160px] rounded-full"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-green-600/20 blur-[160px] rounded-full"></div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 shadow-2xl">
        <h2 className="text-3xl font-extrabold text-center bg-gradient-to-r from-emerald-400 to-green-600 bg-clip-text text-transparent mb-2">
          Admin Login
        </h2>
        <p className="text-center text-gray-400 mb-8 text-sm">
          Access the dashboard and manage the system securely.
        </p>

        <div className="space-y-5">
          {/* Admin ID */}
          <div className="relative">
            <FaUserShield className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
            <input
              type="text"
              placeholder="Admin ID"
              className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/10 border border-white/20 
                text-white placeholder-gray-400 
                focus:outline-none focus:ring-2 focus:ring-emerald-500 
                hover:border-emerald-400 hover:bg-white/20 
                transition-all duration-300 ease-in-out"
              value={adminId}
              onChange={(e) => setAdminId(e.target.value)}
            />
          </div>

          {/* Password */}
          <div className="relative">
            <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
            <input
              type="password"
              placeholder="Password"
              className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/10 border border-white/20 
                text-white placeholder-gray-400 
                focus:outline-none focus:ring-2 focus:ring-emerald-500 
                hover:border-emerald-400 hover:bg-white/20 
                transition-all duration-300 ease-in-out"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* Login Button */}
          <button
            onClick={handleLogin}
            className="w-full py-3 rounded-lg font-semibold text-white 
              bg-gradient-to-r from-emerald-500 to-green-600 
              shadow-lg 
              hover:from-green-500 hover:to-emerald-600 
              hover:scale-[1.03] hover:shadow-emerald-500/40 
              active:scale-95
              transition-all duration-300 ease-in-out"
          >
            Login
          </button>
        </div>

        {/* Register prompt */}
        <p className="text-sm text-center text-gray-400 mt-6">
          Don’t have an admin account?{" "}
          <span
            className="text-emerald-400 hover:underline cursor-pointer"
            onClick={() => navigate("/admin/register")}
          >
            Register here
          </span>
        </p>
      </div>
    </div>
  );
};

export default AdminLoginComponent;
