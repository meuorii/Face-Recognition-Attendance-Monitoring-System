import { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";

function CallToAction() {
  useEffect(() => {
    AOS.init({ duration: 1000, once: true }); // Initialize AOS animations
  }, []);

  return (
    <section className="bg-neutral-900 text-white py-20 px-6 md:px-12">
      <div className="max-w-6xl mx-auto text-center" data-aos="fade-up">
        
        {/* CTA Heading */}
        <h2 className="text-4xl font-bold mb-4">Ready to Experience Smart Attendance?</h2>
        
        {/* CTA Subheading */}
        <p className="text-gray-400 text-lg mb-6 max-w-2xl mx-auto">
          Join PRMSU-CCIT’s Face Recognition Attendance Monitoring System today and simplify attendance tracking effortlessly.
        </p>
        
        {/* CTA Buttons */}
        <div className="flex justify-center space-x-4">
          <a 
            href="/register"
            className="bg-white text-neutral-900 px-6 py-3 rounded-lg text-lg font-semibold shadow-lg hover:bg-gray-200 transition"
          >
            Get Started
          </a>

          <a 
            href="/about"
            className="bg-transparent border border-white text-white px-6 py-3 rounded-lg text-lg font-semibold hover:bg-white hover:text-neutral-900 transition"
          >
            Learn More
          </a>
        </div>
      </div>
    </section>
  );
}

export default CallToAction;
