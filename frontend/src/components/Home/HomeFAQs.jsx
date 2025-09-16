import { useState, useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import { FaPlus, FaMinus } from "react-icons/fa";

function FAQs() {
  useEffect(() => {
    AOS.init({ duration: 1000, once: true }); // Initialize AOS animations
  }, []);

  // State to track open FAQs
  const [openFAQ, setOpenFAQ] = useState(null);

  // Function to toggle FAQs
  const toggleFAQ = (index) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  // FAQs Data
  const faqs = [
    {
      question: "How do I register for the system?",
      answer: "Students must log in using their school ID and follow the on-screen instructions to capture multiple face angles.",
    },
    {
      question: "What if my face is not recognized?",
      answer: "Ensure good lighting and try again. If the issue persists, contact your instructor for assistance.",
    },
    {
      question: "Can an instructor manually update attendance?",
      answer: "Yes, instructors have access to edit attendance records through their dashboard.",
    },
    {
      question: "Is my data safe in the system?",
      answer: "Yes, all data is securely stored in our system using encrypted databases.",
    },
    {
      question: "Do I need an internet connection to use the system?",
      answer: "Yes, a stable internet connection is required for real-time face recognition and attendance logging.",
    },
  ];

  return (
    <section className="bg-neutral-900 text-white py-16 px-6 md:px-12">
      {/* Section Title */}
      <div className="text-center mb-12" data-aos="fade-up">
        <h2 className="text-3xl md:text-4xl font-bold">Got Questions? We’ve Got Answers!</h2>
        <p className="mt-2 text-gray-400 max-w-3xl mx-auto">
          Find answers to the most common questions about our Face Recognition Attendance Monitoring System.
        </p>
      </div>

      {/* FAQs Accordion */}
      <div className="max-w-4xl mx-auto space-y-4">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className="bg-neutral-800 p-6 rounded-lg shadow-md cursor-pointer transition-all"
            data-aos="fade-up"
            onClick={() => toggleFAQ(index)}
          >
            {/* Question Row */}
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">{faq.question}</h3>
              <span className="text-gray-400 transition-transform">
                {openFAQ === index ? <FaMinus className="text-green-400" /> : <FaPlus />}
              </span>
            </div>

            {/* Answer (Expands when active) */}
            <div
              className={`overflow-hidden transition-all duration-500 ${
                openFAQ === index ? "max-h-40 mt-3 opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <p className="text-gray-300 text-sm">{faq.answer}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default FAQs;
