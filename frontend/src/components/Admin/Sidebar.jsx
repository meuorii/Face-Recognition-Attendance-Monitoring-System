// src/components/Admin/Sidebar.jsx
import { useNavigate } from "react-router-dom";

const Sidebar = ({ activeTab, setActiveTab, onClose }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("userData");
    localStorage.removeItem("token");
    localStorage.removeItem("userType");
    navigate("/admin/login");
  };

const NavButton = ({ id, label}) => {
  const isActive = activeTab === id;

  return (
    <button
      onClick={() => {
        setActiveTab(id);
        onClose?.();
      }}
      className={`group relative w-full flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium overflow-hidden
        transition-all duration-500 ease-in-out transform
        ${
          isActive
            ? "text-white scale-[1.02]"
            : "text-gray-300 hover:text-white hover:scale-[1.02]"
        }`}
    >
    
      {/* Label */}
      <span className="relative z-10">{label}</span>

      {/* Active Gradient Background */}
      {isActive && (
        <div
          className="absolute inset-0 rounded-lg bg-gradient-to-r from-emerald-500 to-green-600 shadow-lg
                     opacity-100 scale-100 transition-all duration-500 ease-in-out"
        />
      )}

      {/* Inactive Hover Gradient Background */}
      {!isActive && (
        <div
          className="absolute inset-0 rounded-lg bg-gradient-to-r from-neutral-800 via-neutral-900 to-neutral-800
                     opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100
                     transition-all duration-500 ease-in-out"
        />
      )}
    </button>
  );
};


  return (
    <aside className="relative w-full md:w-64 h-full bg-neutral-950 backdrop-blur-lg text-gray-200 px-6 py-6 border-r border-emerald-500/20 shadow-xl flex flex-col z-20">
      {/* 🔹 Subtle glowing background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-40 h-40 bg-emerald-500/10 blur-3xl rounded-full"></div>
        <div className="absolute bottom-10 right-0 w-32 h-32 bg-green-600/10 blur-2xl rounded-full"></div>
      </div>

      {/* Header with title and close (visible on mobile) */}
      <div className="relative z-10 flex items-center justify-between mb-8">
        <h2 className="bg-gradient-to-r from-emerald-400 to-green-500 bg-clip-text text-transparent text-xl font-extrabold tracking-wide">
          Admin Panel
        </h2>
      </div>

      {/* Navigation Items */}
      <nav className="relative z-10 flex flex-col gap-3">
        <NavButton id="overview" label="Overview" />
        <NavButton id="students" label="Student Management" />
        <NavButton id="instructors" label="Instructor Assignment" />
        <NavButton id="classes" label="Class Management" />
        <NavButton id="subjects" label="Subjects Management" />
        <NavButton id="attendance" label="Attendance Monitoring" />
      </nav>

      <div className="flex-grow" />

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="relative z-10 mt-6 px-4 py-2 text-left text-sm font-semibold 
                  bg-transparent rounded-lg transition-all duration-500 ease-in-out
                  hover:bg-gradient-to-r hover:from-red-600 hover:to-red-700 hover:shadow-lg hover:shadow-red-600/30"
      >
        <span className="bg-gradient-to-r from-red-400 to-rose-500 bg-clip-text text-transparent">
          Logout
        </span>
      </button>
    </aside>
  );
};

export default Sidebar;
