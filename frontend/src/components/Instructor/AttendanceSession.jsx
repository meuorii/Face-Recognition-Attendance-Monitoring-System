import React, { useEffect, useState } from "react";
import { getAttendanceLogs } from "../../services/api";
import { toast } from "react-toastify";

const AttendanceSession = ({ subjectId, instructorId }) => {
  const [recognizedStudents, setRecognizedStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!subjectId) return; // prevent undefined call

    let interval;

    const fetchLogs = async () => {
      try {
        const res = await getAttendanceLogs(subjectId);
        if (res?.logs) {
          setRecognizedStudents(res.logs);
        }
      } catch {
        toast.error("Failed to fetch attendance logs.");
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
    interval = setInterval(fetchLogs, 3000);

    return () => clearInterval(interval);
  }, [subjectId]);

  return (
    <div className="p-4 sm:p-6 bg-neutral-900 text-white min-h-screen">
      <h2 className="text-2xl font-bold text-green-400 mb-4">
        Attendance Session – {subjectId}
      </h2>

      <div className="bg-neutral-800 rounded-lg p-4 shadow border border-neutral-700">
        <h3 className="text-xl font-semibold mb-3">Recognized Students</h3>
        {loading ? (
          <p className="text-gray-400">Loading...</p>
        ) : recognizedStudents.length === 0 ? (
          <p className="text-gray-400">No student recognized yet.</p>
        ) : (
          <ul className="space-y-2 max-h-[400px] overflow-y-auto">
            {recognizedStudents.map((s, idx) => (
              <li
                key={s.student_id || idx}
                className="p-2 bg-green-700 rounded shadow text-sm sm:text-base"
              >
                {s.first_name} {s.last_name} –{" "}
                <span className="italic font-medium">Present</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default AttendanceSession;
