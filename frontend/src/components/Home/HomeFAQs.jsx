import { useState, useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import {
  FaUserCog,
  FaChalkboardTeacher,
  FaUserGraduate,
  FaRobot,
  FaChevronDown,
} from "react-icons/fa";

function FAQs() {
  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
  }, []);

  const [openFAQ, setOpenFAQ] = useState(null);
  const [activeCategory, setActiveCategory] = useState("Admin");

  const toggleFAQ = (index) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  const faqs = {
    Admin: [
      {
        q: "How does the admin add students?",
        a: "Admins can upload CORs or import student lists via CSV. The system automatically links Year, Course, and Section.",
      },
      {
        q: "Can admins assign instructors?",
        a: "Yes, admins can assign instructors to specific subjects or sections from their dashboard.",
      },
      {
        q: "Can admins view real-time attendance?",
        a: "Yes, admins can monitor live logs from all classes in the dashboard.",
      },
      {
        q: "Is there a way to export reports?",
        a: "Admins can export full attendance records to PDF or CSV for documentation.",
      },
    ],
    Instructor: [
      {
        q: "How do instructors start attendance?",
        a: "Instructors can start attendance sessions only during scheduled class times. The system then activates face recognition.",
      },
      {
        q: "Can instructors edit attendance?",
        a: "Yes, instructors can manually override logs if necessary, with edits reflected in reports.",
      },
      {
        q: "Do instructors see student statuses in real-time?",
        a: "Yes, they can see if a student is Present, Late, or Absent instantly as the session runs.",
      },
      {
        q: "Can instructors generate subject reports?",
        a: "Yes, instructors can export attendance logs filtered by subject and date range.",
      },
    ],
    Student: [
      {
        q: "How do students log in?",
        a: "Students log in using face recognition only. No password is required once registered.",
      },
      {
        q: "What if my face is not recognized?",
        a: "Students can request re-registration of their face angles through the admin or instructor.",
      },
      {
        q: "Can students upload their COR anytime?",
        a: "Yes, students can upload or update their COR at the start of every semester.",
      },
      {
        q: "Where can students see their attendance?",
        a: "They can view their full attendance history and overall percentage inside the Student Dashboard.",
      },
    ],
    "AI Models": [
      {
        q: "How is spoofing prevented?",
        a: "The ResNet Anti-Spoofing model blocks photos, videos, or screen replays before recognition.",
      },
      {
        q: "How accurate is recognition?",
        a: "ArcFace provides high-accuracy verification, while multi-angle registration improves matching reliability.",
      },
      {
        q: "Does the system support multi-face detection?",
        a: "Yes, the AI scans multiple students simultaneously during sessions for efficiency.",
      },
      {
        q: "What angles are required during registration?",
        a: "Students capture front, left, right, up, and down angles for robust recognition.",
      },
    ],
  };

  const categories = [
    { name: "Admin", icon: <FaUserCog /> },
    { name: "Instructor", icon: <FaChalkboardTeacher /> },
    { name: "Student", icon: <FaUserGraduate /> },
    { name: "AI Models", icon: <FaRobot /> },
  ];

  return (
    <section className="relative bg-neutral-950 text-white py-20 px-6 md:px-12 overflow-hidden">
      {/* Green Gradient Glow Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/10 via-neutral-900 to-black"></div>
      <div className="absolute top-40 left-10 w-72 h-72 bg-emerald-500/20 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-40 right-10 w-72 h-72 bg-green-600/20 blur-[120px] rounded-full"></div>

      {/* Header */}
      <div className="relative text-center mb-16" data-aos="fade-up">
        <h2 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-emerald-400 to-green-600 bg-clip-text text-transparent drop-shadow-lg">
          Frequently Asked Questions
        </h2>
        <p className="mt-4 text-gray-400 max-w-2xl mx-auto">
          Choose your role and find answers tailored to your experience in the system.
        </p>
      </div>

      {/* Split Layout with Glassmorphism */}
      <div className="relative max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">
        {/* Left: Categories */}
        <div className="space-y-4">
          {categories.map((cat) => (
            <button
              key={cat.name}
              onClick={() => {
                setActiveCategory(cat.name);
                setOpenFAQ(null);
              }}
              className={`w-full flex items-center gap-3 px-5 py-4 rounded-xl font-semibold text-lg transition-all backdrop-blur-lg 
                ${activeCategory === cat.name
                  ? "bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg"
                  : "bg-white/5 border border-emerald-500/20 text-gray-300 hover:bg-white/10"}`}
            >
              <span className="text-2xl">{cat.icon}</span>
              {cat.name}
            </button>
          ))}
        </div>

        {/* Right: FAQs */}
        <div className="md:col-span-2 space-y-4">
          {faqs[activeCategory].map((faq, index) => {
            const idx = `${activeCategory}-${index}`;
            return (
              <div
                key={idx}
                className="backdrop-blur-lg bg-white/5 border border-emerald-500/20 rounded-xl shadow-md transition-all"
                data-aos="fade-up"
              >
                <button
                  className="w-full flex justify-between items-center p-5 text-left"
                  onClick={() => toggleFAQ(idx)}
                >
                  <span className="font-semibold text-white">{faq.q}</span>
                  <FaChevronDown
                    className={`transition-transform ${
                      openFAQ === idx
                        ? "rotate-180 text-emerald-400"
                        : "text-gray-400"
                    }`}
                  />
                </button>

                <div
                  className={`overflow-hidden transition-all duration-500 ${
                    openFAQ === idx
                      ? "max-h-40 opacity-100 p-5 pt-0"
                      : "max-h-0 opacity-0"
                  }`}
                >
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {faq.a}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default FAQs;
