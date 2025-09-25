import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AOS from "aos";
import "aos/dist/aos.css";

function CallToAction() {
  const navigate = useNavigate();

  useEffect(() => {
    AOS.init({ duration: 1000, once: true }); 
  }, []);

  return (
    <section className="relative bg-neutral-950 py-24 px-6 md:px-12 overflow-hidden">
      {/* Background Gradient Blurs */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/20 via-neutral-900 to-black"></div>
      <div className="absolute top-20 left-10 w-80 h-80 bg-emerald-500/20 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-20 right-20 w-80 h-80 bg-green-600/20 blur-[120px] rounded-full"></div>

      <div
        className="relative max-w-4xl mx-auto text-center p-10 rounded-3xl border border-emerald-500/30 bg-white/5 backdrop-blur-lg shadow-2xl"
        data-aos="fade-up"
      >
        {/* CTA Heading */}
        <h2 className="text-4xl md:text-5xl font-extrabold mb-6 bg-gradient-to-r from-emerald-400 to-green-600 bg-clip-text text-transparent drop-shadow-lg">
          Ready to Experience Smart Attendance?
        </h2>

        {/* CTA Subheading */}
        <p className="text-gray-300 text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
          Join PRMSU-CCIT’s Face Recognition Attendance Monitoring System today and
          simplify attendance tracking effortlessly with AI-powered accuracy.
        </p>

        {/* CTA Button */}
        <button
          onClick={() => navigate("/select")}
          className="px-10 py-4 rounded-full text-lg font-semibold shadow-lg 
                     bg-gradient-to-r from-emerald-500 to-green-600 text-white
                     hover:from-emerald-400 hover:to-green-500 hover:shadow-emerald-500/40 
                     transition-all duration-300"
        >
          Get Started
        </button>
      </div>
    </section>
  );
}

export default CallToAction;
