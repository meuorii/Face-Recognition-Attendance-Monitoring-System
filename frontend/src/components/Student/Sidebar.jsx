// src/components/Student/Sidebar.jsx
import { useNavigate } from "react-router-dom";

const Sidebar = ({ activeTab, setActiveTab, onClose }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("userData");
    localStorage.removeItem("token");
    localStorage.removeItem("userType");
    navigate("/student/login");
  };

  const navItem = (tab, label) => (
    <button
      onClick={() => {
        setActiveTab(tab);
        onClose?.(); // auto-close on mobile if defined
      }}
      className={`relative w-full text-left px-4 py-3 rounded-lg font-medium transition-all duration-300 overflow-hidden
        ${
          activeTab === tab
            ? "bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg"
            : "text-gray-300 hover:bg-gradient-to-r hover:from-neutral-800 hover:to-neutral-700 hover:text-white"
        }`}
    >
      <span className="relative z-10">{label}</span>
      {activeTab === tab && (
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-green-600 opacity-20 blur-lg rounded-lg" />
      )}
    </button>
  );

  return (
    <aside className="w-full md:w-64 h-full bg-neutral-950/90 backdrop-blur-lg text-gray-200 px-6 py-6 border-r border-white/10 shadow-xl flex flex-col">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-y-0 left-0 w-full 
                        bg-gradient-to-b from-emerald-500/10 via-green-500/5 to-emerald-600/10 
                        blur-3xl opacity-40" />
      </div>
      {/* Header with title and close (visible on mobile) */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="bg-gradient-to-r from-emerald-400 to-green-500 bg-clip-text text-transparent text-xl font-extrabold tracking-wide">
          Student Panel
        </h2>
        <button
          onClick={onClose}
          className="text-gray-400 text-2xl md:hidden hover:text-white transition"
          aria-label="Close sidebar"
        >
          ×
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex flex-col gap-3">
        {navItem("overview", "Overview")}
        {navItem("assigned", "Assigned Subjects")}
        {navItem("schedule", "Weekly Schedule")}
        {navItem("history", "Attendance History")}
      </nav>

      <div className="flex-grow" />

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="mt-6 px-4 py-2 text-left text-sm font-semibold text-red-400 hover:text-white hover:bg-gradient-to-r hover:from-red-600 hover:to-red-700 rounded-lg transition-all duration-300"
      >
        Logout
      </button>
    </aside>
  );
};

export default Sidebar;
