import { useNavigate } from "react-router-dom";

const Sidebar = ({ activeTab, setActiveTab, onClose }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("userData");
    localStorage.removeItem("token");
    localStorage.removeItem("userType");  
    navigate("/student/login");
  };

  return (
    <aside className="w-full md:w-64 h-full bg-neutral-900 text-gray-200 px-6 py-6 border-r border-green-600 shadow-md flex flex-col">
      {/* Header with title and close (visible on mobile) */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-green-400 text-xl font-bold">Student Panel</h2>
        <button
          onClick={onClose}
          className="text-white text-2xl md:hidden"
          aria-label="Close sidebar"
        >
          ×
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex flex-col gap-3">
        <button
          onClick={() => {
            setActiveTab("assigned");
            onClose?.(); // auto-close on mobile if defined
          }}
          className={`text-left px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
            activeTab === "assigned"
              ? "bg-green-500 text-white shadow"
              : "hover:bg-neutral-700"
          }`}
        >
          Assigned Subjects
        </button>

        <button
          onClick={() => {
            setActiveTab("schedule");
            onClose?.();
        }}
        className={`text-left px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
            activeTab === "schedule"
            ? "bg-green-500 text-white shadow"
            : "hover:bg-neutral-700"
        }`}
        >
          Weekly Schedule
        </button>

        <button
          onClick={() => {
            setActiveTab("history");
            onClose?.();
          }}
          className={`text-left px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
            activeTab === "history"
              ? "bg-green-500 text-white shadow"
              : "hover:bg-neutral-700"
          }`}
        >
          Attendance History
        </button>
      </nav>

      <div className="flex-grow" />

      {/* Logout (left aligned) */}
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
