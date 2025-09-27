import { useEffect, useState } from "react";
import emailjs from "@emailjs/browser";
import axios from "axios";
import { toast } from "react-toastify";
import AOS from "aos";
import "aos/dist/aos.css";
import { FaUserTie, FaUser, FaEnvelope, FaLock, FaIdBadge } from "react-icons/fa";

const InstructorRegisterComponent = () => {
  const [formData, setFormData] = useState({
    instructor_id: "",
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    confirm_password: "",
  });

  const [otpSent, setOtpSent] = useState(false);
  const [enteredOtp, setEnteredOtp] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");

  useEffect(() => {
    AOS.init({ duration: 800, once: true });
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

  const sendOtp = () => {
    const otp = generateOtp();
    setGeneratedOtp(otp);

    const emailParams = {
      instructor_name: `${formData.first_name} ${formData.last_name}`,
      otp_code: otp,
      to_email: formData.email,
    };

    emailjs
      .send(
        "service_m4ms27t",
        "template_fziuwnk",
        emailParams,
        "y3BmHmZwAFxMQuUVe"
      )
      .then(() => {
        toast.success("OTP sent to your email.");
        setOtpSent(true);
      })
      .catch((err) => {
        console.error("EmailJS error:", err);
        toast.error("Failed to send OTP.");
      });
  };

  const verifyOtpAndRegister = async () => {
    if (enteredOtp !== generatedOtp) {
      toast.error("Invalid OTP. Please try again.");
      return;
    }

    try {
      const res = await axios.post("http://localhost:5000/api/instructor/register", formData);
      if (res.status === 201) {
        toast.success("Registration successful!");
        setFormData({
          instructor_id: "",
          first_name: "",
          last_name: "",
          email: "",
          password: "",
          confirm_password: "",
        });
        setOtpSent(false);
        setEnteredOtp("");
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Registration failed.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 relative overflow-hidden px-4 py-10">
      {/* Background Glow Accents */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-500/20 blur-[160px] rounded-full"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-green-600/20 blur-[160px] rounded-full"></div>

      {/* Glassmorphism Card */}
      <div
        className="relative z-10 w-full max-w-2xl p-10 rounded-2xl backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl"
        data-aos="fade-up"
      >
        {/* Title */}
        <h2 className="text-3xl font-extrabold text-center mb-2 bg-gradient-to-r from-emerald-400 to-green-600 bg-clip-text text-transparent">
          Instructor Registration
        </h2>
        <p className="text-center text-gray-300 mb-8">
          Secure your instructor account with OTP verification.
        </p>

        {/* Inputs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Instructor ID */}
          <div className="relative">
            <FaIdBadge className="absolute top-1/2 left-3 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              name="instructor_id"
              placeholder="Instructor ID"
              className="w-full pl-10 pr-4 py-3 rounded-lg bg-neutral-900/40 border border-neutral-700/50 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-white placeholder-gray-400"
              onChange={handleChange}
              value={formData.instructor_id}
            />
          </div>

          {/* First Name */}
          <div className="relative">
            <FaUser className="absolute top-1/2 left-3 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              name="first_name"
              placeholder="First Name"
              className="w-full pl-10 pr-4 py-3 rounded-lg bg-neutral-900/40 border border-neutral-700/50 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-white placeholder-gray-400"
              onChange={handleChange}
              value={formData.first_name}
            />
          </div>

          {/* Last Name */}
          <div className="relative">
            <FaUser className="absolute top-1/2 left-3 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              name="last_name"
              placeholder="Last Name"
              className="w-full pl-10 pr-4 py-3 rounded-lg bg-neutral-900/40 border border-neutral-700/50 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-white placeholder-gray-400"
              onChange={handleChange}
              value={formData.last_name}
            />
          </div>

          {/* Email */}
          <div className="relative">
            <FaEnvelope className="absolute top-1/2 left-3 transform -translate-y-1/2 text-gray-400" />
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              className="w-full pl-10 pr-4 py-3 rounded-lg bg-neutral-900/40 border border-neutral-700/50 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-white placeholder-gray-400"
              onChange={handleChange}
              value={formData.email}
            />
          </div>

          {/* Password */}
          <div className="relative">
            <FaLock className="absolute top-1/2 left-3 transform -translate-y-1/2 text-gray-400" />
            <input
              type="password"
              name="password"
              placeholder="Password"
              className="w-full pl-10 pr-4 py-3 rounded-lg bg-neutral-900/40 border border-neutral-700/50 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-white placeholder-gray-400"
              onChange={handleChange}
              value={formData.password}
            />
          </div>

          {/* Confirm Password */}
          <div className="relative">
            <FaLock className="absolute top-1/2 left-3 transform -translate-y-1/2 text-gray-400" />
            <input
              type="password"
              name="confirm_password"
              placeholder="Confirm Password"
              className="w-full pl-10 pr-4 py-3 rounded-lg bg-neutral-900/40 border border-neutral-700/50 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-white placeholder-gray-400"
              onChange={handleChange}
              value={formData.confirm_password}
            />
          </div>
        </div>

        {/* OTP Flow */}
        {!otpSent ? (
          <button
            onClick={sendOtp}
            className="w-full mt-8 py-3 rounded-lg font-semibold text-lg shadow-lg transition-all
              bg-gradient-to-r from-emerald-500 to-green-600 text-white 
              hover:scale-105 hover:shadow-emerald-500/40"
          >
            Send OTP to Email
          </button>
        ) : (
          <div className="mt-8 space-y-4">
            <input
              type="text"
              placeholder="Enter OTP"
              value={enteredOtp}
              onChange={(e) => setEnteredOtp(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-neutral-900/40 border border-neutral-700/50 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-white placeholder-gray-400"
            />
            <button
              onClick={verifyOtpAndRegister}
              className="w-full py-3 rounded-lg font-semibold text-lg shadow-lg transition-all
                bg-gradient-to-r from-emerald-500 to-green-600 text-white 
                hover:scale-105 hover:shadow-emerald-500/40"
            >
              Verify & Register
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstructorRegisterComponent;
