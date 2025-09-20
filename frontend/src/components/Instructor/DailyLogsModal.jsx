// src/components/Instructor/DailyLogsModal.jsx
import { FaCheckCircle, FaTimesCircle, FaClock, FaCalendarAlt } from "react-icons/fa";

const DailyLogsModal = ({ student }) => {
  if (!student) return null;

  const totalLogs = student.statuses.length;
  const presentCount = student.statuses.filter((s) => s.status === "Present").length;
  const absentCount = student.statuses.filter((s) => s.status === "Absent").length;
  const lateCount = student.statuses.filter((s) => s.status === "Late").length;

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
      <div className="overflow-x-auto max-h-80 overflow-y-auto border border-neutral-700 rounded-xl shadow-sm">
        <table className="min-w-full text-sm text-left text-gray-300">
          <thead className="bg-neutral-800 text-green-400 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th>Status</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {student.statuses.map((s, i) => (
              <tr
                key={i}
                className={`${
                  i % 2 === 0 ? "bg-neutral-900" : "bg-neutral-800/60"
                } border-b border-neutral-700 hover:bg-neutral-700/40 transition`}
              >
                <td className="px-4 py-3">{s.date}</td>
                <td
                  className={`font-semibold ${
                    s.status === "Present"
                      ? "text-green-400"
                      : s.status === "Absent"
                      ? "text-red-400"
                      : "text-yellow-400"
                  }`}
                >
                  {s.status}
                </td>
                <td>{s.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DailyLogsModal;
