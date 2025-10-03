import { FaBars } from "react-icons/fa";

const Navbar = ({ instructor, onToggleSidebar }) => {
  const displayName = instructor?.first_name || "Instructor";

  return (
    <header
      className="w-full px-6 py-4 bg-neutral-950 relative overflow-hidden border-b border-emerald-500/30 
        flex items-center justify-between shadow-lg backdrop-blur-md"
      data-aos="fade-down"
    >
      {/* Background Glow */}
      <div className="absolute -top-20 -left-20 w-72 h-72 bg-emerald-500/20 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-0 right-0 w-72 h-72 bg-green-600/20 blur-[120px] rounded-full"></div>

      {/* Content */}
      <h1
        className="relative z-10 text-xl md:text-2xl font-extrabold 
          bg-gradient-to-r from-emerald-400 to-green-600 bg-clip-text text-transparent drop-shadow"
      >
        Hi, {displayName}
      </h1>

      {/* Mobile Menu Button */}
      <button
        onClick={onToggleSidebar}
        className="relative z-10 md:hidden text-white text-2xl focus:outline-none 
          p-2 rounded-lg hover:bg-white/10 hover:text-emerald-400 transition-all duration-300 flex-shrink-0"
        aria-label="Open Menu"
      >
        <FaBars />
      </button>
    </header>
  );
};

export default Navbar;
