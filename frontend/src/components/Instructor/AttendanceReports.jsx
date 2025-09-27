// src/components/Instructor/AttendanceReport.jsx
import { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { jsPDF } from "jspdf"; // ✅ named import is safer
import autoTable from "jspdf-autotable";
import {
  getClassesByInstructor,
  getAttendanceReportByClass,
  getAttendanceReportAll,
} from "../../services/api";
import { toast } from "react-toastify";
import {
  FaFilePdf,
  FaCalendarAlt,
  FaClipboardList,
  FaListUl,
} from "react-icons/fa";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useModal } from "./ModalManager";
import DailyLogsModal from "./DailyLogsModal";

const COLORS = ["#22c55e", "#ef4444", "#facc15"]; // green, red, yellow

const AttendanceReport = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [logs, setLogs] = useState([]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");

  const instructor = JSON.parse(localStorage.getItem("userData"));
  const token = localStorage.getItem("token");
  const { openModal } = useModal();

  // Load classes + all logs on mount
  useEffect(() => {
    if (instructor?.instructor_id && token) {
      fetchClasses();
      fetchLogs();
    } else {
      toast.error("No instructor data found. Please log in again.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchClasses = async () => {
    setLoadingClasses(true);
    try {
      const data = await getClassesByInstructor(instructor.instructor_id, token);
      setClasses(data);
    } catch (err) {
      console.error("❌ Failed to load classes:", err);
      toast.error("Failed to load classes.");
    } finally {
      setLoadingClasses(false);
    }
  };

  const fetchLogs = async () => {
    const from = startDate ? startDate.toISOString().split("T")[0] : null;
    const to = endDate ? endDate.toISOString().split("T")[0] : null;

    setLoadingLogs(true);
    try {
      let data = [];
      if (selectedClass) {
        data = await getAttendanceReportByClass(selectedClass, from, to);
      } else {
        data = await getAttendanceReportAll(from, to);
      }

      // Group logs by student
      const grouped = {};
      data.forEach((log) => {
        const sid = log.student_id;
        if (!sid) return;

        if (!grouped[sid]) {
          grouped[sid] = {
            student_id: log.student_id,
            first_name: log.first_name,
            last_name: log.last_name,
            total_attendances: 0,
            present: 0,
            absent: 0,
            late: 0,
            statuses: [],
          };
        }
        grouped[sid].total_attendances++;
        if (log.status === "Present") grouped[sid].present++;
        if (log.status === "Absent") grouped[sid].absent++;
        if (log.status === "Late") grouped[sid].late++;
        grouped[sid].statuses.push({
          date: log.date,
          status: log.status,
          time: log.time,
          subject_code: log.subject_code || null,
          subject_title: log.subject_title || null,
        });
      });

      setLogs(Object.values(grouped));
    } catch (err) {
      console.error("❌ Failed to fetch attendance logs:", err);
      toast.error("Failed to fetch attendance logs.");
    } finally {
      setLoadingLogs(false);
    }
  };

  // Auto-refresh logs when class changes
  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClass]);

  // --- PDF Export ---
  const exportToPDF = () => {
    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();

    // Logos
    doc.addImage("/ccit-logo.png", "PNG", 15, 10, 25, 25);
    doc.addImage("/prmsu.png", "PNG", pageWidth - 40, 10, 25, 25);

    // Headers
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

    doc.setFontSize(14);
    doc.setTextColor(34, 197, 94);
    doc.text("ATTENDANCE REPORT", pageWidth / 2, 55, { align: "center" });

    // Class Info
    const selected = classes.find((c) => (c.class_id || c._id) === selectedClass);
    if (selected) {
      doc.setFont("times", "normal");
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(
        `Subject: ${selected.subject_code} – ${selected.subject_title}`,
        20,
        65
      );
    }

    if (startDate || endDate) {
      const start = startDate ? new Date(startDate).toLocaleDateString() : "—";
      const end = endDate ? new Date(endDate).toLocaleDateString() : "—";

      doc.setFont("times", "italic");
      doc.setFontSize(11);
      doc.setTextColor(80, 80, 80);
      doc.text(`Date Range: ${start} to ${end}`, 20, 80);
    }

    autoTable(doc, {
      startY: startDate || endDate ? 88 : 80,
      head: [["Student ID", "Name", "Present", "Absent", "Late", "Total"]],
      body: logs.map((log) => [
        log.student_id,
        `${log.first_name} ${log.last_name}`,
        log.present,
        log.absent,
        log.late,
        log.total_attendances,
      ]),
      styles: { font: "helvetica", fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [34, 197, 94], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [240, 255, 240] },
    });

    doc.save("attendance_report.pdf");
  };

  // --- Summary Stats ---
  const totalStudents = logs.length;
  const totalSessions = logs.reduce(
    (sum, log) => Math.max(sum, log.statuses.length),
    0
  );
  const totalRecords = logs.reduce((sum, log) => sum + log.total_attendances, 0);
  const totalAttended = logs.reduce((sum, log) => sum + log.present + log.late, 0);
  const attendanceRate = totalRecords
    ? ((totalAttended / totalRecords) * 100).toFixed(2)
    : 0;

  // --- Charts ---
  const pieData = [
    { name: "Present", value: logs.reduce((sum, log) => sum + log.present, 0) },
    { name: "Absent", value: logs.reduce((sum, log) => sum + log.absent, 0) },
    { name: "Late", value: logs.reduce((sum, log) => sum + log.late, 0) },
  ];
  const barData = logs.map((log) => ({
    name: `${log.first_name} ${log.last_name}`,
    Present: log.present,
    Absent: log.absent,
    Late: log.late,
  }));

  return (
    <div className="p-8 bg-neutral-950/80 backdrop-blur-xl rounded-2xl border border-white/10 shadow-xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <FaClipboardList className="text-green-400 text-3xl" />
        <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-green-600 bg-clip-text text-transparent">
          Attendance Report
        </h2>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4 mb-10">
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          disabled={loadingClasses}
          className="flex-1 px-4 py-3 rounded-lg bg-neutral-900/60 border border-white/10 text-white"
        >
          <option value="">-- All Classes --</option>
          {classes.map((c) => (
            <option key={c._id} value={c.class_id || c._id}>
              {c.subject_code} – {c.subject_title}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-2 bg-neutral-900/60 border border-white/10 rounded-lg px-3 py-2">
          <FaCalendarAlt className="text-emerald-400" />
          <DatePicker
            selected={startDate}
            onChange={(date) => setStartDate(date)}
            placeholderText="Start Date"
            className="bg-transparent text-white outline-none"
          />
        </div>

        <div className="flex items-center gap-2 bg-neutral-900/60 border border-white/10 rounded-lg px-3 py-2">
          <FaCalendarAlt className="text-emerald-400" />
          <DatePicker
            selected={endDate}
            onChange={(date) => setEndDate(date)}
            placeholderText="End Date"
            className="bg-transparent text-white outline-none"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-3 rounded-lg bg-neutral-900/60 border border-white/10 text-white"
        >
          <option>All</option>
          <option>Present</option>
          <option>Absent</option>
          <option>Late</option>
        </select>

        <button
          onClick={fetchLogs}
          disabled={loadingLogs}
          className="px-6 py-3 rounded-lg bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold shadow"
        >
          {loadingLogs ? "Loading..." : "Filter"}
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {[
          { label: "Total Students", value: totalStudents },
          { label: "Total Sessions", value: totalSessions },
          { label: "Total Records", value: totalRecords },
          { label: "Attendance Rate", value: `${attendanceRate}%`, highlight: true },
        ].map((card, i) => {
          // ✅ Dynamic color logic for Attendance Rate
          let bgClass = "bg-neutral-900/60";
          let textClass = "text-white";

          if (card.highlight) {
            const rate = parseFloat(attendanceRate) || 0;
            if (rate < 50) {
              // 🔴 Low attendance
              bgClass = "bg-gradient-to-br from-red-600/20 to-red-900/10";
              textClass = "text-red-400";
            } else if (rate < 80) {
              // 🟠 Mid attendance
              bgClass = "bg-gradient-to-br from-yellow-500/20 to-yellow-800/10";
              textClass = "text-yellow-400";
            } else {
              // 🟢 High attendance
              bgClass = "bg-gradient-to-br from-emerald-500/20 to-green-700/10";
              textClass = "text-emerald-400";
            }
          }

          return (
            <div
              key={i}
              className={`p-5 rounded-xl border border-white/10 shadow-lg ${bgClass}`}
            >
              <p className="text-gray-400 text-sm">{card.label}</p>
              <p className={`text-2xl font-bold ${textClass}`}>{card.value}</p>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        <div className="p-6 rounded-xl border border-white/10 bg-neutral-900/60 shadow-lg">
          <h3 className="text-lg font-semibold text-emerald-400 mb-4">
            Status Distribution
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              {/* ✅ Gradient definitions */}
              <defs>
                <linearGradient id="gradPresent" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#34d399" /> {/* emerald-400 */}
                  <stop offset="100%" stopColor="#059669" /> {/* emerald-600 */}
                </linearGradient>
                <linearGradient id="gradAbsent" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#f87171" /> {/* red-400 */}
                  <stop offset="100%" stopColor="#b91c1c" /> {/* red-700 */}
                </linearGradient>
                <linearGradient id="gradLate" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#facc15" /> {/* yellow-400 */}
                  <stop offset="100%" stopColor="#ca8a04" /> {/* yellow-600 */}
                </linearGradient>
              </defs>
              {/* ✅ Pie with gradient cells */}
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                outerRadius={100}
                label
              >
                <Cell fill="url(#gradPresent)" />
                <Cell fill="url(#gradAbsent)" />
                <Cell fill="url(#gradLate)" />
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "rgba(17, 24, 39, 0.8)", // glassy black
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                }}
                itemStyle={{ color: "#fff" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="p-6 rounded-xl border border-white/10 bg-neutral-900/60 shadow-lg">
          <h3 className="text-lg font-semibold text-emerald-400 mb-4">
            Per Student Breakdown
          </h3>
         <ResponsiveContainer width="100%" height={260}>
          <BarChart data={barData}>
            {/* ✅ Gradient defs for bars */}
            <defs>
              <linearGradient id="gradPresentBar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34d399" /> {/* emerald-400 */}
                <stop offset="100%" stopColor="#059669" /> {/* emerald-600 */}
              </linearGradient>
              <linearGradient id="gradAbsentBar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f87171" /> {/* red-400 */}
                <stop offset="100%" stopColor="#b91c1c" /> {/* red-700 */}
              </linearGradient>
              <linearGradient id="gradLateBar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fde047" /> {/* yellow-300 */}
                <stop offset="100%" stopColor="#ca8a04" /> {/* yellow-600 */}
              </linearGradient>
            </defs>

            {/* ✅ Axis styles */}
            <XAxis dataKey="name" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />

            {/* ✅ Glassy tooltip */}
            <Tooltip
              contentStyle={{
                background: "rgba(17, 24, 39, 0.8)", // glassy black
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
              }}
              itemStyle={{ color: "#fff" }}
            />

            {/* ✅ Gradient bars */}
            <Bar dataKey="Present" fill="url(#gradPresentBar)" radius={[6, 6, 0, 0]} />
            <Bar dataKey="Absent" fill="url(#gradAbsentBar)" radius={[6, 6, 0, 0]} />
            <Bar dataKey="Late" fill="url(#gradLateBar)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        </div>
      </div>

      {/* Table */}
      {logs.length > 0 ? (
        <>
          <div className="overflow-x-auto rounded-xl border border-white/10 shadow-lg">
            <table className="min-w-full text-sm text-left text-gray-300">
              <thead className="bg-gradient-to-r from-emerald-500 to-green-600 text-white">
                <tr>
                  <th className="px-4 py-3">Student ID</th>
                  <th>Name</th>
                  <th>Present</th>
                  <th>Absent</th>
                  <th>Late</th>
                  <th>Total</th>
                  <th>Daily Logs</th>
                </tr>
              </thead>
              <tbody>
                {logs
                  .filter(
                    (log) =>
                      statusFilter === "All" ||
                      log.statuses.some((s) => s.status === statusFilter)
                  )
                  .map((log, index) => (
                    <tr
                      key={index}
                      className={`transition-colors ${
                        index % 2 ? "bg-neutral-900/50" : "bg-neutral-800/50"
                      } hover:bg-emerald-500/10`}
                    >
                      <td className="px-4 py-3">{log.student_id}</td>
                      <td className="font-medium text-white">
                        {`${log.first_name} ${log.last_name}`}
                      </td>
                      <td className="text-emerald-400 font-semibold">{log.present}</td>
                      <td className="text-red-400 font-semibold">{log.absent}</td>
                      <td className="text-yellow-400 font-semibold">{log.late}</td>
                      <td className="text-white">{log.total_attendances}</td>
                      <td>
                        <button
                          onClick={() =>
                            openModal(
                              <DailyLogsModal
                                student={log}
                                startDate={startDate}
                                endDate={endDate}
                                statusFilter={statusFilter}
                                selectedClass={classes.find(
                                  (c) => (c.class_id || c._id) === selectedClass
                                )}
                              />
                            )
                          }
                          className="text-sm text-emerald-400 hover:underline flex items-center gap-1"
                        >
                          <FaListUl /> View
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Export Button */}
          <div className="flex justify-end mt-6">
            <button
              onClick={exportToPDF}
              className="flex items-center gap-2 px-6 py-3 
                        bg-gradient-to-r from-emerald-500 to-green-600 
                        text-white font-semibold rounded-lg shadow-md 
                        cursor-pointer transition-all duration-300 
                        hover:from-green-600 hover:to-emerald-700 
                        hover:shadow-lg hover:scale-[1.02] active:scale-95"
            >
              <FaFilePdf className="text-lg" /> Export as PDF
            </button>
          </div>
        </>
      ) : (
        <p className="text-gray-400 text-center mt-6">
          {loadingLogs ? "Loading attendance logs..." : "No attendance records found."}
        </p>
      )}
    </div>
  );
};

export default AttendanceReport;
