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
  const [lastClassId, setLastClassId] = useState(null);

  useEffect(() => {
    let interval;

    const fetchData = async () => {
      try {
        const sessionRes = await getActiveAttendanceSession();
        const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

        const fetchLogs = async (classId) => {
          const logsRes = await getAttendanceLogs(classId);
          if (logsRes?.logs?.length > 0) {
            // ✅ Flatten and filter students by time_logged (not just log.date)
            const todayStudents = logsRes.logs.flatMap((log) =>
              (log.students || []).filter((s) => {
                if (!s.time_logged) return false;
                const logDate = new Date(s.time_logged)
                  .toISOString()
                  .split("T")[0];
                return logDate === today;
              })
            );

            setRecognizedStudents(todayStudents);
          } else {
            setRecognizedStudents([]);
          }
        };

        if (sessionRes?.active && sessionRes.class) {
          setActiveClass(sessionRes.class);
          setLastClassId(sessionRes.class.class_id);
          await fetchLogs(sessionRes.class.class_id);
        } else if (lastClassId) {
          // session ended, still fetch today’s logs
          setActiveClass(null);
          await fetchLogs(lastClassId);
        } else {
          setActiveClass(null);
          setRecognizedStudents([]);
        }
      } catch (err) {
        console.error("Fetch error:", err);
        toast.error("⚠ Failed to fetch attendance session.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [lastClassId]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateStr).toLocaleDateString("en-US", options);
  };

  return (
    <div className="p-6 bg-neutral-900 text-white min-h-screen">
      {/* Header Section */}
      <div className="mb-6 flex flex-col gap-2">
        <h2 className="text-3xl font-bold text-green-400 flex items-center gap-2">
          📋 Attendance Session
        </h2>

        {activeClass ? (
          <p className="text-gray-300 text-sm">
            Tracking attendance for{" "}
            <span className="text-green-300 font-semibold">
              {activeClass.subject_code} – {activeClass.subject_title}
            </span>
          </p>
        ) : lastClassId ? (
          <p className="text-yellow-400 text-sm font-medium italic">
            🛑 Session ended. Showing today&apos;s final attendance logs.
          </p>
        ) : (
          <p className="text-gray-400 text-sm italic">No active session.</p>
        )}

        <span className="inline-block bg-green-700/30 text-green-300 text-xs font-medium px-3 py-1 rounded-full mt-1 w-fit shadow">
          {formatDate(new Date().toISOString())}
        </span>
      </div>

      {/* Recognized Students Card */}
      <div className="bg-neutral-800 rounded-xl shadow-xl border border-neutral-700 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-green-300">
            Recognized Students
          </h3>
          <span className="text-sm text-gray-400">
            Total:{" "}
            <span className="text-white font-bold">
              {recognizedStudents.length}
            </span>
          </span>
        </div>

        {loading ? (
          <p className="text-gray-400 italic animate-pulse">
            Loading attendance...
          </p>
        ) : recognizedStudents.length === 0 ? (
          <div className="text-center py-6 text-gray-400 italic">
            No students recognized yet for today.
          </div>
        ) : (
          <ul className="divide-y divide-neutral-700 max-h-[450px] overflow-y-auto custom-scroll">
            {recognizedStudents.map((s, idx) => (
              <li
                key={`${s.student_id}-${idx}`}
                className="flex items-center justify-between py-3 px-3 hover:bg-neutral-700/40 rounded-md transition"
              >
                {/* Student Info */}
                <div>
                  <p className="font-medium text-white">
                    {s.first_name} {s.last_name}
                  </p>
                  <p className="text-xs text-gray-400">ID: {s.student_id}</p>
                </div>

                {/* Status + Time */}
                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 text-xs font-semibold rounded-full shadow ${
                      s.status === "Present"
                        ? "bg-green-600 text-white"
                        : s.status === "Late"
                        ? "bg-yellow-400 text-black"
                        : "bg-red-600 text-white"
                    }`}
                  >
                    {s.status}
                  </span>
                  <span className="text-sm text-gray-300 font-mono">
                    {s.time}
                  </span>
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
