import { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";

function HomeAbout() {
  useEffect(() => {
    AOS.init({ duration: 1000, once: true }); // Initialize AOS animations
  }, []);

  return (
    <section className="bg-neutral-900 text-white pt-12 px-6 pb-12 md:px-12">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        
        {/* Left Side - Image with Adjusted Responsive Styling */}
        <div className="flex justify-center items-center w-full" data-aos="fade-right">
          <img
            src="/images/about.png" // ✅ Ensure image is in the public/images folder
            alt="About the System"
            className="w-full max-w-lg rounded-lg shadow-lg object-cover"
          />
        </div>

        {/* Right Side - Text Content with Animation */}
        <div className="w-full text-center md:text-left" data-aos="fade-left">
          <h2 className="text-4xl font-bold mb-6">About the System</h2>
          <p className="text-gray-400 text-lg mb-6 max-w-lg mx-auto md:mx-0">
            Our AI-powered attendance monitoring system enhances accuracy and security in classroom management.
            Designed for CCIT Department at PRMSU-Iba Campus, it ensures seamless student verification.
          </p>
          
          {/* Key Highlights */}
          <ul className="space-y-4 max-w-lg mx-auto md:mx-0">
            <li className="flex items-center justify-center md:justify-start" data-aos="fade-up" data-aos-delay="100">
              <span className="text-purple-400 text-2xl mr-3">✔</span> Developed for <strong>CCIT Department, PRMSU-Iba Campus</strong>.
            </li>
            <li className="flex items-center justify-center md:justify-start" data-aos="fade-up" data-aos-delay="200">
              <span className="text-purple-400 text-2xl mr-3">✔</span> Uses <strong>AI-powered face recognition</strong> for attendance.
            </li>
            <li className="flex items-center justify-center md:justify-start" data-aos="fade-up" data-aos-delay="300">
              <span className="text-purple-400 text-2xl mr-3">✔</span> Features <strong>multi-angle face registration</strong> & <strong>blinking verification</strong>.
            </li>
            <li className="flex items-center justify-center md:justify-start" data-aos="fade-up" data-aos-delay="400">
              <span className="text-purple-400 text-2xl mr-3">✔</span> Provides <strong>automated tracking</strong> with instructor & student portals.
            </li>
          </ul>
        </div>

      </div>
    </section>
  );
}

export default HomeAbout;
