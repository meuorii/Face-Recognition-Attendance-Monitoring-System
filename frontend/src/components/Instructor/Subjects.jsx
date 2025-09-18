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
      const data = await getClassesByInstructor(instructor.instructor_id, token);
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

      // ✅ Trigger parent (InstructorDashboard) to switch tab
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

      if (b.start && b.end) {
        times.push(`${b.start}–${b.end}`);
      } else if (b.time) {
        times.push(b.time);
      }
    });

    const days = Array.from(daysSet).join(", ");
    return `${days} • ${times.join(", ")}`;
  };

  return (
    <div className="bg-neutral-900 p-8 rounded-2xl shadow-lg max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
        <h2 className="text-white text-3xl font-bold tracking-tight flex items-center gap-2">
          <FaBookOpen className="text-green-400" />
          Your Classes
        </h2>
      </div>

      {/* Loading State */}
      {loading ? (
        <p className="text-neutral-400">Loading classes...</p>
      ) : classes.length > 0 ? (
        <div className="grid sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {classes.map((c, idx) => (
            <div
              key={c._id || idx}
              className="bg-neutral-800 rounded-xl p-6 border border-neutral-700 hover:border-green-400 hover:shadow-lg hover:shadow-green-500/10 transition transform hover:-translate-y-1 flex flex-col"
            >
              {/* Title */}
              <h3 className="text-xl font-bold text-white mb-1">
                {c.subject_title}
              </h3>
              <p className="text-sm text-gray-400 mb-4">{c.subject_code}</p>

              {/* Details */}
              <div className="text-sm text-gray-300 space-y-2 flex-1">
                {c.schedule_blocks?.length > 0 && (
                  <p className="flex items-center gap-2">
                    <FaClock className="text-green-400" />
                    {formatScheduleBlocks(c.schedule_blocks)}
                  </p>
                )}
                <p className="flex items-center gap-2">
                  <FaUsers className="text-green-400" />
                  {c.course} – {c.section}
                </p>
                <p>
                  <span className="text-gray-200 font-medium">Status:</span>{" "}
                  {c.is_attendance_active ? (
                    <span className="text-green-400 font-semibold">Active</span>
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
                  className="mt-6 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white text-sm font-medium transition disabled:opacity-50"
                >
                  <FaStopCircle />
                  {loadingId === c._id ? "Stopping..." : "Stop Attendance"}
                </button>
              ) : (
                <button
                  onClick={() => handleActivate(c._id)}
                  disabled={loadingId === c._id}
                  className="mt-6 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white text-sm font-medium transition disabled:opacity-50"
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
