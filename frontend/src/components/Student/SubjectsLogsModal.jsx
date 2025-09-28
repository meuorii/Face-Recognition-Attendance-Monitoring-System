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
    <div className="fixed inset-0 flex items-center justify-center z-50 px-4 sm:px-6 md:px-8">
      {/* Background overlay */}
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-5xl max-h-[95vh] overflow-y-auto bg-gradient-to-br from-neutral-900/95 via-neutral-950/95 to-black/95 border border-emerald-600/30 rounded-2xl shadow-2xl p-6 animate-fadeIn">
        {/* Header */}
        <div className="flex justify-between items-start mb-5 border-b border-emerald-600/30 pb-3">
          <div>
            <h3 className="text-lg sm:text-xl font-bold flex items-center gap-2 bg-gradient-to-r from-emerald-400 to-green-500 bg-clip-text text-transparent">
              <FaList className="text-emerald-400" />
              Attendance Logs
            </h3>
            <p className="text-gray-400 text-xs sm:text-sm mt-1">
              Showing records for{" "}
              <span className="font-semibold bg-gradient-to-r from-emerald-400 via-green-500 to-green-600 bg-clip-text text-transparent">
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-8">
          {/* Total Logs */}
          <div className="relative group bg-gradient-to-br from-slate-800/70 to-neutral-900/70 p-4 sm:p-6 rounded-xl sm:rounded-2xl text-center border border-white/10 shadow-lg transition hover:scale-[1.02]">
            <p className="text-gray-400 text-xs sm:text-sm font-medium">
              Total Logs
            </p>
            <p className="text-2xl sm:text-4xl font-extrabold text-white mt-1">
              {total}
            </p>
            <span className="text-xs text-gray-500">All records</span>
          </div>

          {/* Present */}
          <div className="relative group bg-gradient-to-br from-emerald-600/20 to-green-700/20 p-4 sm:p-6 rounded-xl sm:rounded-2xl text-center border border-emerald-500/20 shadow-lg transition hover:scale-[1.02]">
            <div className="flex items-center justify-center gap-1 sm:gap-2 text-emerald-400 mb-1 sm:mb-2 text-base sm:text-lg">
              <FaCheckCircle className="text-lg sm:text-2xl" />
              <p>Present</p>
            </div>
            <p className="text-2xl sm:text-4xl font-extrabold text-emerald-400">
              {presentCount}
            </p>
          </div>

          {/* Absent */}
          <div className="relative group bg-gradient-to-br from-red-600/20 to-rose-700/20 p-4 sm:p-6 rounded-xl sm:rounded-2xl text-center border border-red-500/20 shadow-lg transition hover:scale-[1.02]">
            <div className="flex items-center justify-center gap-1 sm:gap-2 text-red-400 mb-1 sm:mb-2 text-base sm:text-lg">
              <FaTimesCircle className="text-lg sm:text-2xl" />
              <p>Absent</p>
            </div>
            <p className="text-2xl sm:text-4xl font-extrabold text-red-400">
              {absentCount}
            </p>
          </div>

          {/* Late */}
          <div className="relative group bg-gradient-to-br from-yellow-500/20 to-amber-600/20 p-4 sm:p-6 rounded-xl sm:rounded-2xl text-center border border-yellow-500/20 shadow-lg transition hover:scale-[1.02]">
            <div className="flex items-center justify-center gap-1 sm:gap-2 text-yellow-400 mb-1 sm:mb-2 text-base sm:text-lg">
              <FaClock className="text-lg sm:text-2xl" />
              <p>Late</p>
            </div>
            <p className="text-2xl sm:text-4xl font-extrabold text-yellow-400">
              {lateCount}
            </p>
          </div>
        </div>

        {/* Logs Table (desktop/tablet) */}
        <div className="hidden sm:block overflow-y-auto max-h-96 border border-white/10 rounded-xl shadow-xl backdrop-blur-md">
          <table className="w-full text-sm text-left text-gray-300">
            <thead className="bg-gradient-to-r from-emerald-600/30 to-green-700/30 text-emerald-400 sticky top-0 z-10 shadow-md">
              <tr>
                <th className="px-4 sm:px-6 py-3 font-semibold tracking-wide border-b border-emerald-500/20">
                  Date
                </th>
                <th className="px-4 sm:px-6 py-3 font-semibold tracking-wide border-b border-emerald-500/20">
                  Status
                </th>
                <th className="px-4 sm:px-6 py-3 font-semibold tracking-wide border-b border-emerald-500/20">
                  Time
                </th>
              </tr>
            </thead>
            <tbody>
              {subjectLogs.length > 0 ? (
                subjectLogs.map((log, idx) => (
                  <tr
                    key={idx}
                    className={`transition ${
                      idx % 2 === 0 ? "bg-neutral-900/60" : "bg-neutral-800/50"
                    } border-b border-white/5 hover:bg-gradient-to-r hover:from-emerald-800/20 hover:to-green-700/10`}
                  >
                    <td className="px-4 sm:px-6 py-3 font-medium text-gray-200">
                      {formatDate(log.date)}
                    </td>
                    <td className="px-4 sm:px-6 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 sm:px-3 py-1 rounded-full text-xs font-semibold shadow-md ${
                          log.status === "Present"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : log.status === "Late"
                            ? "bg-yellow-500/20 text-yellow-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-gray-300">
                      {log.time || "—"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="py-8 text-center text-gray-500">
                    No logs available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="sm:hidden space-y-4">
          {subjectLogs.length > 0 ? (
            subjectLogs.map((log, idx) => (
              <div
                key={idx}
                className="p-4 rounded-lg bg-neutral-800/60 border border-white/10 shadow-sm"
              >
                <p className="text-gray-200 text-sm font-medium">
                  {formatDate(log.date)}
                </p>
                <p
                  className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${
                    log.status === "Present"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : log.status === "Late"
                      ? "bg-yellow-500/20 text-yellow-400"
                      : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {log.status}
                </p>
                <p className="text-gray-400 text-xs mt-2">
                  Time: {log.time || "—"}
                </p>
              </div>
            ))
          ) : (
            <p className="text-gray-500 italic text-center">
              No logs available for this subject
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubjectLogsModal;
