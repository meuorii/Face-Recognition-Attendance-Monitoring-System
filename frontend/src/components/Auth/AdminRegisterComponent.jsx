// src/components/Admin/Auth/AdminRegisterComponent.jsx
import { useEffect, useState } from "react";
import emailjs from "@emailjs/browser";
import axios from "axios";
import { toast } from "react-toastify";
import AOS from "aos";
import "aos/dist/aos.css";
import {
  FaIdBadge,
  FaUser,
  FaUserAlt,
  FaEnvelope,
  FaLock,
  FaKey,
  FaShieldAlt,
} from "react-icons/fa"; // ✅ Icons

const AdminRegisterComponent = () => {
  const [formData, setFormData] = useState({
    user_id: "",
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    confirm_password: "",
  });

  const [otpSent, setOtpSent] = useState(false);
  const [enteredOtp, setEnteredOtp] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [sending, setSending] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    AOS.init({ duration: 800, once: true });
  }, []);

  const handleChange = (e) => {
    setFormData((s) => ({ ...s, [e.target.name]: e.target.value }));
  };

  const generateOtp = () =>
    Math.floor(100000 + Math.random() * 900000).toString();

  const sendOtp = async () => {
    if (
      !formData.user_id ||
      !formData.first_name ||
      !formData.last_name ||
      !formData.email ||
      !formData.password ||
      !formData.confirm_password
    ) {
      toast.error("Please fill in all fields.");
      return;
    }
    if (formData.password !== formData.confirm_password) {
      toast.error("Passwords do not match.");
      return;
    }

    try {
      setSending(true);
      const otp = generateOtp();
      setGeneratedOtp(otp);

      const emailParams = {
        admin_name: `${formData.first_name} ${formData.last_name}`,
        otp_code: otp,
        to_email: formData.email,
        year: new Date().getFullYear(),
      };

      await emailjs.send(
        "service_m4ms27t", // 🔧 replace with your EmailJS service ID
        "template_viipmkn", // 🔧 replace with your OTP template ID
        emailParams,
        "y3BmHmZwAFxMQuUVe" // 🔧 replace with your public key
      );

      toast.success("OTP sent to your email.");
      setOtpSent(true);
    } catch (err) {
      console.error("EmailJS error:", err);
      toast.error("Failed to send OTP.");
    } finally {
      setSending(false);
    }
  };

  const verifyOtpAndRegister = async () => {
    if (enteredOtp !== generatedOtp) {
      toast.error("Invalid OTP. Please try again.");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        user_id: formData.user_id,
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        password: formData.password,
      };

      const res = await axios.post(
        "http://localhost:5000/api/admin/register",
        payload
      );

      if (res.status === 201) {
        toast.success("Admin registration successful!");
        setFormData({
          user_id: "",
          first_name: "",
          last_name: "",
          email: "",
          password: "",
          confirm_password: "",
        });
        setEnteredOtp("");
        setGeneratedOtp("");
        setOtpSent(false);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Registration failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-4 py-10 relative overflow-hidden">
      {/* Gradient background glows */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-500/20 blur-[160px] rounded-full"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-green-600/20 blur-[160px] rounded-full"></div>

      <div
        className="relative z-10 bg-white/10 backdrop-blur-xl text-white p-8 md:p-10 
        rounded-2xl w-full max-w-2xl shadow-2xl border border-white/20"
        data-aos="fade-up"
      >
        <h2 className="text-3xl font-extrabold text-center bg-gradient-to-r from-emerald-400 to-green-600 bg-clip-text text-transparent drop-shadow mb-2">
          Admin Registration
        </h2>
        <p className="text-center text-gray-300 mb-6">
          Register your admin account with OTP verification.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Admin ID */}
          <div className="relative">
            <FaIdBadge className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              name="user_id"
              placeholder="Admin ID"
              className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white 
                placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 
                hover:border-emerald-400 hover:bg-white/20 transition-all duration-300"
              onChange={handleChange}
              value={formData.user_id}
            />
          </div>

          {/* First Name */}
          <div className="relative">
            <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              name="first_name"
              placeholder="First Name"
              className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white 
                placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 
                hover:border-emerald-400 hover:bg-white/20 transition-all duration-300"
              onChange={handleChange}
              value={formData.first_name}
            />
          </div>

          {/* Last Name */}
          <div className="relative">
            <FaUserAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              name="last_name"
              placeholder="Last Name"
              className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white 
                placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 
                hover:border-emerald-400 hover:bg-white/20 transition-all duration-300"
              onChange={handleChange}
              value={formData.last_name}
            />
          </div>

          {/* Email */}
          <div className="relative">
            <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white 
                placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 
                hover:border-emerald-400 hover:bg-white/20 transition-all duration-300"
              onChange={handleChange}
              value={formData.email}
            />
          </div>

          {/* Password */}
          <div className="relative">
            <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="password"
              name="password"
              placeholder="Password"
              className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white 
                placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 
                hover:border-emerald-400 hover:bg-white/20 transition-all duration-300"
              onChange={handleChange}
              value={formData.password}
            />
          </div>

          {/* Confirm Password */}
          <div className="relative">
            <FaKey className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="password"
              name="confirm_password"
              placeholder="Confirm Password"
              className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white 
                placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 
                hover:border-emerald-400 hover:bg-white/20 transition-all duration-300"
              onChange={handleChange}
              value={formData.confirm_password}
            />
          </div>
        </div>

        {/* OTP Flow */}
        {!otpSent ? (
          <button
            onClick={sendOtp}
            disabled={sending}
            className="w-full mt-6 py-3 rounded-lg font-semibold text-white 
              bg-gradient-to-r from-emerald-500 to-green-600 shadow-lg 
              hover:from-green-500 hover:to-emerald-600 hover:scale-[1.02] 
              hover:shadow-emerald-500/40 active:scale-95 
              transition-all duration-300 ease-in-out"
          >
            {sending ? "Sending OTP..." : "Send OTP to Email"}
          </button>
        ) : (
          <div className="mt-6 space-y-4">
            <div className="relative">
              <FaShieldAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Enter OTP"
                value={enteredOtp}
                onChange={(e) => setEnteredOtp(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/10 border border-white/20 
                  text-white placeholder-gray-400 focus:outline-none focus:ring-2 
                  focus:ring-emerald-500 hover:border-emerald-400 hover:bg-white/20 
                  transition-all duration-300"
              />
            </div>
            <button
              onClick={verifyOtpAndRegister}
              disabled={submitting}
              className="w-full py-3 rounded-lg font-semibold text-white 
                bg-gradient-to-r from-emerald-500 to-green-600 shadow-lg 
                hover:from-green-500 hover:to-emerald-600 hover:scale-[1.02] 
                hover:shadow-emerald-500/40 active:scale-95 
                transition-all duration-300 ease-in-out"
            >
              {submitting ? "Registering..." : "Verify & Register"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminRegisterComponent;
