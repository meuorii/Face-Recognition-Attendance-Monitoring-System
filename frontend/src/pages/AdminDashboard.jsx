// src/pages/AdminDashboard.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { HiMenu } from "react-icons/hi";
import AdminSidebar from "../components/Admin/Sidebar";
import AdminOverviewComponent from "../components/Admin/AdminOverviewComponent";
import StudentManagementComponent from "../components/Admin/StudentManagementComponent";
import InstructorAssignmentComponent from "../components/Admin/InstructorAssignmentComponent";
import ClassManagementComponent from "../components/Admin/ClassManagementComponent";
import SubjectManagementComponent from "../components/Admin/SubjectManagementComponent";
import AttendanceMonitoringComponent from "../components/Admin/AttendanceMonitoringComponent";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [admin, setAdmin] = useState(null);
  const navigate = useNavigate();

  // 🔐 Auth guard (admin only) + load stored data
  useEffect(() => {
  const token = localStorage.getItem("token");
  const userType = localStorage.getItem("userType");
  const storedData = JSON.parse(localStorage.getItem("userData"));

  if (!token || userType !== "admin" || !storedData) {
    navigate("/admin/login", { replace: true });
  } else {
    setAdmin(storedData);
  }
}, [navigate]);

  return (
    <div className="flex bg-neutral-950 text-white min-h-screen">
    {/* Desktop Sidebar */}
    <aside className="hidden md:flex md:flex-col w-64 h-screen sticky top-0 bg-gray-900 border-r border-green-600 z-30">
      <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
    </aside>

    {/* Mobile Sidebar Overlay */}
    <div
      className={`fixed inset-0 z-40 md:hidden transition-all duration-300 ${
        sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
    >
      {/* Dark Overlay */}
      <div
        className="absolute inset-0 bg-black/80 transition-opacity duration-500"
        onClick={() => setSidebarOpen(false)}
      ></div>

      {/* Sidebar Panel */}
      <div
        className={`absolute left-0 top-0 w-64 bg-gray-900 h-full border-r border-green-600 shadow-lg transform transition-transform duration-500 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <AdminSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onClose={() => setSidebarOpen(false)}
        />
      </div>
    </div>

    {/* Main Area */}
    <div className="flex-1 flex flex-col min-h-screen">
      {/* Navbar (fixed at top) */}
      <header className="fixed top-0 left-0 right-0 z-20 bg-neutral-950 backdrop-blur-lg border-b border-emerald-500/30 shadow-lg md:ml-64">
        <div className="relative flex items-center justify-between px-4 py-3">
          {/* Glow Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-transparent to-green-600/5 opacity-70 blur-xl pointer-events-none"></div>

          {/* Greeting */}
          <div className="relative text-xl md:text-2xl font-extrabold tracking-tight">
            Hi,&nbsp;
            <span className="bg-gradient-to-r from-emerald-400 via-green-400 to-emerald-500 bg-clip-text text-transparent animate-gradient-x">
              {admin?.first_name ||
                (admin?.full_name ? admin.full_name.split(" ")[0] : "Admin")}
            </span>
            !
          </div>

          {/* Hamburger (mobile) */}
          <button
            className="relative md:hidden p-2 rounded-lg text-white 
                      hover:text-emerald-400 transition-all duration-300"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <span className="absolute inset-0 rounded-lg bg-emerald-500/20 blur-md opacity-60 group-hover:opacity-90 transition duration-300 pointer-events-none"></span>
            <HiMenu className="relative z-10 h-6 w-6" />
          </button>
        </div>
      </header>

      {/* Content (scrollable) */}
      <main className="flex-1 overflow-y-auto pt-[64px]">
        {activeTab === "overview" && <AdminOverviewComponent />}
        {activeTab === "students" && <StudentManagementComponent />}
        {activeTab === "instructors" && <InstructorAssignmentComponent />}
        {activeTab === "classes" && <ClassManagementComponent />}
        {activeTab === "subjects" && <SubjectManagementComponent />}
        {activeTab === "attendance" && <AttendanceMonitoringComponent />}
      </main>
    </div>
  </div>
  );
};

export default AdminDashboard;
