import React, { useEffect, useState } from "react";
import {
  getAttendanceLogs,
  getActiveAttendanceSession,
} from "../../services/api";
import { toast } from "react-toastify";

const AttendanceSession = () => {
  const [recognizedStudents, setRecognizedStudents] = useState([]);
  const [activeClass, setActiveClass] = useState(null);
  const [loading, setLoading] = useState(true);

  // track last class viewed so logs persist even after session ends
  const [lastClassId, setLastClassId] = useState(null);

  useEffect(() => {
    let interval;

    const fetchData = async () => {
      try {
        // 🔹 Step 1: Get active session
        const sessionRes = await getActiveAttendanceSession();

        if (sessionRes?.active && sessionRes.class) {
          // session is running
          setActiveClass(sessionRes.class);
          setLastClassId(sessionRes.class.class_id);

          // fetch live logs
          const logsRes = await getAttendanceLogs(sessionRes.class.class_id);
          if (logsRes?.logs) {
            const allStudents = logsRes.logs.flatMap((log) => log.students || []);
            setRecognizedStudents(allStudents);
          }
        } else if (lastClassId) {
          // session ended → still fetch final logs using last class id
          setActiveClass(null);
          const logsRes = await getAttendanceLogs(lastClassId);
          if (logsRes?.logs) {
            const allStudents = logsRes.logs.flatMap((log) => log.students || []);
            setRecognizedStudents(allStudents);
          }
        } else {
          // nothing to show yet
          setActiveClass(null);
          setRecognizedStudents([]);
        }
      } catch {
        toast.error("⚠ Failed to fetch attendance session.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    interval = setInterval(fetchData, 3000);

    return () => clearInterval(interval);
  }, [lastClassId]);

  return (
    <div className="p-6 bg-neutral-900 text-white min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-green-400">Attendance Session</h2>
        {activeClass ? (
          <p className="text-gray-400 text-sm mt-1">
            Tracking attendance for{" "}
            <span className="text-green-300 font-semibold">
              {activeClass.subject_code} – {activeClass.subject_title}
            </span>
          </p>
        ) : lastClassId ? (
          <p className="text-gray-400 text-sm mt-1 italic">
            Session ended. Showing last attendance logs.
          </p>
        ) : (
          <p className="text-gray-400 text-sm mt-1 italic">No active session.</p>
        )}
      </div>

      {/* Card */}
      <div className="bg-neutral-800 rounded-xl shadow-lg border border-neutral-700 p-6">
        <h3 className="text-xl font-semibold text-green-300 mb-4">
          Recognized Students
        </h3>

        {loading ? (
          <p className="text-gray-400 italic">Loading attendance...</p>
        ) : recognizedStudents.length === 0 ? (
          <div className="text-center py-6 text-gray-400">
            No students recognized yet.
          </div>
        ) : (
          <ul className="divide-y divide-neutral-700 max-h-[450px] overflow-y-auto">
            {recognizedStudents.map((s, idx) => (
              <li
                key={s.student_id || idx}
                className="flex items-center justify-between py-3 px-2 hover:bg-neutral-700/50 rounded-md transition"
              >
                {/* Student Info */}
                <div>
                  <p className="font-medium">
                    {s.first_name} {s.last_name}
                  </p>
                  <p className="text-xs text-gray-400">ID: {s.student_id}</p>
                </div>

                {/* Status + Time */}
                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      s.status === "Present"
                        ? "bg-green-600 text-white"
                        : s.status === "Late"
                        ? "bg-yellow-500 text-black"
                        : "bg-red-600 text-white"
                    }`}
                  >
                    {s.status}
                  </span>
                  <span className="text-sm text-gray-400">{s.time}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default AttendanceSession;
