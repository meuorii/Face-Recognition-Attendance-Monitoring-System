// src/components/Instructor/Subjects.jsx
import { useEffect, useState } from "react";
import {
  getClassesByInstructor,
  activateAttendance,
  stopAttendance,
} from "../../services/api";
import { toast } from "react-toastify";
import {
  FaBookOpen,
  FaClock,
  FaUsers,
  FaPlayCircle,
  FaStopCircle,
} from "react-icons/fa";

const Subjects = ({ onActivateSession }) => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingId, setLoadingId] = useState(null);

  const instructor = JSON.parse(localStorage.getItem("userData"));
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (instructor?.instructor_id && token) {
      fetchClasses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchClasses = async () => {
    try {
      const data = await getClassesByInstructor(
        instructor.instructor_id,
        token
      );
      setClasses(data || []);
    } catch (err) {
      console.error("❌ Failed to fetch classes:", err.response?.data || err.message);
      toast.error("Failed to load classes.");
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (classId) => {
    try {
      setLoadingId(classId);
      await activateAttendance(classId);
      toast.success("✅ Attendance session activated!");
      fetchClasses();
      if (onActivateSession) onActivateSession();
    } catch (err) {
      console.error("❌ Activate failed:", err.response?.data || err.message);
      toast.error("Failed to activate session.");
    } finally {
      setLoadingId(null);
    }
  };

  const handleStop = async (classId) => {
    try {
      setLoadingId(classId);
      await stopAttendance(classId);
      toast.info("🛑 Attendance session stopped.");
      fetchClasses();
    } catch (err) {
      console.error("❌ Stop failed:", err.response?.data || err.message);
      toast.error("Failed to stop session.");
    } finally {
      setLoadingId(null);
    }
  };

  // ✅ Clean schedule formatting (unique days)
  const formatScheduleBlocks = (blocks) => {
    if (!Array.isArray(blocks) || blocks.length === 0) return "No schedule";

    const daysSet = new Set();
    const times = [];

    blocks.forEach((b) => {
      if (Array.isArray(b.days)) {
        b.days.forEach((d) => daysSet.add(d));
      } else if (b.day) {
        daysSet.add(b.day);
      }
      if (b.start && b.end) times.push(`${b.start}–${b.end}`);
      else if (b.time) times.push(b.time);
    });

    const days = Array.from(daysSet).join(", ");
    return `${days} • ${times.join(", ")}`;
  };

  return (
    <div className="relative z-10 bg-neutral-950 min-h-screen p-8 rounded-2xl overflow-hidden">
      {/* Glowing Background */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/20 blur-[160px] rounded-full"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-green-600/20 blur-[160px] rounded-full"></div>

      {/* Header */}
      <div className="relative z-10 flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-10">
        <h2 className="text-3xl font-extrabold tracking-tight flex items-center gap-3 text-transparent bg-gradient-to-r from-emerald-400 to-green-600 bg-clip-text">
          <FaBookOpen className="text-emerald-400" />
          Your Classes
        </h2>
      </div>

      {/* Loading State */}
      {loading ? (
        <p className="text-neutral-400">Loading classes...</p>
      ) : classes.length > 0 ? (
        <div className="relative z-10 grid sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {classes.map((c, idx) => (
            <div
              key={c._id || idx}
              className="bg-neutral-900 backdrop-blur-md rounded-2xl p-6 border border-white/10 
                hover:border-emerald-400/50 hover:shadow-lg hover:shadow-emerald-500/30 
                transition-all duration-300 transform hover:-translate-y-1 flex flex-col"
            >
              {/* Title */}
              <h3 className="text-xl font-bold text-white mb-1">
                {c.subject_title}
              </h3>
              <p className="text-sm text-gray-400 mb-4">{c.subject_code}</p>

              {/* Details */}
              <div className="text-sm text-gray-300 space-y-3 flex-1">
                {c.schedule_blocks?.length > 0 && (
                  <p className="flex items-center gap-2">
                    <FaClock className="text-emerald-400" />
                    {formatScheduleBlocks(c.schedule_blocks)}
                  </p>
                )}
                <p className="flex items-center gap-2">
                  <FaUsers className="text-emerald-400" />
                  {c.course} – {c.section}
                </p>
                <p>
                  <span className="text-gray-200 font-medium">Status:</span>{" "}
                  {c.is_attendance_active ? (
                    <span className="text-emerald-400 font-semibold">
                      Active
                    </span>
                  ) : (
                    <span className="text-gray-400">Inactive</span>
                  )}
                </p>
              </div>

              {/* Action */}
              {c.is_attendance_active ? (
                <button
                  onClick={() => handleStop(c._id)}
                  disabled={loadingId === c._id}
                  className="mt-6 flex items-center justify-center gap-2 px-4 py-2 
                    rounded-lg text-white text-sm font-medium 
                    bg-gradient-to-r from-red-500 to-red-700 shadow-md
                    hover:from-red-600 hover:to-red-800 hover:shadow-red-500/30
                    transition-all duration-300 disabled:opacity-50"
                >
                  <FaStopCircle />
                  {loadingId === c._id ? "Stopping..." : "Stop Attendance"}
                </button>
              ) : (
                <button
                  onClick={() => handleActivate(c._id)}
                  disabled={loadingId === c._id}
                  className="mt-6 flex items-center justify-center gap-2 px-4 py-2 
                    rounded-lg text-white text-sm font-medium 
                    bg-gradient-to-r from-emerald-500 to-green-600 shadow-md
                    hover:from-green-600 hover:to-emerald-700 hover:shadow-emerald-500/30
                    transition-all duration-300 disabled:opacity-50"
                >
                  <FaPlayCircle />
                  {loadingId === c._id ? "Activating..." : "Activate Attendance"}
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-neutral-400 text-sm mt-4 text-center">
          No classes found. Please contact the admin to assign subjects.
        </p>
      )}
    </div>
  );
};

export default Subjects;
