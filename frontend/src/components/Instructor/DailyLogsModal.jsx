// src/components/Instructor/DailyLogsModal.jsx
import { FaCheckCircle, FaTimesCircle, FaClock, FaCalendarAlt } from "react-icons/fa";

const DailyLogsModal = ({ student }) => {
  if (!student) return null;

  const logs = student.records || student.statuses || [];

  const totalLogs = logs.length;
  const presentCount = logs.filter((s) => s.status === "Present").length;
  const absentCount = logs.filter((s) => s.status === "Absent").length;
  const lateCount = logs.filter((s) => s.status === "Late").length;

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6 border-b border-neutral-700 pb-3">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <FaCalendarAlt className="text-green-400" />
          Daily Attendance Logs
        </h2>
        <p className="text-gray-400 text-sm mt-1">
          Showing all attendance records for{" "}
          <span className="text-green-400 font-semibold">
            {student.first_name} {student.last_name}
          </span>
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-neutral-800 p-5 rounded-xl text-center border border-neutral-700 shadow-sm">
          <p className="text-gray-400">Total Logs</p>
          <p className="text-3xl font-bold text-white">{totalLogs}</p>
        </div>
        <div className="bg-neutral-800 p-5 rounded-xl text-center border border-neutral-700 shadow-sm">
          <div className="flex items-center justify-center gap-2 text-green-400">
            <FaCheckCircle />
            <p className="text-gray-300">Present</p>
          </div>
          <p className="text-3xl font-bold text-green-400 mt-1">{presentCount}</p>
        </div>
        <div className="bg-neutral-800 p-5 rounded-xl text-center border border-neutral-700 shadow-sm">
          <div className="flex items-center justify-center gap-2 text-red-400">
            <FaTimesCircle />
            <p className="text-gray-300">Absent</p>
          </div>
          <p className="text-3xl font-bold text-red-400 mt-1">{absentCount}</p>
        </div>
        <div className="bg-neutral-800 p-5 rounded-xl text-center border border-neutral-700 shadow-sm">
          <div className="flex items-center justify-center gap-2 text-yellow-400">
            <FaClock />
            <p className="text-gray-300">Late</p>
          </div>
          <p className="text-3xl font-bold text-yellow-400 mt-1">{lateCount}</p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto max-h-96 overflow-y-auto border border-neutral-700 rounded-xl shadow-sm">
        <table className="min-w-full text-sm text-left text-gray-300">
          <thead className="bg-neutral-800 text-green-400 sticky top-0 z-10">
            <tr>
              <th className="px-6 py-3 w-32">Date</th>
              <th className="px-6 py-3">Subject</th>
              <th className="px-6 py-3 w-28">Status</th>
              <th className="px-6 py-3 w-28">Time</th>
            </tr>
          </thead>
          <tbody>
            {logs.length > 0 ? (
              logs.map((s, i) => (
                <tr
                  key={i}
                  className={`${
                    i % 2 === 0 ? "bg-neutral-900/60" : "bg-neutral-800/50"
                  } border-b border-neutral-700 hover:bg-neutral-700/50 transition`}
                >
                  <td className="px-6 py-3">{s.date || "N/A"}</td>
                  <td className="px-6 py-3 font-medium text-white">
                    {s.subject_code ? (
                      <>
                        <span className="font-semibold">{s.subject_code}</span>
                        {s.subject_title && (
                          <span className="text-gray-400"> – {s.subject_title}</span>
                        )}
                      </>
                    ) : (
                      <span className="text-gray-500 italic">No Subject</span>
                    )}
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        s.status === "Present"
                          ? "bg-green-500/20 text-green-400"
                          : s.status === "Absent"
                          ? "bg-red-500/20 text-red-400"
                          : "bg-yellow-500/20 text-yellow-400"
                      }`}
                    >
                      {s.status || "N/A"}
                    </span>
                  </td>
                  <td className="px-6 py-3">{s.time || "N/A"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="text-center py-6 text-gray-500 italic">
                  No attendance logs available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DailyLogsModal;
