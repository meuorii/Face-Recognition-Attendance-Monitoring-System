import { useEffect, useState } from "react";
import emailjs from "@emailjs/browser";
import axios from "axios";
import { toast } from "react-toastify";
import AOS from "aos";
import "aos/dist/aos.css";

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
    <div className="min-h-screen bg-neutral-900 flex items-center justify-center px-4 py-10">
      <div
        className="bg-neutral-800 text-white p-8 rounded-2xl w-full max-w-2xl shadow-2xl border border-neutral-900"
        data-aos="fade-up"
      >
        <h2 className="text-3xl font-bold text-center text-green-400 mb-2">
          Instructor Registration
        </h2>
        <p className="text-center text-gray-400 mb-6">
          Secure your instructor access by registering with OTP verification.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            name="instructor_id"
            placeholder="Instructor ID"
            className="px-4 py-3 rounded-lg bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-green-400"
            onChange={handleChange}
            value={formData.instructor_id}
          />
          <input
            type="text"
            name="first_name"
            placeholder="First Name"
            className="px-4 py-3 rounded-lg bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-green-400"
            onChange={handleChange}
            value={formData.first_name}
          />
          <input
            type="text"
            name="last_name"
            placeholder="Last Name"
            className="px-4 py-3 rounded-lg bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-green-400"
            onChange={handleChange}
            value={formData.last_name}
          />
          <input
            type="email"
            name="email"
            placeholder="Email Address"
            className="px-4 py-3 rounded-lg bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-green-400"
            onChange={handleChange}
            value={formData.email}
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            className="px-4 py-3 rounded-lg bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-green-400"
            onChange={handleChange}
            value={formData.password}
          />
          <input
            type="password"
            name="confirm_password"
            placeholder="Confirm Password"
            className="px-4 py-3 rounded-lg bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-green-400"
            onChange={handleChange}
            value={formData.confirm_password}
          />
        </div>

        {!otpSent ? (
          <button
          onClick={sendOtp}
          className="w-full mt-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold text-white transition hover:animate-pulse"
        >
          Send OTP to Email
        </button>
        ) : (
          <div className="mt-6 space-y-4">
            <input
              type="text"
              placeholder="Enter OTP"
              value={enteredOtp}
              onChange={(e) => setEnteredOtp(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
            <button
                onClick={verifyOtpAndRegister}
                className="w-full py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold text-white transition hover:animate-pulse"
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
