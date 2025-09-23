// src/components/Instructor/DailyLogsModal.jsx
import { FaCheckCircle, FaTimesCircle, FaClock, FaCalendarAlt, FaFilePdf } from "react-icons/fa";
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
      <div className="mb-6 border-b border-neutral-700 pb-3 flex justify-between items-center">
        <div>
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
        <button
          onClick={exportToPDF}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-sm shadow transition"
        >
          <FaFilePdf /> Export PDF
        </button>
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
                    i % 2 === 0 ? "bg-neutral-900/60" : "bg-neutral-800/50"
                  } border-b border-neutral-700 hover:bg-neutral-700/50 transition`}
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
