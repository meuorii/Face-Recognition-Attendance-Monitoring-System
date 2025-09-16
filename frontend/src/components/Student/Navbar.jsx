import { FiMenu } from "react-icons/fi";

const StudentNavbar = ({ studentName = "Student", onMenuClick }) => {
  return (
    <header className="bg-neutral-900 border-b border-neutral-500 px-6 py-4 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left: Greeting */}
        <h1 className="text-xl ml-5 font-semibold tracking-tight text-white">
          <span className="text-green-400">Hi,</span> {studentName}
        </h1>

        {/* Right: Hamburger menu for mobile */}
        <button
          className="md:hidden text-white text-2xl"
          onClick={onMenuClick}
          aria-label="Open sidebar"
        >
          <FiMenu />
        </button>
      </div>
    </header>
  );
};

export default StudentNavbar;
