// src/pages/AdminDashboard.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../components/Admin/Sidebar";
import AdminOverviewComponent from "../components/Admin/AdminOverviewComponent";
import StudentManagementComponent from "../components/Admin/StudentManagementComponent";
import InstructorAssignmentComponent from "../components/Admin/InstructorAssignmentComponent";
import ClassManagementComponent from "../components/Admin/ClassManagementComponent";
import SubjectManagementComponent from "../components/Admin/SubjectManagementComponent";

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
    <div className="flex bg-neutral-900 text-white min-h-screen">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:flex-col w-64 h-screen sticky top-0 bg-gray-900 border-r border-green-600 z-30">
        <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
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
          <AdminSidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onClose={() => setSidebarOpen(false)}
          />
        </div>
        <div className="flex-1" onClick={() => setSidebarOpen(false)} />
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-screen">
        {/* Navbar */}
        <header className="sticky top-0 z-20 bg-neutral-900/80 backdrop-blur border-b border-green-600">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="text-xl md:text-2xl font-bold">
              Hi,{" "}
              <span className="text-green-400">
                {admin?.first_name ||
                  (admin?.full_name
                    ? admin.full_name.split(" ")[0]
                    : "Admin")}
              </span>
              !
            </div>

            {/* Hamburger (mobile) */}
            <button
              className="md:hidden p-2 rounded-lg bg-neutral-800 border border-neutral-700 cursor-pointer"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-6 w-6 text-white"
              >
                <path d="M3.75 6.75h16.5a.75.75 0 000-1.5H3.75a.75.75 0 000 1.5zm16.5 5.25H3.75a.75.75 0 000 1.5h16.5a.75.75 0 000-1.5zm0 6.75H3.75a.75.75 0 000-1.5h16.5a.75.75 0 000-1.5z" />
              </svg>
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 md:p-6 pt-6 overflow-y-auto">
          {activeTab === "overview" && <AdminOverviewComponent />}
          {activeTab === "students" && <StudentManagementComponent />}
          {activeTab === "instructors" && <InstructorAssignmentComponent />}
          {activeTab === "classes" && <ClassManagementComponent />}
          {activeTab === "subjects" && <SubjectManagementComponent />}
          {activeTab === "attendance" && (
            <div className="text-neutral-400">
              Attendance Monitoring coming soon...
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
