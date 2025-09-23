// src/components/Student/SubjectLogsModal.jsx
import {
  FaTimes,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaList,
} from "react-icons/fa";

const SubjectLogsModal = ({ subject, logs, onClose, formatDate }) => {
  if (!subject) return null;

  const subjectLogs = logs.filter(
    (l) =>
      l.subject_code === subject.subject_code &&
      l.subject_title === subject.subject_title
  );

  // ✅ Compute stats
  const presentCount = subjectLogs.filter((l) => l.status === "Present").length;
  const absentCount = subjectLogs.filter((l) => l.status === "Absent").length;
  const lateCount = subjectLogs.filter((l) => l.status === "Late").length;
  const total = subjectLogs.length;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-neutral-900 border border-neutral-700 rounded-2xl shadow-xl p-6 w-[90%] max-w-2xl">
        {/* Header */}
        <div className="flex justify-between items-start mb-5 border-b border-neutral-700 pb-3">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <FaList className="text-green-400" />
              Attendance Logs
            </h3>
            <p className="text-gray-400 text-sm mt-1">
              Showing all attendance records for{" "}
              <span className="text-green-400 font-semibold">
                {subject.subject_code} {subject.subject_title}
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-red-500 transition text-lg"
          >
            <FaTimes />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-neutral-800 p-4 rounded-xl text-center border border-neutral-700 shadow-sm">
            <p className="text-gray-400 text-sm">Total Logs</p>
            <p className="text-2xl font-bold text-white">{total}</p>
          </div>
          <div className="bg-neutral-800 p-4 rounded-xl text-center border border-neutral-700 shadow-sm">
            <div className="flex items-center justify-center gap-2 text-green-400">
              <FaCheckCircle />
              <p className="text-gray-300">Present</p>
            </div>
            <p className="text-2xl font-bold text-green-400 mt-1">
              {presentCount}
            </p>
          </div>
          <div className="bg-neutral-800 p-4 rounded-xl text-center border border-neutral-700 shadow-sm">
            <div className="flex items-center justify-center gap-2 text-red-400">
              <FaTimesCircle />
              <p className="text-gray-300">Absent</p>
            </div>
            <p className="text-2xl font-bold text-red-400 mt-1">{absentCount}</p>
          </div>
          <div className="bg-neutral-800 p-4 rounded-xl text-center border border-neutral-700 shadow-sm">
            <div className="flex items-center justify-center gap-2 text-yellow-400">
              <FaClock />
              <p className="text-gray-300">Late</p>
            </div>
            <p className="text-2xl font-bold text-yellow-400 mt-1">
              {lateCount}
            </p>
          </div>
        </div>

        {/* Logs Table */}
        <div className="overflow-x-auto max-h-96 overflow-y-auto border border-neutral-700 rounded-xl shadow-sm">
          <table className="min-w-full text-sm text-left text-gray-300">
            <thead className="bg-neutral-800 text-green-400 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 whitespace-nowrap">Date</th>
                <th className="px-6 py-3 whitespace-nowrap">Status</th>
                <th className="px-6 py-3 whitespace-nowrap">Time</th>
              </tr>
            </thead>
            <tbody>
              {subjectLogs.length > 0 ? (
                subjectLogs.map((log, idx) => (
                  <tr
                    key={idx}
                    className={`${
                      idx % 2 === 0 ? "bg-neutral-900/60" : "bg-neutral-800/50"
                    } border-b border-neutral-700 hover:bg-neutral-700/50 transition`}
                  >
                    <td className="px-6 py-3 whitespace-nowrap">
                      {formatDate(log.date)}
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          log.status === "Present"
                            ? "bg-green-500/20 text-green-400"
                            : log.status === "Late"
                            ? "bg-yellow-500/20 text-yellow-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap">
                      {log.time || "—"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="3"
                    className="text-center py-6 text-gray-500 italic"
                  >
                    No logs available for this subject
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SubjectLogsModal;
