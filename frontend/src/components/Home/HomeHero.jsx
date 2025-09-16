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
    <section className="relative h-screen flex items-center text-white px-6 md:px-12 bg-neutral-900">
      {/* Background Image */}
      <div data-aos="fade-in" className="absolute inset-0 z-10">
        <img
          src="/images/homehero.jpg"
          alt="Hero Background"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Black Overlay */}
      <div data-aos="fade-in" className="absolute inset-0 bg-black/50 z-20"></div>

      {/* Login Button */}
      <div className="absolute top-6 right-6 flex items-center space-x-2 z-30" data-aos="fade-down">
        <img src="/images/login.png" alt="Login" className="w-6 h-6 md:w-8 md:h-8" />
        <button className="text-white font-medium text-sm md:text-base transition-transform transform hover:scale-110">
          Log In
        </button>
      </div>

      {/* Main Content */}
      <div className="relative z-30 max-w-3xl text-left ml-8 md:ml-24" data-aos="fade-up">
        <h1 className="text-4xl md:text-6xl font-bold leading-tight">
          Revolutionize Attendance with Face Recognition
        </h1>
        <p className="mt-4 text-lg md:text-xl max-w-2xl">
          Effortlessly track attendance with our AI-powered system, designed for accuracy and convenience at PRMSU-Iba Campus - CCIT.
        </p>

        <div className="mt-6 flex flex-col md:flex-row gap-4">
          {/* Get Started Button - NOW it navigates to /select */}
          <button
            onClick={handleGetStarted}
            className="bg-gray-900 text-white px-6 py-3 rounded-lg text-lg w-full md:w-auto transition-all transform hover:scale-105 hover:bg-gray-700"
          >
            Get Started
          </button>

          {/* Learn More Button */}
          <a
            href="#how-it-works"
            className="bg-green-500 text-white px-6 py-3 rounded-lg text-lg w-full md:w-auto transition-all transform hover:scale-105 hover:bg-green-400 text-center"
          >
            Learn More
          </a>
        </div>
      </div>
    </section>
  );
}

export default HomeHero;
