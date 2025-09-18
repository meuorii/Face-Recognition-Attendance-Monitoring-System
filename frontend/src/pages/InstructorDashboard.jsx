// src/pages/InstructorDashboard.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AOS from "aos";
import "aos/dist/aos.css";

import Navbar from "../components/Instructor/Navbar";
import Sidebar from "../components/Instructor/Sidebar";
import Subjects from "../components/Instructor/Subjects";
import InstructorOverview from "../components/Instructor/InstructorOverview";
import StudentsInClass from "../components/Instructor/StudentsInClass";
import AttendanceReports from "../components/Instructor/AttendanceReports";
import AttendanceSession from "../components/Instructor/AttendanceSession";

const InstructorDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview"); // 👈 Default to Overview
  const [instructor, setInstructor] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    AOS.init({ duration: 600 });

    const token = localStorage.getItem("token");
    const userType = localStorage.getItem("userType");
    const storedData = JSON.parse(localStorage.getItem("userData"));

    if (!token || userType !== "instructor" || !storedData) {
      navigate("/instructor/login", { replace: true });
    } else {
      setInstructor(storedData);
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("userData");
    localStorage.removeItem("token");
    localStorage.removeItem("userType");
    navigate("/instructor/login");
  };

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return <InstructorOverview />;
      case "subject":
        return (
          <Subjects
            onActivateSession={() => {
              setActiveTab("session"); // ✅ No need to pass ID anymore
            }}
          />
        );
      case "assigned":
        return <StudentsInClass />;
      case "attendance":
        return <AttendanceReports />;
      case "session":
        return <AttendanceSession />; // ✅ Self-fetches active session
      default:
        return <InstructorOverview />;
    }
  };

  return (
    <div className="h-screen flex bg-neutral-900 text-white overflow-hidden">
      {/* ✅ Fixed Sidebar */}
      <div className="hidden md:block fixed top-0 left-0 h-full w-64 bg-neutral-900 border-r border-green-500">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          handleLogout={handleLogout}
          isOpen={isSidebarOpen}
          setIsOpen={setIsSidebarOpen}
        />
      </div>

      {/* ✅ Main content with fixed Navbar and scrollable content */}
      <div className="flex-1 flex flex-col md:ml-64">
        {/* Fixed Navbar */}
        <div className="fixed top-0 left-64 right-0 z-10 bg-neutral-900 border-b border-green-500">
          <Navbar
            instructor={instructor}
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          />
        </div>

        {/* Scrollable content area */}
        <main className="flex-1 overflow-y-auto mt-16 p-6">
          <div data-aos="fade-up">{renderContent()}</div>
        </main>
      </div>
    </div>
  );
};

export default InstructorDashboard;
