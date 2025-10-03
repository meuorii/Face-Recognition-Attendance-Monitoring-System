// src/components/Instructor/Sidebar.jsx
const Sidebar = ({ activeTab, setActiveTab, handleLogout, isOpen, setIsOpen }) => {
  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "subject", label: "My Classes" },
    { key: "assigned", label: "Class Roster" },
    { key: "attendance", label: "Attendance Report" },
  ];

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    if (setIsOpen) setIsOpen(false); // ✅ Auto close on mobile
  };

  return (
    <>
      {/* ✅ Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 min-h-screen p-6 text-white relative overflow-hidden
        bg-neutral-950 border-r border-emerald-500/30 shadow-xl shadow-emerald-500/10">
        
        {/* Background Glow Effects */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/20 blur-[160px] rounded-full"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-green-600/20 blur-[160px] rounded-full"></div>

        {/* Content */}
        <div className="relative z-10 flex flex-col flex-1">
          <h2 className="text-2xl font-extrabold mb-8 text-transparent 
            bg-gradient-to-r from-emerald-400 to-green-600 bg-clip-text drop-shadow">
            Instructor Panel
          </h2>

          <nav className="space-y-3 flex-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleTabClick(tab.key)}
                className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-all duration-300
                  ${
                    activeTab === tab.key
                      ? "bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/30 scale-[1.02]"
                      : "hover:bg-white/10 hover:border hover:border-emerald-400/40 hover:text-emerald-300"
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          <button
            onClick={handleLogout}
            className="mt-6 px-4 py-2 text-red-400 hover:text-red-300 font-medium 
              transition-all duration-300 hover:scale-[1.03]"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* ✅ Mobile Sidebar + Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/80 z-40" onClick={() => setIsOpen(false)}></div>
      )}

      <div
        className={`md:hidden fixed inset-y-0 left-0 w-64 text-white z-50 transform transition-transform duration-500 
          bg-neutral-950 border-r border-emerald-500/30 shadow-xl shadow-emerald-500/10
          ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Background Glow Effects */}
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-emerald-500/20 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-green-600/20 blur-[120px] rounded-full"></div>

        {/* Content */}
        <div className="relative z-10">
          <div className="p-5 border-b border-emerald-500/30 flex justify-between items-center">
            <h2 className="text-lg font-bold text-transparent bg-gradient-to-r from-emerald-400 to-green-600 bg-clip-text">
              Instructor Panel
            </h2>
          </div>

          <nav className="p-4 space-y-3">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleTabClick(tab.key)}
                className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-300
                  ${
                    activeTab === tab.key
                      ? "bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/30 scale-[1.02]"
                      : "hover:bg-white/10 hover:border hover:border-emerald-400/40 hover:text-emerald-300"
                  }`}
              >
                {tab.label}
              </button>
            ))}

            <button
              onClick={handleLogout}
              className="w-full text-left mt-6 px-4 py-2 text-red-400 hover:text-red-300 font-medium 
                transition-all duration-300 hover:scale-[1.03]"
            >
              Logout
            </button>
          </nav>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
