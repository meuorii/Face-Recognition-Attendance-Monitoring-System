import { useState, useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import { FaUserPlus, FaCamera, FaClipboardList, FaChartLine, FaArrowRight, FaArrowLeft } from "react-icons/fa";

function HowItWorks() {
  useEffect(() => {
    AOS.init({ duration: 1000, once: true }); // Initialize AOS animations
  }, []);

  // State for tracking active step
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Steps Data
  const steps = [
    {
      id: 1,
      title: "Student Registration",
      description: "Students log in and register their faces using multi-angle capture and blink confirmation.",
      icon: <FaUserPlus className="text-green-400 text-6xl mx-auto mb-4" />,
    },
    {
      id: 2,
      title: "Face Recognition Attendance",
      description: "The system automatically detects students in class using real-time facial recognition.",
      icon: <FaCamera className="text-blue-400 text-6xl mx-auto mb-4" />,
    },
    {
      id: 3,
      title: "Automated Attendance Logging",
      description: "Attendance is recorded and stored securely in the system for instructors.",
      icon: <FaClipboardList className="text-yellow-400 text-6xl mx-auto mb-4" />,
    },
    {
      id: 4,
      title: "Instructor Dashboard",
      description: "Instructors can manage and export attendance records easily.",
      icon: <FaChartLine className="text-purple-400 text-6xl mx-auto mb-4" />,
    },
  ];

  // Function to navigate between steps with animation
  const navigateStep = (direction) => {
    if (isAnimating) return; // Prevent multiple clicks during animation

    setIsAnimating(true); // Start animation
    setTimeout(() => {
      setCurrentStep((prev) => {
        let newStep = prev + direction;
        return Math.max(0, Math.min(newStep, steps.length - 1)); // Prevent overflow
      });
      setIsAnimating(false); // Reset animation state
    }, 500); // Duration matches transition
  };

  return (
    <section className="bg-neutral-900 text-white py-16 px-6 md:px-12">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        
        {/* Left Side: Header, Subheader & Buttons */}
        <div data-aos="fade-right">
          <h2 className="text-4xl font-bold mb-4">How It Works</h2>
          <p className="text-gray-400 max-w-lg mb-6">
            A simple and secure way to track attendance using face recognition.
          </p>
          
          {/* Step Navigation Buttons */}
          <div className="flex space-x-4">
            <button
              className={`px-6 py-3 text-lg rounded-lg transition-all ${
                currentStep > 0 ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-500 opacity-50 cursor-not-allowed"
              }`}
              onClick={() => navigateStep(-1)}
              disabled={currentStep === 0}
            >
              <FaArrowLeft className="inline-block mr-2" /> Previous
            </button>

            <button
              className={`px-6 py-3 text-lg rounded-lg transition-all ${
                currentStep < steps.length - 1 ? "bg-green-500 hover:bg-green-400" : "bg-gray-500 opacity-50 cursor-not-allowed"
              }`}
              onClick={() => navigateStep(1)}
              disabled={currentStep === steps.length - 1}
            >
              Next <FaArrowRight className="inline-block ml-2" />
            </button>
          </div>
        </div>

        {/* Right Side: Steps Display with Fade-in Animation */}
        <div className="relative h-72" data-aos="fade-left">
          <div
            className={`absolute w-full p-8 py-18 bg-neutral-800 rounded-lg shadow-lg transition-opacity duration-500 ${
              isAnimating ? "opacity-0" : "opacity-100"
            }`}
            key={currentStep}
          >
            {steps[currentStep].icon}
            <h3 className="text-2xl font-bold mb-2">{steps[currentStep].title}</h3>
            <p className="text-gray-300">{steps[currentStep].description}</p>
          </div>
        </div>

      </div>
    </section>
  );
}

export default HowItWorks;
