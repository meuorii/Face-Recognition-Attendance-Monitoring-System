import { useEffect, useState } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import {
  FaUserShield,
  FaUsers,
  FaChalkboardTeacher,
  FaLaptopCode,
  FaCamera,
  FaRobot,
  FaFingerprint,
  FaRegFileAlt,
  FaUserFriends,
  FaLock,
  FaUserTie,
  FaChalkboard,
  FaUserGraduate,
  FaMicrochip,
} from "react-icons/fa";

function FeaturesSection() {
  const [activeTab, setActiveTab] = useState("admin");

  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
  }, []);

  // Features data
  const features = {
    admin: [
      {
        title: "Centralized Dashboard",
        description:
          "Manage students, instructors, subjects, and attendance in one secure hub.",
        icon: <FaUserShield />,
      },
      {
        title: "Student Management",
        description:
          "Upload CORs, import via CSV, monitor profiles, and check face registration status.",
        icon: <FaUsers />,
      },
      {
        title: "Instructor Assignment",
        description:
          "Easily link instructors to sections and subjects with flexible schedules.",
        icon: <FaChalkboardTeacher />,
      },
      {
        title: "Attendance Monitoring",
        description:
          "View logs, filter by section/subject, and export reports to PDF/CSV.",
        icon: <FaRegFileAlt />,
      },
    ],
    instructor: [
      {
        title: "Instructor Dashboard",
        description:
          "Access assigned subjects and sections with real-time updates.",
        icon: <FaLaptopCode />,
      },
      {
        title: "Secure Attendance Sessions",
        description:
          "Activate attendance during schedules, with camera and AI scanning.",
        icon: <FaCamera />,
      },
      {
        title: "Real-Time Logs",
        description:
          "See students marked as Present, Late, or Absent instantly.",
        icon: <FaUsers />,
      },
      {
        title: "Exportable Reports",
        description:
          "Download subject-based attendance logs for documentation.",
        icon: <FaRegFileAlt />,
      },
    ],
    student: [
      {
        title: "Face-Based Login",
        description:
          "Students log in using only their face — secure and password-free.",
        icon: <FaFingerprint />,
      },
      {
        title: "Certificate Upload",
        description:
          "Upload COR, auto-detect schedule, year, and subjects for current semester.",
        icon: <FaRegFileAlt />,
      },
      {
        title: "Attendance Dashboard",
        description:
          "View attendance history, schedules, and overall percentage summary.",
        icon: <FaUsers />,
      },
      {
        title: "Downloadable Reports",
        description:
          "Get attendance reports instantly in PDF for personal tracking.",
        icon: <FaRegFileAlt />,
      },
    ],
    ai: [
      {
        title: "ResNet Anti-Spoofing",
        description:
          "Detects fake faces from photos, videos, or screens before recognition.",
        icon: <FaRobot />,
      },
      {
        title: "ArcFace Recognition",
        description:
          "High-accuracy face verification powered by InsightFace embeddings.",
        icon: <FaFingerprint />,
      },
      {
        title: "Multi-Angle Registration",
        description:
          "Captures 5 angles (front, left, right, up, down) for robust accuracy.",
        icon: <FaCamera />,
      },
      {
        title: "Real-Time Multi-Face Detection",
        description:
          "Detects and processes multiple students simultaneously during sessions.",
        icon: <FaUserFriends />,
      }
    ],
  };

  return (
    <section className="relative bg-neutral-900 text-white py-20 px-6 md:px-12 overflow-hidden">
      {/* Gradient Glow Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/20 via-transparent to-green-800/10 pointer-events-none"></div>

      {/* Section Header */}
      <div
        className="relative max-w-5xl mx-auto text-center mb-14"
        data-aos="fade-up"
      >
        <h2 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-emerald-400 to-green-600 text-transparent bg-clip-text drop-shadow-lg">
          System Features
        </h2>
        <p className="text-gray-400 max-w-2xl mx-auto mt-4 text-lg">
          Explore how our AI-powered Attendance Monitoring System empowers
          <span className="text-emerald-400 font-semibold"> Admins</span>,{" "}
          <span className="text-emerald-300 font-semibold">Instructors</span>, and{" "}
          <span className="text-emerald-200 font-semibold">Students</span>.
        </p>
      </div>

      {/* Tabs */}
      <div className="relative flex justify-center gap-3 mb-12 flex-wrap z-10">
        <button
          onClick={() => setActiveTab("admin")}
          className={`flex items-center gap-2 px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
            activeTab === "admin"
              ? "bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg scale-105"
              : "bg-neutral-800 text-gray-400 hover:bg-neutral-700"
          }`}
        >
          <FaUserTie /> Admin
        </button>
        <button
          onClick={() => setActiveTab("instructor")}
          className={`flex items-center gap-2 px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
            activeTab === "instructor"
              ? "bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg scale-105"
              : "bg-neutral-800 text-gray-400 hover:bg-neutral-700"
          }`}
        >
          <FaChalkboard /> Instructor
        </button>
        <button
          onClick={() => setActiveTab("student")}
          className={`flex items-center gap-2 px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
            activeTab === "student"
              ? "bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg scale-105"
              : "bg-neutral-800 text-gray-400 hover:bg-neutral-700"
          }`}
        >
          <FaUserGraduate /> Student
        </button>
        <button
          onClick={() => setActiveTab("ai")}
          className={`flex items-center gap-2 px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
            activeTab === "ai"
              ? "bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg scale-105"
              : "bg-neutral-800 text-gray-400 hover:bg-neutral-700"
          }`}
        >
          <FaMicrochip /> AI Models
        </button>
      </div>

      {/* Feature Cards */}
      <div
        className="relative grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 max-w-7xl mx-auto z-10"
        data-aos="fade-up"
      >
        {features[activeTab].map((feature, index) => (
          <div
            key={index}
            className="relative bg-neutral-900/70 backdrop-blur-xl border border-neutral-700 rounded-2xl p-6 shadow-lg transition-transform duration-300 hover:-translate-y-2 hover:shadow-emerald-500/30"
          >
            {/* Number Badge */}
            <span className="absolute -top-4 -left-4 flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold text-sm shadow-md">
              {String(index + 1).padStart(2, "0")}
            </span>

            {/* Icon */}
            <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-600/20 text-emerald-400 text-3xl mb-4">
              {feature.icon}
            </div>

            {/* Title & Description */}
            <h3 className="text-lg font-bold text-white mb-2">
              {feature.title}
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default FeaturesSection;
