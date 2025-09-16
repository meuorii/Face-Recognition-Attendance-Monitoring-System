import { useEffect, useState } from "react";
import {
  getClassesByInstructor,
  activateAttendance,
  stopAttendance,
} from "../../services/api";
import { toast } from "react-toastify";

const Subjects = ({ openModal, onActivateSession }) => {
  const [classes, setClasses] = useState([]);
  const [loadingId, setLoadingId] = useState(null);
  const instructor = JSON.parse(localStorage.getItem("userData"));
  const token = localStorage.getItem("token"); // ✅ JWT token

  useEffect(() => {
    if (instructor?.instructor_id && token) {
      fetchClasses();
    }
  }, []);

  const fetchClasses = async () => {
    try {
      const data = await getClassesByInstructor(instructor.instructor_id, token);
      setClasses(data);
    } catch (err) {
      console.error("❌ Failed to fetch classes:", err.response?.data || err.message);
      toast.error("Failed to load classes.");
    }
  };

  const handleActivate = async (classId) => {
    try {
      setLoadingId(classId);
      await activateAttendance(classId);
      toast.success("✅ Attendance session activated!");
      fetchClasses();
      if (onActivateSession) {
        onActivateSession(classId); // ✅ switch to session tab in dashboard
      }
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

  const formatScheduleBlock = (block) => {
    if (!block || typeof block !== "object") return "";
    const days = Array.isArray(block.days) ? block.days.join(", ") : block.day || "N/A";
    if (block.start && block.end) {
      return `${days} – ${block.start} to ${block.end}`;
    }
    return `${days} – ${block.time || ""}`;
  };

  return (
    <div className="p-4 md:p-6 bg-gray-900 rounded-xl shadow-md border border-gray-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
        <h2 className="text-xl font-semibold text-white">Your Classes</h2>
        <button
          onClick={openModal}
          className="bg-green-600 hover:bg-green-700 px-4 py-2 text-sm rounded-lg text-white font-medium transition"
        >
          + Create Class
        </button>
      </div>

      {classes.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((c, idx) => (
            <div
              key={c._id || idx}
              className="bg-gray-800 rounded-xl p-4 shadow hover:shadow-lg transition border border-neutral-700"
            >
              <div className="mb-2">
                <h3 className="text-lg font-semibold text-green-400">
                  {c.subject_title}
                </h3>
                <p className="text-sm text-gray-400">{c.subject_code}</p>
              </div>

              <div className="text-sm text-gray-300 space-y-1">
                {Array.isArray(c.schedule_blocks) && c.schedule_blocks.length > 0 && (
                  <div>
                    <strong>Schedule:</strong>
                    <ul className="list-disc list-inside mt-1 text-sm text-gray-300">
                      {c.schedule_blocks.map((b, i) => (
                        <li key={i}>{formatScheduleBlock(b)}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <p><strong>Course:</strong> {c.course}</p>
                <p><strong>Section:</strong> {c.section}</p>
                <p>
                  <strong>Status:</strong>{" "}
                  {c.is_attendance_active ? (
                    <span className="text-green-400 font-medium">Active</span>
                  ) : (
                    <span className="text-gray-400">Inactive</span>
                  )}
                </p>
              </div>

              {c.is_attendance_active ? (
                <button
                  onClick={() => handleStop(c._id)}
                  disabled={loadingId === c._id}
                  className="mt-4 w-full px-4 py-2 text-sm rounded-lg transition font-semibold text-white bg-red-600 hover:bg-red-700"
                >
                  {loadingId === c._id ? "Stopping..." : "Stop Attendance"}
                </button>
              ) : (
                <button
                  onClick={() => handleActivate(c._id)}
                  disabled={loadingId === c._id}
                  className="mt-4 w-full px-4 py-2 text-sm rounded-lg transition font-semibold text-white bg-green-600 hover:bg-green-700"
                >
                  {loadingId === c._id ? "Activating..." : "Activate Attendance"}
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-500 mt-8">No classes found.</p>
      )}
    </div>
  );
};

export default Subjects;
