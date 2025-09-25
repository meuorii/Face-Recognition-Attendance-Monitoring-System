import { useNavigate } from "react-router-dom";
import { FaUserGraduate, FaChalkboardTeacher, FaUserShield } from "react-icons/fa";

function UserSelectComponent() {
  const navigate = useNavigate();

  const handleSelect = (role) => {
    if (role === "admin") {
      navigate("/admin/login");
    } else if (role === "instructor") {
      navigate("/instructor/login");
    } else if (role === "student") {
      navigate("/student/login");
    }
  };

  // Roles with green gradient variants
  const roles = [
    {
      role: "admin",
      icon: <FaUserShield className="text-5xl md:text-6xl" />,
      label: "Admin",
      description:
        "Access system controls, verify users, and manage all records.",
      gradient: "from-emerald-400/30 to-green-600/20",
    },
    {
      role: "instructor",
      icon: <FaChalkboardTeacher className="text-5xl md:text-6xl" />,
      label: "Instructor",
      description:
        "Start attendance sessions and monitor real-time student activity.",
      gradient: "from-green-400/30 to-emerald-700/20",
    },
    {
      role: "student",
      icon: <FaUserGraduate className="text-5xl md:text-6xl" />,
      label: "Student",
      description:
        "Scan your face to log attendance and upload COR for auto-subjects.",
      gradient: "from-emerald-500/30 to-green-700/20",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-950 text-white p-6 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute -top-20 -left-20 w-96 h-96 bg-emerald-500/20 blur-[160px] rounded-full"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-green-600/20 blur-[160px] rounded-full"></div>

      {/* Headline */}
      <h1
        className="text-4xl md:text-5xl font-extrabold mb-4 text-center bg-gradient-to-r from-emerald-400 to-green-600 bg-clip-text text-transparent drop-shadow-lg"
        data-aos="fade-down"
      >
        Welcome to Face Recognition Attendance
      </h1>

      {/* Subtitle */}
      <p
        className="text-md md:text-lg text-gray-400 mb-12 text-center max-w-2xl"
        data-aos="fade-down"
        data-aos-delay="100"
      >
        Please select your role to continue.
      </p>

      {/* Role Cards */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-6xl"
        data-aos="fade-up"
      >
        {roles.map(({ role, icon, label, description, gradient }) => (
          <div
            key={role}
            onClick={() => handleSelect(role)}
            className={`relative flex flex-col items-center justify-center 
              rounded-2xl p-8 cursor-pointer 
              backdrop-blur-xl bg-white/10 border border-white/20 shadow-lg 
              hover:shadow-emerald-500/40 hover:scale-105 transition-all duration-300`}
          >
            {/* Gradient glow inside card */}
            <div
              className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${gradient} opacity-30`}
            ></div>

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="text-emerald-400">{icon}</div>
              <h2 className="mt-4 text-2xl font-semibold">{label}</h2>
              <p className="hidden sm:block text-gray-300 text-sm mt-3">
                {description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default UserSelectComponent;
