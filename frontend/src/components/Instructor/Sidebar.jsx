const Sidebar = ({ activeTab, setActiveTab, handleLogout, isOpen, setIsOpen }) => {
  const tabs = [
    { key: "subject", label: "Create Subject" },
    { key: "assigned", label: "Assigned Students" },
    { key: "attendance", label: "Attendance Report" },
  ];

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    if (setIsOpen) setIsOpen(false); // only close if mobile
  };

  return (
    <>
      {/* ✅ Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-gray-900 border-r border-green-500 p-6 text-white min-h-screen">
        <h2 className="text-xl font-bold text-green-400 mb-6">Instructor Panel</h2>
        <nav className="space-y-2 flex-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabClick(tab.key)}
              className={`w-full text-left px-3 py-2 rounded-lg transition font-medium ${
                activeTab === tab.key
                  ? "bg-green-600 text-white"
                  : "hover:bg-gray-700 hover:text-green-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
        <button
          onClick={handleLogout}
          className="mt-8 text-left px-3 py-2 text-red-400 hover:text-red-300 transition"
        >
          Logout
        </button>
      </aside>

      {/* ✅ Sidebar for Mobile */}
      <div
        className={`md:hidden fixed inset-y-0 left-0 w-64 bg-gray-900 text-white z-50 transform transition-transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-5 border-b border-green-500 flex justify-between items-center">
          <h2 className="text-lg font-bold text-green-400">Instructor Panel</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-white text-xl"
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
              className={`w-full text-left px-3 py-2 rounded-lg transition ${
                activeTab === tab.key
                  ? "bg-green-600 text-white"
                  : "hover:bg-gray-700 hover:text-green-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
          <button
            onClick={handleLogout}
            className="w-full text-left mt-6 text-red-400 hover:text-red-300"
          >
            Logout
          </button>
        </nav>
      </div>
    </>
  );
};

export default Sidebar;
