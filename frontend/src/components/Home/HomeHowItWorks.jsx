import { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import {
  FaUserPlus,
  FaCamera,
  FaClipboardCheck,
  FaChartLine,
} from "react-icons/fa";

function HowItWorks() {
  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
  }, []);

  // All icons now use green gradient variations
  const steps = [
    {
      id: 1,
      title: "Student Registration",
      desc: "Students upload their COR and complete face registration across multiple angles for accuracy.",
      icon: <FaUserPlus />,
      color: "from-emerald-400 to-green-600",
    },
    {
      id: 2,
      title: "Attendance Session",
      desc: "Instructors activate the session, while the system scans faces in real-time using AI.",
      icon: <FaCamera />,
      color: "from-green-500 to-emerald-700",
    },
    {
      id: 3,
      title: "Automated Logging",
      desc: "Students are automatically marked Present, Late, or Absent, stored securely in the database.",
      icon: <FaClipboardCheck />,
      color: "from-emerald-300 to-green-500",
    },
    {
      id: 4,
      title: "Dashboards & Reports",
      desc: "Admins and instructors monitor attendance, generate insights, and export reports instantly.",
      icon: <FaChartLine />,
      color: "from-green-400 to-emerald-600",
    },
  ];

  return (
    <section className="relative bg-neutral-950 text-white py-20 px-6 md:px-12 overflow-hidden">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/20 via-neutral-900 to-black"></div>
      <div className="absolute top-40 left-10 w-72 h-72 bg-emerald-500/20 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-40 right-10 w-72 h-72 bg-green-600/20 blur-[120px] rounded-full"></div>

      {/* Header */}
      <div className="relative text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-emerald-400 to-green-600 bg-clip-text text-transparent drop-shadow-lg">
          How It Works
        </h2>
        <p className="text-gray-400 mt-4 max-w-2xl mx-auto">
          A seamless and secure step-by-step process that transforms attendance
          into a smarter, automated system.
        </p>
      </div>

      {/* Timeline Layout */}
      <div className="relative max-w-5xl mx-auto">
        {/* Vertical Line with Glow */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-emerald-400 via-green-500 to-emerald-600 shadow-[0_0_25px_5px_rgba(16,185,129,0.4)]"></div>

        {/* Steps */}
        <div className="space-y-20 relative z-10">
          {steps.map((step, i) => (
            <div
              key={step.id}
              className={`flex flex-col md:flex-row items-center ${
                i % 2 === 0 ? "md:justify-start" : "md:justify-end"
              }`}
              data-aos={i % 2 === 0 ? "fade-right" : "fade-left"}
            >
              {/* Content Card with Glassmorphism */}
              <div
                className={`relative w-full md:w-1/2 backdrop-blur-lg bg-white/5 border border-emerald-500/20 rounded-xl shadow-lg p-8 hover:shadow-emerald-500/30 transition-all duration-300 ${
                  i % 2 === 0 ? "md:mr-12 text-left" : "md:ml-12 text-right"
                }`}
              >
                <span className="text-emerald-400 font-bold text-sm uppercase tracking-wider">
                  Step {step.id}
                </span>
                <h3 className="text-2xl font-bold mt-2 mb-3">{step.title}</h3>
                <p className="text-gray-300 text-base leading-relaxed">
                  {step.desc}
                </p>
              </div>

              {/* Icon Badge (Green Gradient Only) */}
              <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center justify-center w-20 h-20 rounded-full bg-neutral-950 border-4 border-neutral-950 shadow-lg">
                <div
                  className={`flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br ${step.color} text-white text-2xl shadow-[0_0_20px_rgba(16,185,129,0.5)]`}
                >
                  {step.icon}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;
