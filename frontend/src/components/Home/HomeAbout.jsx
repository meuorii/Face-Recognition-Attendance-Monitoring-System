import { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import {
  FaUniversity,
  FaRobot,
  FaCamera,
  FaClipboardCheck,
} from "react-icons/fa";

function HomeAbout() {
  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
  }, []);

  return (
    <section className="relative bg-neutral-950 text-white py-20 px-6 md:px-12 overflow-hidden">
      {/* Background Gradient + Glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/20 via-neutral-900 to-black pointer-events-none"></div>
      <div className="absolute top-40 left-10 w-72 h-72 bg-emerald-500/20 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-20 right-20 w-72 h-72 bg-green-600/10 blur-[100px] rounded-full"></div>

      <div className="relative max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {/* Left Content */}
        <div data-aos="fade-right">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-6 bg-gradient-to-r from-emerald-400 to-green-600 bg-clip-text text-transparent drop-shadow-lg">
            About the System
          </h2>
          <p className="text-gray-400 text-lg mb-12 leading-relaxed max-w-xl">
            Our AI-powered attendance monitoring system ensures seamless and
            secure classroom management. Built for the{" "}
            <span className="text-emerald-400 font-semibold">
              CCIT Department at PRMSU-Iba Campus
            </span>
            , it integrates advanced face recognition for reliable verification.
          </p>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              {
                icon: <FaUniversity />,
                title: "Campus Integration",
                desc: "Specifically designed for CCIT Department, PRMSU-Iba Campus.",
              },
              {
                icon: <FaRobot />,
                title: "AI-Powered Verification",
                desc: "AI-driven face recognition ensures secure attendance validation.",
              },
              {
                icon: <FaCamera />,
                title: "Multi-Angle Registration",
                desc: "Captures multiple face angles (front, left, right, up, down) for accuracy.",
              },
              {
                icon: <FaClipboardCheck />,
                title: "Automated Tracking",
                desc: "Real-time dashboards for instructors and students with detailed logs.",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="group relative bg-neutral-900/70 border border-neutral-800 rounded-2xl p-6 shadow-lg hover:shadow-emerald-500/30 hover:-translate-y-2 transition-all duration-300"
                data-aos="zoom-in"
                data-aos-delay={i * 100}
              >
                {/* Glow Accent */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 rounded-2xl transition duration-300"></div>

                {/* Icon */}
                <div className="relative flex items-center justify-center w-14 h-14 mb-4 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-600/20 text-emerald-400 text-2xl shadow-inner">
                  {item.icon}
                </div>

                {/* Title & Desc */}
                <h3 className="relative text-lg font-bold text-white mb-2">
                  {item.title}
                </h3>
                <p className="relative text-gray-400 text-sm leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Image with Glow */}
        <div
          className="flex justify-center lg:justify-end relative"
          data-aos="fade-left"
        >
          <div className="relative">
            {/* Glowing background */}
            <div className="absolute -inset-6 bg-gradient-to-r from-emerald-500/20 to-green-600/20 blur-3xl rounded-2xl"></div>

            {/* Main Image */}
            <img
              src="/images/about.png"
              alt="About the System"
              className="relative w-full max-w-xl rounded-2xl shadow-2xl border border-neutral-800 transform hover:scale-105 transition duration-500"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default HomeAbout;
