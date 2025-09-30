// src/pages/StudentDashboard.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Student/Sidebar";
import StudentNavbar from "../components/Student/Navbar";
import AssignedSubjects from "../components/Student/AssignedSubjects";
import AttendanceHistory from "../components/Student/AttendanceHistory";
import WeeklySchedule from "../components/Student/WeeklySchedule";
import StudentOverview from "../components/Student/StudentOverview"; // ✅ NEW

const StudentDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview"); // ✅ default to overview
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [student, setStudent] = useState(null);
  const navigate = useNavigate();

  // 🔐 Auth guard (student only)
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userType = localStorage.getItem("userType");
    const storedData = JSON.parse(localStorage.getItem("userData"));

    if (!token || userType !== "student" || !storedData) {
      navigate("/student/login", { replace: true });
    } else {
      setStudent(storedData);
    }
  }, [navigate]);

  const studentName = student?.first_name || "Student";

  return (
    <div className="flex bg-neutral-950 text-white min-h-screen">
       <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-20 -left-20 w-[400px] h-[400px] bg-emerald-500/20 blur-3xl rounded-full"></div>
        <div className="absolute bottom-0 right-0 w-[350px] h-[350px] bg-green-600/10 blur-3xl rounded-full"></div>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:flex-col w-64 h-screen sticky top-0 bg-gray-900 border-r border-green-600 z-30">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      </aside>

      {/* Mobile Sidebar */}
      <div
        className={`fixed inset-0 z-40 bg-black bg-opacity-50 transition-opacity duration-300 ease-in-out ${
          sidebarOpen ? "block" : "hidden"
        } md:hidden`}
      >
        <div
          className={`absolute left-0 top-0 w-64 bg-gray-900 h-full border-r border-green-600 shadow-lg transform transition-transform duration-300 ease-in-out ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <Sidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onClose={() => setSidebarOpen(false)}
          />
        </div>
        <div className="flex-1" onClick={() => setSidebarOpen(false)} />
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-screen">
        <StudentNavbar
          onMenuClick={() => setSidebarOpen(true)}
          studentName={studentName}
        />

        <main className="flex-1 overflow-y-auto">
          {activeTab === "overview" && <StudentOverview />} {/* ✅ New Overview Tab */}
          {activeTab === "assigned" && <AssignedSubjects />}
          {activeTab === "schedule" && (
            <div className="w-full">
              <WeeklySchedule />
            </div>
          )}
          {activeTab === "history" && <AttendanceHistory />}
        </main>
      </div>
    </div>
  );
};

export default StudentDashboard;
