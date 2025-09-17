// src/components/Instructor/Sidebar.jsx
const Sidebar = ({ activeTab, setActiveTab, handleLogout, isOpen, setIsOpen }) => {
  const tabs = [
    { key: "overview", label: "Overview" }, // 👈 New tab
    { key: "subject", label: "My Classes" },
    { key: "assigned", label: "Class Roster" },
    { key: "attendance", label: "Attendance Report" },
  ];

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    if (setIsOpen) setIsOpen(false); // ✅ Close sidebar on mobile
  };

  return (
    <>
      {/* ✅ Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-neutral-900 border-r border-green-500 p-6 text-white min-h-screen">
        <h2 className="text-2xl font-bold text-green-400 mb-8">Instructor Panel</h2>

        <nav className="space-y-2 flex-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabClick(tab.key)}
              className={`w-full text-left px-4 py-2 rounded-lg transition font-medium ${
                activeTab === tab.key
                  ? "bg-green-600 text-white shadow"
                  : "hover:bg-neutral-800 hover:text-green-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <button
          onClick={handleLogout}
          className="mt-6 px-4 py-2 text-red-400 hover:text-red-300 font-medium transition"
        >
          Logout
        </button>
      </aside>

      {/* ✅ Sidebar for Mobile */}
      <div
        className={`md:hidden fixed inset-y-0 left-0 w-64 bg-neutral-900 text-white z-50 transform transition-transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-5 border-b border-green-500 flex justify-between items-center">
          <h2 className="text-lg font-bold text-green-400">Instructor Panel</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-white text-2xl"
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        <nav className="p-4 space-y-3">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabClick(tab.key)}
              className={`w-full text-left px-4 py-2 rounded-lg transition ${
                activeTab === tab.key
                  ? "bg-green-600 text-white shadow"
                  : "hover:bg-neutral-800 hover:text-green-300"
              }`}
            >
              {tab.label}
            </button>
          ))}

          <button
            onClick={handleLogout}
            className="w-full text-left mt-6 px-4 py-2 text-red-400 hover:text-red-300 font-medium"
          >
            Logout
          </button>
        </nav>
      </div>
    </>
  );
};

export default Sidebar;
