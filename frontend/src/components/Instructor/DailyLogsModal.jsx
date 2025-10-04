// src/components/Instructor/DailyLogsModal.jsx
import {
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaCalendarAlt,
  FaFilePdf,
} from "react-icons/fa";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const DailyLogsModal = ({ student, startDate, endDate, statusFilter }) => {
  if (!student) return null;

  const logs = (student.records || student.statuses || []).filter(
    (s) =>
      (statusFilter === "All" || s.status === statusFilter) &&
      (!startDate || new Date(s.date) >= new Date(startDate)) &&
      (!endDate || new Date(s.date) <= new Date(endDate))
  );

  const totalLogs = logs.length;
  const presentCount = logs.filter((s) => s.status === "Present").length;
  const absentCount = logs.filter((s) => s.status === "Absent").length;
  const lateCount = logs.filter((s) => s.status === "Late").length;

  // ✅ Format time into AM/PM
  const formatTime = (timeStr) => {
    if (!timeStr) return "N/A";
    const dateObj = new Date(`1970-01-01T${timeStr}`);
    if (isNaN(dateObj.getTime())) return timeStr;
    return dateObj.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // ✅ Format date into "Month Day, Year"
  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const dateObj = new Date(dateStr);
    if (isNaN(dateObj.getTime())) return dateStr;
    return dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // ✅ Export Student Logs to PDF
  const exportToPDF = () => {
    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();

    // Logos
    doc.addImage("/ccit-logo.png", "PNG", 15, 10, 25, 25);
    doc.addImage("/prmsu.png", "PNG", pageWidth - 40, 10, 25, 25);

    // University Info
    doc.setFont("times", "bold");
    doc.setFontSize(14);
    doc.text("Republic of the Philippines", pageWidth / 2, 18, { align: "center" });
    doc.text("President Ramon Magsaysay State University", pageWidth / 2, 25, { align: "center" });

    doc.setFont("times", "italic");
    doc.setFontSize(11);
    doc.text("(Ramon Magsaysay Technological University)", pageWidth / 2, 32, { align: "center" });
    doc.text("Iba, Zambales", pageWidth / 2, 38, { align: "center" });

    doc.setFont("times", "bold");
    doc.setFontSize(12);
    doc.text(
      "COLLEGE OF COMMUNICATION AND INFORMATION TECHNOLOGY",
      pageWidth / 2,
      45,
      { align: "center" }
    );

    // Title
    doc.setFontSize(14);
    doc.setTextColor(34, 197, 94);
    doc.text("DAILY ATTENDANCE LOGS", pageWidth / 2, 55, { align: "center" });

    // Student Info
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont("times", "normal");
    doc.text(`Student: ${student.first_name} ${student.last_name}`, 20, 65);
    doc.text(`Student ID: ${student.student_id}`, 20, 72);

    // Filters Info
    let filterLine = `Status: ${statusFilter}`;
    if (startDate || endDate) {
      const start = startDate ? new Date(startDate).toLocaleDateString() : "—";
      const end = endDate ? new Date(endDate).toLocaleDateString() : "—";
      filterLine += ` | Date Range: ${start} - ${end}`;
    }
    doc.setFontSize(11);
    doc.setFont("times", "italic");
    doc.text(filterLine, 20, 80);

    // Table
    autoTable(doc, {
      startY: 90,
      head: [["Date", "Subject", "Status", "Time"]],
      body: logs.map((log) => [
        formatDate(log.date),
        `${log.subject_code || ""} ${log.subject_title || ""}`.trim() || "—",
        log.status,
        formatTime(log.time),
      ]),
      styles: {
        font: "helvetica",
        fontSize: 10,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [34, 197, 94],
        textColor: [255, 255, 255],
        halign: "center",
      },
      bodyStyles: { halign: "center" },
      alternateRowStyles: { fillColor: [240, 255, 240] },
    });

    doc.save(`attendance_logs_${student.student_id}.pdf`);
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-4 sm:mb-6 border-b border-white/10 pb-3 flex flex-col sm:flex-row gap-3 sm:gap-6 justify-between items-start sm:items-center">
        {/* Title + Subtitle */}
        <div className="p-3 sm:p-4 rounded-xl border-white/10">
          <h2 className="text-lg sm:text-2xl font-bold flex items-center gap-2 bg-gradient-to-r from-emerald-400 to-green-500 bg-clip-text text-transparent">
            <FaCalendarAlt className="text-emerald-400 drop-shadow-md shrink-0" />
            <span className="leading-tight">Daily Attendance Logs</span>
          </h2>
          <p className="text-gray-300 text-xs sm:text-sm mt-1">
            Showing records for{" "}
            <span className="font-semibold bg-gradient-to-r from-emerald-400 to-green-500 bg-clip-text text-transparent">
              {student.first_name} {student.last_name}
            </span>
          </p>
        </div>

        {/* Export Button */}
        <button
          onClick={exportToPDF}
          aria-label="Export attendance logs to PDF"
          className="relative inline-flex items-center justify-center gap-2 w-full sm:w-auto
                    px-5 sm:px-6 py-2.5 rounded-lg text-sm sm:text-base font-semibold text-white
                    bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600
                    shadow-md shadow-emerald-600/40 overflow-hidden
                    transition-all duration-500 ease-in-out
                    hover:scale-[1.07] hover:shadow-lg hover:shadow-emerald-400/50
                    active:scale-95 group"
        >
          {/* Animated gradient shimmer */}
          <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent 
                          translate-x-[-200%] group-hover:translate-x-[200%]
                          transition-transform duration-[1.5s] ease-in-out" />

          {/* Soft glow ring */}
          <span className="absolute inset-0 rounded-lg ring-0 ring-emerald-400/0 
                          group-hover:ring-4 group-hover:ring-emerald-400/30 
                          transition-all duration-700 ease-in-out" />

          {/* Icon */}
          <FaFilePdf className="relative z-10 text-lg transition-transform duration-500 
                                group-hover:-translate-y-[2px] group-hover:text-white" />

          {/* Text */}
          <span className="relative z-10 tracking-wide">Export PDF</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {[
          {
            label: "Total Logs",
            value: totalLogs,
            color: "text-white",
            bg: "from-gray-600/20 via-gray-700/20 to-gray-800/20",
            hoverGlow: "hover:shadow-gray-400/20",
            icon: null,
          },
          {
            label: "Present",
            value: presentCount,
            color: "text-green-400",
            bg: "from-green-500/20 via-green-600/20 to-green-700/20",
            hoverGlow: "hover:shadow-green-400/30",
            icon: <FaCheckCircle />,
          },
          {
            label: "Absent",
            value: absentCount,
            color: "text-red-400",
            bg: "from-red-500/20 via-red-600/20 to-red-700/20",
            hoverGlow: "hover:shadow-red-400/30",
            icon: <FaTimesCircle />,
          },
          {
            label: "Late",
            value: lateCount,
            color: "text-yellow-400",
            bg: "from-yellow-400/20 via-yellow-500/20 to-yellow-600/20",
            hoverGlow: "hover:shadow-yellow-400/30",
            icon: <FaClock />,
          },
        ].map((stat, i) => (
          <div
            key={i}
            className={`
              relative bg-gradient-to-br ${stat.bg} backdrop-blur-xl
              p-4 sm:p-5 rounded-xl text-center border border-white/10 shadow-md overflow-hidden group
              transition-all duration-500 ease-out
              hover:scale-[1.05] hover:-translate-y-1 hover:shadow-lg ${stat.hoverGlow}
            `}
          >
            {/* Colored Glow Border */}
            <div
              className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700`}
            >
              <div
                className={`absolute inset-0 rounded-xl blur-xl animate-pulse ${
                  stat.label === "Present"
                    ? "bg-green-500/25"
                    : stat.label === "Absent"
                    ? "bg-red-500/25"
                    : stat.label === "Late"
                    ? "bg-yellow-400/25"
                    : "bg-gray-400/20"
                }`}
              />
            </div>

            {/* Content */}
            {stat.icon ? (
              <div
                className={`flex items-center justify-center gap-2 mb-1 ${stat.color} transition-all duration-300`}
              >
                <span className="text-lg sm:text-xl transform group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                  {stat.icon}
                </span>
                <p className="text-gray-300 text-xs sm:text-sm font-medium tracking-wide">
                  {stat.label}
                </p>
              </div>
            ) : (
              <p className="text-gray-400 text-xs sm:text-sm mb-1">{stat.label}</p>
            )}

            <p
              className={`font-bold ${stat.color} text-xl sm:text-2xl md:text-3xl transition-all duration-300 group-hover:scale-110`}
            >
              {stat.value}
            </p>

            {/* Bottom Highlight Bar with matching color */}
            <span
              className={`absolute bottom-0 left-0 w-full h-1 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
                stat.label === "Present"
                  ? "bg-gradient-to-r from-green-400 via-emerald-500 to-transparent"
                  : stat.label === "Absent"
                  ? "bg-gradient-to-r from-red-400 via-red-500 to-transparent"
                  : stat.label === "Late"
                  ? "bg-gradient-to-r from-yellow-400 via-yellow-500 to-transparent"
                  : "bg-gradient-to-r from-gray-400 via-gray-500 to-transparent"
              }`}
            ></span>
          </div>
        ))}
      </div>

      {/* Table / Logs */}
      <div className="mt-6">
        {/* ✅ Mobile & Tablet (Card View with Scroll, shows 2 only at a time) */}
        <div className="md:hidden max-h-[15rem] overflow-y-auto overflow-x-hidden space-y-3 sm:space-y-4">
        {logs.length > 0 ? (
          logs.map((s, i) => (
            <div
              key={i}
              className={`relative rounded-xl border border-white/10 bg-black/40 backdrop-blur-md p-4 
                          shadow-md transition-all duration-500 ease-in-out 
                          hover:scale-[1.03] hover:-translate-y-1 hover:shadow-lg 
                          ${
                            s.status === "Present"
                              ? "hover:shadow-green-500/20 hover:border-green-500/30"
                              : s.status === "Absent"
                              ? "hover:shadow-red-500/20 hover:border-red-500/30"
                              : "hover:shadow-yellow-500/20 hover:border-yellow-500/30"
                          }`}
            >
              {/* Optional subtle glow overlay */}
              <span
                className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-xl ${
                  s.status === "Present"
                    ? "bg-green-500/10"
                    : s.status === "Absent"
                    ? "bg-red-500/10"
                    : "bg-yellow-500/10"
                }`}
              ></span>

              {/* Date + Status */}
              <div className="flex items-center justify-between mb-2 relative z-10">
                <p className="text-sm font-semibold text-white transition-colors duration-300 group-hover:text-emerald-300">
                  {formatDate(s.date)}
                </p>
                <span
                  className={`px-2 py-1 rounded-full text-[10px] font-semibold transition-all duration-500 ease-in-out
                    ${
                      s.status === "Present"
                        ? "bg-green-500/20 text-green-400 hover:bg-green-500/30 hover:text-green-300 shadow-[0_0_8px_rgba(34,197,94,0.25)]"
                        : s.status === "Absent"
                        ? "bg-red-500/20 text-red-400 hover:bg-red-500/30 hover:text-red-300 shadow-[0_0_8px_rgba(239,68,68,0.25)]"
                        : "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 hover:text-yellow-300 shadow-[0_0_8px_rgba(234,179,8,0.25)]"
                    }`}
                >
                  {s.status || "N/A"}
                </span>
              </div>

              {/* Subject */}
              <p className="text-gray-200 text-sm relative z-10 transition-colors duration-300 group-hover:text-white">
                {s.subject_code ? (
                  <>
                    <span className="font-semibold">{s.subject_code}</span>
                    {s.subject_title && (
                      <span className="text-gray-400 group-hover:text-gray-300">
                        {" "}
                        – {s.subject_title}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-gray-500 italic group-hover:text-gray-400">
                    No Subject
                  </span>
                )}
              </p>

              {/* Time */}
              <div className="flex items-center gap-2 mt-2 text-xs text-gray-300 relative z-10 group-hover:text-gray-200 transition-colors duration-300">
                <span className="font-medium">Time:</span>
                <span>{formatTime(s.time)}</span>
              </div>

              {/* Optional gradient shimmer (modern detail) */}
              <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/5 to-transparent 
                              translate-x-[-200%] group-hover:translate-x-[200%] 
                              transition-transform duration-[1.2s] ease-in-out"></span>
            </div>
          ))
        ) : (
          <p className="text-center py-6 text-gray-500 italic border border-white/10 rounded-xl">
            No attendance logs available
          </p>
        )}
      </div>

        {/* ✅ Desktop (Table View) */}
        <div className="hidden md:block border border-white/5 rounded-xl shadow-lg backdrop-blur-md bg-black/30">
        {/* Table Header (fixed, hindi kasama sa scroll) */}
        <table className="min-w-full text-sm text-left text-gray-300">
          <thead className="sticky top-0 z-10 bg-gradient-to-r from-emerald-500/10 to-emerald-600/10 text-emerald-300 shadow">
            <tr>
              <th className="px-6 py-3 whitespace-nowrap">Date</th>
              <th className="px-6 py-3">Subject</th>
              <th className="px-6 py-3 whitespace-nowrap">Status</th>
              <th className="px-6 py-3 whitespace-nowrap">Time</th>
            </tr>
          </thead>
        </table>

        {/* Scrollable body limited to 3–4 rows */}
        <div className="max-h-[220px] overflow-y-auto overflow-x-hidden"> 
          <table className="min-w-full text-sm text-left text-gray-300">
            <tbody>
              {logs.length > 0 ? (
                logs.map((s, i) => (
                  <tr
                    key={i}
                    className={`
                      group
                      transition-all duration-300 ease-in-out cursor-pointer
                      ${i % 2 === 0 ? "bg-white/5" : "bg-white/10"}
                      border-b border-white/10
                      hover:scale-[1.01] hover:-translate-y-[1px] 
                      hover:shadow-lg 
                      ${
                        s.status === "Present"
                          ? "hover:shadow-green-500/20 hover:bg-green-500/5"
                          : s.status === "Absent"
                          ? "hover:shadow-red-500/20 hover:bg-red-500/5"
                          : "hover:shadow-yellow-500/20 hover:bg-yellow-500/5"
                      }
                    `}
                  >
                    {/* Date */}
                    <td className="px-6 py-3 whitespace-nowrap text-gray-200 group-hover:text-white transition-colors duration-300">
                      {formatDate(s.date)}
                    </td>

                    {/* Subject */}
                    <td className="px-6 py-3 font-medium text-white transition-colors duration-300 group-hover:text-emerald-300">
                      {s.subject_code ? (
                        <>
                          <span className="font-semibold">{s.subject_code}</span>
                          {s.subject_title && (
                            <span className="text-gray-400 group-hover:text-gray-300"> – {s.subject_title}</span>
                          )}
                        </>
                      ) : (
                        <span className="text-gray-500 italic group-hover:text-gray-400">No Subject</span>
                      )}
                    </td>

                    {/* Status badge */}
                    <td className="px-6 py-3">
                      <span
                        className={`relative inline-flex items-center justify-center
                          px-3 py-1 rounded-full text-xs font-semibold
                          transition-all duration-500 ease-in-out
                          transform group-hover:scale-110
                          ${
                            s.status === "Present"
                              ? "bg-green-500/20 text-green-400 hover:bg-green-500/30 hover:text-green-300 hover:shadow-[0_0_12px_rgba(34,197,94,0.4)]"
                              : s.status === "Absent"
                              ? "bg-red-500/20 text-red-400 hover:bg-red-500/30 hover:text-red-300 hover:shadow-[0_0_12px_rgba(239,68,68,0.4)]"
                              : "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 hover:text-yellow-300 hover:shadow-[0_0_12px_rgba(234,179,8,0.4)]"
                          }`}
                      >
                        {/* Animated inner pulse ring */}
                        <span
                          className={`absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700
                            ${
                              s.status === "Present"
                                ? "ring-2 ring-green-400/40 animate-pulse"
                                : s.status === "Absent"
                                ? "ring-2 ring-red-400/40 animate-pulse"
                                : "ring-2 ring-yellow-400/40 animate-pulse"
                            }`}
                        ></span>

                        <span className="relative z-10">{s.status || "N/A"}</span>
                      </span>
                    </td>

                    {/* Time */}
                    <td className="px-6 py-3 whitespace-nowrap text-gray-200 group-hover:text-white transition-colors duration-300">
                      {formatTime(s.time)}
                    </td>
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
      </div>
    </div>
  );
};

export default DailyLogsModal;
