import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAttendanceLogsByStudent } from "../../services/api";
import { toast } from "react-toastify";

const AttendanceHistory = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const userData = localStorage.getItem("userData");
  const student = userData ? JSON.parse(userData) : null;
  const studentId = student?.student_id;

  useEffect(() => {
    if (!studentId) {
      toast.error("Student not logged in.");
      navigate("/student/login");
      return;
    }

    const fetchLogs = async () => {
      try {
        const data = await getAttendanceLogsByStudent(studentId);
        setLogs(data);
      } catch  {
        toast.error("Failed to load attendance logs.");
      }
    };

    fetchLogs();
  }, [studentId, navigate]);

  return (
    <div className="bg-neutral-900 p-6 rounded-2xl shadow-md border border-neutral-700 max-w-6xl mx-auto">
      <h2 className="text-white text-2xl font-semibold mb-6 border-b border-neutral-700 pb-2">
        Attendance History
      </h2>

      {logs.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-gray-300">
            <thead className="bg-neutral-800 text-gray-200">
              <tr>
                <th className="py-3 px-4 text-left">Subject</th>
                <th className="py-3 px-4 text-left">Date</th>
                <th className="py-3 px-4 text-left">Time</th>
                <th className="py-3 px-4 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, idx) => (
                <tr key={idx} className="border-b border-neutral-700 hover:bg-neutral-800 transition">
                  <td className="py-2 px-4">{log.subject || "—"}</td>
                  <td className="py-2 px-4">{log.date}</td>
                  <td className="py-2 px-4">
                    {log.timestamp
                      ? new Date(log.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </td>
                  <td className="py-2 px-4">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        log.status === "Present"
                          ? "bg-green-600"
                          : log.status === "Late"
                          ? "bg-yellow-600"
                          : "bg-red-600"
                      } text-white`}
                    >
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-gray-400 text-sm mt-4 text-center">
          No attendance records found.
        </p>
      )}
    </div>
  );
};

export default AttendanceHistory;
