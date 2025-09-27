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
      <div className="mb-6 border-b border-white/10 pb-3 flex justify-between items-center">
        <div className="p-4 rounded-xl border-white/10 pb-1">
          <h2 className="text-2xl font-bold flex items-center gap-2 bg-gradient-to-r from-green-400 via-emerald-400 to-green-600 bg-clip-text text-transparent">
            <FaCalendarAlt className="text-green-400 drop-shadow-md" />
            Daily Attendance Logs
          </h2>
          <p className="text-gray-300 text-sm mt-1">
            Showing all attendance records for{" "}
            <span className="font-semibold bg-gradient-to-r from-emerald-400 to-green-500 bg-clip-text text-transparent">
              {student.first_name} {student.last_name}
            </span>
          </p>
        </div>

        <button
          onClick={exportToPDF}
          className="flex items-center gap-2 bg-gradient-to-r from-green-500 via-emerald-600 to-green-700 hover:from-green-400 hover:via-emerald-500 hover:to-green-600 text-white px-5 py-2.5 rounded-lg text-sm shadow-lg transition"
        >
          <FaFilePdf /> Export PDF
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Logs", value: totalLogs, color: "text-white", bg: "from-gray-600/20 via-gray-700/20 to-gray-800/20", icon: null },
          { label: "Present", value: presentCount, color: "text-green-400", bg: "from-green-500/20 via-green-600/20 to-green-700/20", icon: <FaCheckCircle /> },
          { label: "Absent", value: absentCount, color: "text-red-400", bg: "from-red-500/20 via-red-600/20 to-red-700/20", icon: <FaTimesCircle /> },
          { label: "Late", value: lateCount, color: "text-yellow-400", bg: "from-yellow-400/20 via-yellow-500/20 to-yellow-600/20", icon: <FaClock /> },
        ].map((stat, i) => (
          <div
            key={i}
            className={`relative bg-gradient-to-br ${stat.bg} backdrop-blur-lg p-5 rounded-xl text-center border border-white/10 shadow-md`}
          >
            {stat.icon && (
              <div className={`flex items-center justify-center gap-2 ${stat.color}`}>
                {stat.icon}
                <p className="text-gray-300">{stat.label}</p>
              </div>
            )}
            {!stat.icon && <p className="text-gray-400">{stat.label}</p>}
            <p className={`text-3xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto max-h-96 overflow-y-auto border border-white/5 rounded-xl shadow-lg backdrop-blur-md bg-black/30">
        <table className="min-w-full text-sm text-left text-gray-300">
          <thead className="sticky top-0 z-10 bg-gradient-to-r from-green-600 via-emerald-600 to-green-700 text-white shadow">
            <tr>
              <th className="px-6 py-3 whitespace-nowrap">Date</th>
              <th className="px-6 py-3">Subject</th>
              <th className="px-6 py-3 whitespace-nowrap">Status</th>
              <th className="px-6 py-3 whitespace-nowrap">Time</th>
            </tr>
          </thead>
          <tbody>
            {logs.length > 0 ? (
              logs.map((s, i) => (
                <tr
                  key={i}
                  className={`${
                    i % 2 === 0
                      ? "bg-white/5"
                      : "bg-white/10"
                  } border-b border-white/10 hover:bg-emerald-500/10 transition`}
                >
                  <td className="px-6 py-3 whitespace-nowrap">{formatDate(s.date)}</td>
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
                  <td className="px-6 py-3 whitespace-nowrap">{formatTime(s.time)}</td>
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
