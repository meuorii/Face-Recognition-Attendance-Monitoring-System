import { FiMenu } from "react-icons/fi";

const StudentNavbar = ({ studentName = "Student", onMenuClick }) => {
  return (
    <header className="bg-neutral-950/80 backdrop-blur-lg border-b border-white/10 px-6 py-4 shadow-lg sticky top-0 z-20">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left: Greeting */}
        <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 to-green-500 bg-clip-text text-transparent">
          Hi, <span className="font-extrabold">{studentName}</span>
        </h1>

        {/* Right: Hamburger menu for mobile */}
        <button
          className="md:hidden text-gray-300 hover:text-white p-2 rounded-lg transition-all duration-300 hover:bg-gradient-to-r hover:from-neutral-800 hover:to-neutral-700"
          onClick={onMenuClick}
          aria-label="Open sidebar"
        >
          <FiMenu className="text-2xl" />
        </button>
      </div>
    </header>
  );
};

export default StudentNavbar;
