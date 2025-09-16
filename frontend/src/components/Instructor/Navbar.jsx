import { FaBars } from "react-icons/fa";

const Navbar = ({ instructor, onToggleSidebar }) => {
  return (
    <header
      className="w-full px-4 py-3 bg-gray-900 border-b border-green-500 flex items-center justify-between shadow-sm"
      data-aos="fade-down"
    >
      <h1 className="text-xl md:text-2xl font-semibold text-green-400">
        Hi, {instructor?.first_name || "Instructor"}
      </h1>

      {/* ✅ Hamburger Icon (Mobile only) */}
      <button
        onClick={onToggleSidebar}
        className="md:hidden text-white text-2xl focus:outline-none"
        aria-label="Open Menu"
      >
        <FaBars />
      </button>
    </header>
  );
};

export default Navbar;
