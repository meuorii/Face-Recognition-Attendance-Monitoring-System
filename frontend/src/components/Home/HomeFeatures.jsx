import { useEffect, useState } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import { FaUserCheck, FaShieldAlt, FaChartLine, FaEye, FaArrowRight } from "react-icons/fa";

function FeaturesSection() {
  useEffect(() => {
    AOS.init({ duration: 1000, once: true }); // Initialize AOS animations
  }, []);

  // State for feature navigation
  const [showFirstSet, setShowFirstSet] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  // Function to switch features with animation
  const toggleFeatures = () => {
    if (isAnimating) return;
    setIsAnimating(true);

    setTimeout(() => {
      setShowFirstSet(!showFirstSet);
      setIsAnimating(false);
    }, 500);
  };

  // Features Data
  const featuresSet1 = [
    {
      id: "01",
      title: "Real-Time Face Recognition",
      description: "AI-powered system detects students in real-time with multi-angle face registration.",
      icon: <FaUserCheck className="text-blue-500 text-4xl mb-4" />,
    },
    {
      id: "02",
      title: "Secure and Automated Logging",
      description: "Records attendance securely in a centralized system, eliminating manual tracking.",
      icon: <FaShieldAlt className="text-green-500 text-4xl mb-4" />,
    },
  ];

  const featuresSet2 = [
    {
      id: "03",
      title: "User-Friendly Dashboards",
      description: "Instructors and students access schedules, attendance records, and reports easily.",
      icon: <FaChartLine className="text-purple-500 text-4xl mb-4" />,
    },
    {
      id: "04",
      title: "Blinking Verification",
      description: "Prevents unauthorized check-ins by requiring a double-blink confirmation for security.",
      icon: <FaEye className="text-yellow-500 text-4xl mb-4" />,
    },
  ];

  return (
    <section className="bg-neutral-900 text-white pt-20 px-6 pb-12 md:px-12">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[40%_60%] gap-12 items-center">
        
        {/* Left Side: Title & Description */}
        <div data-aos="fade-right" className="max-w-md mb-24">
          <h2 className="text-4xl font-bold mb-4">FEATURES</h2>
          <p className="text-gray-400">
            Explore the powerful features of our AI-powered attendance system, designed to enhance security and accuracy.
          </p>
        </div>

        {/* Right Side: Feature Cards with Animation */}
        <div className="relative min-h-[350px]">
          <div
            className={`absolute w-full grid grid-cols-1 md:grid-cols-2 gap-6 transition-opacity duration-500 ${
              isAnimating ? "opacity-0" : "opacity-100"
            }`}
            key={showFirstSet ? "set1" : "set2"}
          >
            {/* Show either first or second set of features */}
            {(showFirstSet ? featuresSet1 : featuresSet2).map((feature, index) => (
              <div
                key={index}
                className="bg-neutral-800 p-6 rounded-lg shadow-lg transform transition-transform hover:scale-105 hover:shadow-xl min-h-[220px] md:min-h-[250px]"
                data-aos="fade-up"
                data-aos-delay={index * 200}
              >
                <span className="text-gray-600 text-6xl font-bold absolute opacity-20">{feature.id}</span>
                {feature.icon}
                <h3 className="text-xl font-bold">{feature.title}</h3>
                <p className="text-gray-300 text-sm mt-2">{feature.description}</p>
                <a href="#" className="text-blue-400 font-medium mt-4 inline-block hover:underline">
                  Learn More →
                </a>
              </div>
            ))}
          </div>

          {/* Arrow Button to Toggle Features */}
          <button
            className="absolute top-1/2 right-[-30px] transform -translate-y-1/2 bg-gray-700 p-4 rounded-full hover:bg-gray-500 transition-all"
            onClick={toggleFeatures}
          >
            <FaArrowRight className="text-white text-xl" />
          </button>
        </div>
      </div>
    </section>
  );
}

export default FeaturesSection;