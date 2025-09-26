import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";

function HomeHero() {
  const navigate = useNavigate();

  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
  }, []);

  const handleGetStarted = () => {
    navigate("/select");
  };

  return (
    <section className="relative h-screen flex items-center text-white px-6 md:px-12 overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-10">
        <img
          src="/images/homehero.jpg"
          alt="Hero Background"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Dark Overlay + Green Gradient Glow */}
      <div className="absolute inset-0 bg-black/50 z-20"></div>
      <div className="absolute -top-20 -left-20 w-96 h-96 bg-emerald-500/20 blur-[160px] rounded-full z-20"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-green-600/20 blur-[160px] rounded-full z-20"></div>

      {/* Main Content */}
      <div
        className="relative z-30 max-w-3xl ml-6 md:ml-24"
        data-aos="fade-up"
      >
        {/* ✅ Text-only gradient effect, no glass box */}
        <h1 className="text-4xl md:text-6xl font-extrabold leading-tight 
          bg-gradient-to-r from-emerald-400 to-green-600 bg-clip-text text-transparent 
          drop-shadow-lg"
        >
          Revolutionize Attendance with Face Recognition
        </h1>

        <p className="mt-6 text-lg md:text-xl text-gray-200 max-w-2xl">
          Effortlessly track attendance with our AI-powered system, designed for
          accuracy and convenience at{" "}
          <span className="text-emerald-400 font-semibold">
            PRMSU-Iba Campus – CCIT
          </span>
          .
        </p>

        {/* Buttons */}
        <div className="mt-8 flex flex-col md:flex-row gap-4">
          <button
            onClick={handleGetStarted}
            className="px-8 py-4 rounded-xl font-semibold text-lg shadow-lg transition-all w-full md:w-auto
              bg-gradient-to-r from-emerald-500 to-green-600 text-white 
              hover:scale-105 hover:shadow-emerald-500/40"
          >
            Get Started
          </button>

          <a
            href="#how-it-works"
            className="px-8 py-4 rounded-xl font-semibold text-lg shadow-lg transition-all w-full md:w-auto
              backdrop-blur-md bg-white/10 border border-white/20 
              hover:bg-white/20 hover:scale-105 text-white text-center"
          >
            Learn More
          </a>
        </div>
      </div>
    </section>
  );
}

export default HomeHero;
