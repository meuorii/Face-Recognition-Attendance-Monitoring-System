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
  FaChevronDown,
  FaChevronUp
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
  Legend,
  LabelList
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

   // --- Mobile Student Card ---
  const StudentCard = ({ log }) => {
    const [open, setOpen] = useState(false);
    const fullName = `${log.first_name} ${log.last_name}`;

    return (
      <div
          className={`p-4 rounded-xl bg-neutral-900/70 border border-white/10 shadow-md 
                      hover:shadow-xl hover:shadow-emerald-500/20 hover:border-emerald-400/40 
                      transform hover:-translate-y-1 hover:scale-[1.02] 
                      transition-all duration-500 ease-out relative overflow-hidden`}
        >
          {/* Animated gradient border glow */}
          <div className="absolute inset-0 rounded-xl pointer-events-none opacity-0 hover:opacity-100 transition-opacity duration-700">
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 blur-xl opacity-20 animate-pulse" />
          </div>

          {/* Row 1: Student ID */}
          <div className="text-sm font-medium mb-2">
            <span className="text-gray-300 font-semibold">Student ID:</span>{" "}
            <span className="text-white">{log.student_id}</span>
          </div>

          {/* Row 2: Name | View button */}
          <div className="flex items-center justify-between text-sm font-medium mb-3">
            <span className="text-gray-300 font-semibold">
              Name:{" "}
              <span className="text-emerald-300 font-medium">{fullName}</span>
            </span>

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
              className="relative flex items-center gap-2 px-3 py-1.5 text-sm font-medium 
                        text-emerald-400 rounded-md 
                        bg-emerald-500/10 border border-emerald-500/20
                        transition-all duration-300 ease-in-out 
                        hover:text-white hover:bg-emerald-500/80 
                        hover:shadow-lg hover:shadow-emerald-400/30 hover:scale-105 cursor-pointer"
            >
              <FaListUl className="text-base transition-transform duration-300 group-hover:rotate-6" />
              <span>View</span>
            </button>
          </div>

          {/* Dropdown Toggle */}
          <button
            onClick={() => setOpen(!open)}
            className="w-full text-xs text-gray-400 hover:text-emerald-400 
                      flex justify-between items-center transition-all duration-300 cursor-pointer"
          >
            <span className="font-medium tracking-wide">
              Attendance Details
            </span>
            <span
              className={`transform transition-transform duration-300 ${
                open ? "rotate-180 text-emerald-400" : "rotate-0 text-gray-400"
              }`}
            >
              <FaChevronDown />
            </span>
          </button>

          {/* Dropdown Content with smoother expansion */}
          <div
            className={`overflow-hidden transition-all duration-700 ease-in-out 
                        ${open ? "max-h-48 opacity-100 mt-3" : "max-h-0 opacity-0"}`}
          >
            <div className="space-y-1 text-sm px-1">
              <p className="text-emerald-400 font-semibold">
                Present: {log.present}
              </p>
              <p className="text-red-400 font-semibold">
                Absent: {log.absent}
              </p>
              <p className="text-yellow-400 font-semibold">
                Late: {log.late}
              </p>
              <p className="text-gray-300 font-bold">
                Total: {log.total_attendances}
              </p>
            </div>
          </div>
        </div>
      );
    };

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
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:flex lg:flex-row gap-4 mb-10">

        {/* Class Selector */}
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          disabled={loadingClasses}
          className="w-full px-4 py-2 sm:py-3 rounded-lg bg-neutral-900/60 
                    border border-white/10 text-white
                    focus:outline-none focus:ring-2 focus:ring-emerald-400
                    hover:border-emerald-400/40 hover:shadow-lg hover:shadow-emerald-500/20
                    transition-all duration-300 ease-in-out"
        >
          <option value="" className="bg-neutral-900 text-white">-- All Classes --</option>
          {classes.map((c) => (
            <option key={c._id} value={c.class_id || c._id} className="bg-neutral-900 text-white">
              {c.subject_code} – {c.subject_title}
            </option>
          ))}
        </select>

        {/* Start Date */}
        <div className="flex items-center gap-2 px-3 py-2 sm:py-3 rounded-lg 
                        bg-neutral-900/60 border border-white/10 w-full
                        hover:border-emerald-400/40 hover:shadow-md hover:shadow-emerald-500/20
                        focus-within:ring-2 focus-within:ring-emerald-400
                        transition-all duration-300 ease-in-out">
          <FaCalendarAlt className="text-emerald-400" />
          <DatePicker
            selected={startDate}
            onChange={(date) => setStartDate(date)}
            placeholderText="Start Date"
            className="bg-transparent text-white outline-none w-full text-sm sm:text-base"
          />
        </div>

        {/* End Date */}
        <div className="flex items-center gap-2 px-3 py-2 sm:py-3 rounded-lg 
                        bg-neutral-900/60 border border-white/10 w-full
                        hover:border-emerald-400/40 hover:shadow-md hover:shadow-emerald-500/20
                        focus-within:ring-2 focus-within:ring-emerald-400
                        transition-all duration-300 ease-in-out">
          <FaCalendarAlt className="text-emerald-400" />
          <DatePicker
            selected={endDate}
            onChange={(date) => setEndDate(date)}
            placeholderText="End Date"
            className="bg-transparent text-white outline-none w-full text-sm sm:text-base"
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full px-4 py-2 sm:py-3 rounded-lg bg-neutral-900/60 
                    border border-white/10 text-white
                    focus:outline-none focus:ring-2 focus:ring-emerald-400
                    hover:border-emerald-400/40 hover:shadow-lg hover:shadow-emerald-500/20
                    transition-all duration-300 ease-in-out"
        >
          <option className="bg-neutral-900 text-white">All</option>
          <option className="bg-neutral-900 text-white">Present</option>
          <option className="bg-neutral-900 text-white">Absent</option>
          <option className="bg-neutral-900 text-white">Late</option>
        </select> 

        {/* Filter Button */}
        <button
          onClick={fetchLogs}
          disabled={loadingLogs}
          className="col-span-2 lg:w-auto w-full px-5 py-2 sm:px-6 sm:py-3 rounded-lg bg-gradient-to-r 
                    from-emerald-500 to-green-600 text-white font-semibold shadow
                    hover:from-green-600 hover:to-emerald-700 hover:shadow-lg hover:shadow-emerald-500/30
                    active:scale-95 transition-all duration-300 ease-in-out
                    disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loadingLogs ? "Loading..." : "Filter"}
        </button>
      </div>


      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {[
          {
            label: "Total Students",
            value: totalStudents,
            bg: "from-sky-500/20 to-blue-700/10",
            text: "text-sky-400",
            hover: "hover:shadow-sky-500/30",
          },
          {
            label: "Total Sessions",
            value: totalSessions,
            bg: "from-purple-500/20 to-indigo-700/10",
            text: "text-purple-400",
            hover: "hover:shadow-purple-500/30",
          },
          {
            label: "Total Records",
            value: totalRecords,
            bg: "from-pink-500/20 to-rose-700/10",
            text: "text-pink-400",
            hover: "hover:shadow-pink-500/30",
          },
          {
            label: "Attendance Rate",
            value: `${attendanceRate}%`,
            highlight: true,
          },
        ].map((card, i) => {
          // ✅ Default values
          let bgClass = `bg-gradient-to-br ${card.bg || "from-neutral-700/30 to-neutral-800/20"}`;
          let textClass = card.text || "text-white";
          let hoverClass = card.hover || "hover:shadow-emerald-500/30";

          if (card.highlight) {
            const rate = parseFloat(attendanceRate) || 0;
            if (rate < 50) {
              bgClass = "bg-gradient-to-br from-red-600/30 to-red-900/20";
              textClass = "text-red-400";
              hoverClass = "hover:shadow-red-500/30";
            } else if (rate < 80) {
              bgClass = "bg-gradient-to-br from-yellow-500/30 to-yellow-800/20";
              textClass = "text-yellow-400";
              hoverClass = "hover:shadow-yellow-500/30";
            } else {
              bgClass = "bg-gradient-to-br from-emerald-500/30 to-green-700/20";
              textClass = "text-emerald-400";
              hoverClass = "hover:shadow-emerald-500/30";
            }
          }

          return (
            <div
              key={i}
              className={`p-5 rounded-xl border border-white/10 shadow-md ${bgClass} 
                          transition-all duration-300 ease-in-out 
                          hover:scale-[1.03] hover:shadow-xl ${hoverClass}`}
            >
              <p className="text-gray-300 text-sm mb-2">{card.label}</p>
              <p className={`text-2xl font-extrabold ${textClass}`}>{card.value}</p>
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
          <ResponsiveContainer width="100%" height={340}>
            <PieChart>
              {/* ✅ Gradient definitions */}
              <defs>
                <linearGradient id="gradPresent" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#6ee7b7" />
                  <stop offset="100%" stopColor="#047857" />
                </linearGradient>
                <linearGradient id="gradAbsent" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#fca5a5" />
                  <stop offset="100%" stopColor="#7f1d1d" />
                </linearGradient>
                <linearGradient id="gradLate" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#fde047" />
                  <stop offset="100%" stopColor="#78350f" />
                </linearGradient>
              </defs>

              {/* ✅ Rose chart style (radius based on value) */}
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={120}
                paddingAngle={4}
                cornerRadius={8}
                stroke="none"
                strokeWidth={2}
                label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`} 
                isAnimationActive={true}
                animationDuration={1000}
              >
                <Cell
                  fill="url(#gradPresent)"
                  style={{
                    cursor: "pointer",
                    transition: "all 0.3s ease-in-out",
                  }}
                  onMouseEnter={(e) =>
                    (e.target.style.filter =
                      "drop-shadow(0 6px 14px rgba(16,185,129,0.8))")
                  }
                  onMouseLeave={(e) => (e.target.style.filter = "none")}
                />

                <Cell
                  fill="url(#gradAbsent)"
                  style={{
                    cursor: "pointer",
                    transition: "all 0.3s ease-in-out",
                  }}
                  onMouseEnter={(e) =>
                    (e.target.style.filter =
                      "drop-shadow(0 6px 14px rgba(239,68,68,0.8))")
                  }
                  onMouseLeave={(e) => (e.target.style.filter = "none")}
                />

                <Cell
                  fill="url(#gradLate)"
                  style={{
                    cursor: "pointer",
                    transition: "all 0.3s ease-in-out",
                  }}
                  onMouseEnter={(e) =>
                    (e.target.style.filter =
                      "drop-shadow(0 6px 14px rgba(234,179,8,0.8))")
                  }
                  onMouseLeave={(e) => (e.target.style.filter = "none")}
                />
              </Pie>

              {/* ✅ Tooltip */}
              <Tooltip
                contentStyle={{
                  background: "rgba(17, 24, 39, 0.9)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: "10px",
                }}
                itemStyle={{ color: "#fff", fontWeight: 500 }}
              />

              {/* ✅ Legend with matching slice colors */}
              <Legend
                verticalAlign="bottom"
                align="center"
                iconType="circle"
                formatter={(value) => {
                  const colors = {
                    Present: "#34d399",
                    Absent: "#ef4444",
                    Late: "#facc15",
                  };
                  return (
                    <span style={{ color: colors[value] || "#d1d5db", fontSize: "0.9rem" }}>
                      {value}
                    </span>
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="p-6 rounded-xl border border-white/10 bg-neutral-900/60 shadow-lg">
          <h3 className="text-lg font-semibold text-emerald-400 mb-4">
            Per Student Breakdown
          </h3>
         <ResponsiveContainer width="100%" height={360}>
          <BarChart
            data={barData}
            barGap={8}
            barCategoryGap="15%"
          >
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
           <XAxis
              dataKey="name"
              interval={0}
              tick={({ x, y, payload }) => {
                const words = payload.value.split(" ");
                return (
                  <text x={x} y={y + 10} textAnchor="middle" fill="#d1d5db" fontSize={10}>
                    {words.map((word, index) => (
                      <tspan key={index} x={x} dy={index === 0 ? 0 : 12}>
                        {word}
                      </tspan>
                    ))}
                  </text>
                );
              }}
            />
            <YAxis stroke="#9ca3af" tick={{ fill: "#d1d5db", fontSize: 12 }} />

            {/* ✅ Glassy tooltip */}
            <Tooltip
              contentStyle={{
                background: "rgba(17, 24, 39, 0.85)", // glassy black
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: "10px",
                padding: "8px 12px",
              }}
              itemStyle={{ color: "#fff", fontWeight: 500 }}
            />

            {/* ✅ Gradient bars with labels + hover glow */}
            <Bar
              dataKey="Present"
              fill="url(#gradPresentBar)"
              radius={[6, 6, 0, 0]}
              animationDuration={1200}
              onMouseOver={(e) => (e.target.style.filter = "drop-shadow(0 4px 12px rgba(16,185,129,0.6))")}
              onMouseOut={(e) => (e.target.style.filter = "none")}
            >
              <LabelList dataKey="Present" position="top" fill="#34d399" fontSize={12} fontWeight="600" />
            </Bar>

            <Bar
              dataKey="Absent"
              fill="url(#gradAbsentBar)"
              radius={[6, 6, 0, 0]}
              animationDuration={1200}
              onMouseOver={(e) => (e.target.style.filter = "drop-shadow(0 4px 12px rgba(239,68,68,0.6))")}
              onMouseOut={(e) => (e.target.style.filter = "none")}
            >
              <LabelList dataKey="Absent" position="top" fill="#f87171" fontSize={12} fontWeight="600" />
            </Bar>

            <Bar
              dataKey="Late"
              fill="url(#gradLateBar)"
              radius={[6, 6, 0, 0]}
              animationDuration={1200}
              onMouseOver={(e) => (e.target.style.filter = "drop-shadow(0 4px 12px rgba(234,179,8,0.6))")}
              onMouseOut={(e) => (e.target.style.filter = "none")}
            >
              <LabelList dataKey="Late" position="top" fill="#fde047" fontSize={12} fontWeight="600" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        </div>
      </div>

      {/* Table */}
      {logs.length > 0 ? (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-hidden rounded-xl border border-white/10 shadow-lg">
            <table className="min-w-full text-sm text-left text-gray-300">
              <thead className="bg-gradient-to-r from-emerald-500/10 to-green-600/10 text-emerald-300">
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
                      className={`transition-all duration-300 ease-in-out transform cursor-pointer ${
                        index % 2 ? "bg-neutral-900/50" : "bg-neutral-800/50"
                      } hover:bg-emerald-600/20 hover:scale-[1.02] hover:shadow-lg rounded-lg`}
                    >
                      <td className="px-4 py-3 text-sm text-gray-300">{log.student_id}</td>
                      <td className="px-4 py-3 font-medium text-white whitespace-nowrap">
                        {`${log.first_name} ${log.last_name}`}
                      </td>
                      <td className="px-4 py-3 text-emerald-400 font-semibold">
                        {log.present}
                      </td>
                      <td className="px-4 py-3 text-red-400 font-semibold">{log.absent}</td>
                      <td className="px-4 py-3 text-yellow-400 font-semibold">{log.late}</td>
                      <td className="px-4 py-3 text-white">{log.total_attendances}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation(); 
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
                            );
                          }}
                          className="group relative flex items-center gap-1 text-sm text-emerald-400 
                                    transition-all duration-300 ease-in-out transform hover:scale-105"
                        >
                          <FaListUl className="text-base transition-colors duration-300 group-hover:text-emerald-300 drop-shadow-sm" />
                          <span className="relative">
                            View
                            {/* Underline animation */}
                            <span className="absolute left-0 -bottom-0.5 w-0 h-[2px] bg-emerald-400 transition-all duration-300 group-hover:w-full"></span>
                          </span>
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
            {logs
              .filter(
                (log) =>
                  statusFilter === "All" ||
                  log.statuses.some((s) => s.status === statusFilter)
              )
              .map((log, index) => (
                <StudentCard key={index} log={log} />
              ))}
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
