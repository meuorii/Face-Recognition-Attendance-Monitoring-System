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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-900 text-white p-6">
      {/* Headline */}
      <h1 className="text-4xl md:text-5xl font-bold mb-4 text-center" data-aos="fade-down">
        Welcome to Face Recognition Attendance
      </h1>

      {/* Subtitle */}
      <p className="text-md md:text-lg text-gray-400 mb-12 text-center max-w-xl" data-aos="fade-down" data-aos-delay="100">
        Please select your role to continue.
      </p>

      {/* Role Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-6xl" data-aos="fade-up">

        {/* Card Template */}
        {[
          {
            role: "admin",
            icon: <FaUserShield className="text-yellow-400 text-4xl sm:text-6xl" />,
            label: "Admin",
            description: "Access system controls, verify users, and manage all records."
          },
          {
            role: "instructor",
            icon: <FaChalkboardTeacher className="text-blue-400 text-4xl sm:text-6xl" />,
            label: "Instructor",
            description: "Start attendance sessions and monitor real-time student activity."
          },
          {
            role: "student",
            icon: <FaUserGraduate className="text-green-400 text-4xl sm:text-6xl" />,
            label: "Student",
            description: "Scan your face to log attendance and upload COR for auto-subjects."
          },
        ].map(({ role, icon, label, description }) => (
          <div
            key={role}
            onClick={() => handleSelect(role)}
            className="flex flex-col sm:flex-col md:flex-col items-center justify-center bg-neutral-800 rounded-2xl shadow-md p-6 sm:p-10 hover:shadow-xl hover:scale-105 transition-all cursor-pointer"
          >
            {/* Mobile View: Icon and label horizontally */}
            <div className="flex sm:flex-col items-center sm:items-center gap-4">
              {icon}
              <h2 className="text-xl sm:text-2xl font-semibold">{label}</h2>
            </div>

            {/* Hide description on small screens */}
            <p className="hidden sm:block text-gray-400 text-center text-sm mt-4">
              {description}
            </p>
          </div>
        ))}

      </div>
    </div>
  );
}

export default UserSelectComponent;
