import { useNavigate } from "react-router-dom";

const Sidebar = ({ activeTab, setActiveTab, onClose }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("userData");
    localStorage.removeItem("token");
    localStorage.removeItem("userType");
    navigate("/admin/login");
  };

  const NavButton = ({ id, label }) => (
    <button
      onClick={() => {
        setActiveTab(id);
        onClose?.();
      }}
      className={`text-left px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
        activeTab === id ? "bg-green-500 text-white shadow" : "hover:bg-neutral-700"
      }`}
    >
      {label}
    </button>
  );

  return (
    <aside className="w-full md:w-64 h-full bg-neutral-900 text-gray-200 px-6 py-6 border-r border-green-600 shadow-md flex flex-col">
      {/* Header with title and close (visible on mobile) */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-green-400 text-xl font-bold">Admin Panel</h2>
        <button
          onClick={onClose}
          className="text-white text-2xl md:hidden"
          aria-label="Close sidebar"
        >
          ×
        </button>
      </div>

      {/* Navigation Items (5 tabs total) */}
      <nav className="flex flex-col gap-3">
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
        className="mt-6 px-4 py-2 text-left text-sm text-red-400 hover:text-red-500 transition"
      >
        Logout
      </button>
    </aside>
  );
};

export default Sidebar;
