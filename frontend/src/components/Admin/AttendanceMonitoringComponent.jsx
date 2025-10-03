import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { FaDownload, FaUserCheck, FaCheckCircle, FaTimesCircle, FaClock, FaChartPie, FaChevronDown, FaChevronUp } from "react-icons/fa";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ResponsiveContainer,
  Label,
} from "recharts";

// ✅ Colors for statuses
const COLORS = {
  Present: "#22c55e", // green
  Absent: "#ef4444", // red
  Late: "#facc15",   // yellow
};

const AttendanceMonitoringComponent = () => {
  const [logs, setLogs] = useState([]);
  const [classes, setClasses] = useState([]);
  const [filters, setFilters] = useState({
    course: "All",
    subject: "All",
    section: "All",
    instructor: "All",
    startDate: "",
    endDate: "",
  });
  const [breakdownView, setBreakdownView] = useState("None");
  const [loading, setLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState({});

  const toggleRow = (idx) => {
    setExpandedRows((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  useEffect(() => {
    fetchClasses();
    fetchLogs();
  }, []);

  useEffect(() => {
    fetchClasses();
    fetchLogs();
  }, []);

  const fetchClasses = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/classes", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setClasses(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error("❌ Failed to load classes");
    }
  };

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/attendance/logs", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLogs(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error("❌ Failed to load attendance logs");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  // ✅ Apply filters with date range
  const filteredLogs = logs.filter((log) => {
    const courseMatch = filters.course === "All" || log.course === filters.course;
    const subjectMatch = filters.subject === "All" || log.subject_code === filters.subject;
    const sectionMatch = filters.section === "All" || log.section === filters.section;
    const instructorMatch =
      filters.instructor === "All" || log.instructor_name === filters.instructor;

    const logDate = new Date(log.date);
    const startDateMatch =
      !filters.startDate || logDate >= new Date(filters.startDate);
    const endDateMatch =
      !filters.endDate || logDate <= new Date(filters.endDate);

    return (
      courseMatch &&
      subjectMatch &&
      sectionMatch &&
      instructorMatch &&
      startDateMatch &&
      endDateMatch
    );
  });

  // ✅ Dropdown options
  const uniqueCourses = [...new Set(classes.map((c) => c.course?.trim()).filter(Boolean))].sort();
  const uniqueSubjects = [...new Set(classes.map((c) => c.subject_code?.trim()).filter(Boolean))].sort();
  const uniqueSections = [...new Set(classes.map((c) => c.section?.trim()).filter(Boolean))].sort();
  const uniqueInstructors = [
    ...new Set(
      classes
        .map((c) => {
          const first = (c.instructor_first_name || "").trim();
          const last = (c.instructor_last_name || "").trim();
          const fullName = `${first} ${last}`.trim();
          if (!fullName || fullName === "N/A" || fullName === "N/A N/A") return null;
          return fullName;
        })
        .filter(Boolean)
    ),
  ].sort();

  // ✅ Summary
  const summary = filteredLogs.reduce(
    (acc, log) => {
      acc[log.status] = (acc[log.status] || 0) + 1;
      acc.Total++;
      return acc;
    },
    { Present: 0, Absent: 0, Late: 0, Total: 0 }
  );
  const attendanceRate =
  summary.Total > 0
    ? (((summary.Present + summary.Late) / summary.Total) * 100).toFixed(1)
    : 0;

  // ✅ Daily data for charts
  const dailyData = Object.values(
    filteredLogs.reduce((acc, log) => {
      const day = new Date(log.date).toLocaleDateString();
      if (!acc[day]) acc[day] = { date: day, Present: 0, Absent: 0, Late: 0 };
      acc[day][log.status] = (acc[day][log.status] || 0) + 1;
      return acc;
    }, {})
  ).sort((a, b) => new Date(a.date) - new Date(b.date));

  // ✅ Pie chart data
  const pieData = [
    { name: "Present", value: summary.Present },
    { name: "Absent", value: summary.Absent },
    { name: "Late", value: summary.Late },
  ];

  // ✅ Breakdown calculation
  const calculateBreakdown = (groupBy) => {
  const summary = {};
  filteredLogs.forEach((log) => {
    let key = "";
    if (groupBy === "Student")
      key = `${log.student_id} - ${log.first_name} ${log.last_name}`;
    if (groupBy === "Subject")
      key = `${log.subject_code} - ${log.subject_title}`;
    if (groupBy === "Course") key = log.course;

    if (!summary[key]) summary[key] = { Present: 0, Absent: 0, Late: 0, Total: 0 };
    summary[key][log.status] = (summary[key][log.status] || 0) + 1;
    summary[key].Total += 1;
  });

  return Object.entries(summary).map(([name, stats]) => ({
    name,
    ...stats,
    Rate:
      stats.Total > 0
        ? (((stats.Present + stats.Late) / stats.Total) * 100).toFixed(1) + "%"
        : "0%",
  }));
};

  const breakdownData =
    breakdownView !== "None" ? calculateBreakdown(breakdownView) : [];

  // ✅ Export PDF
  const exportToPDF = () => {
    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.addImage("/ccit-logo.png", "PNG", 15, 10, 25, 25);
    doc.addImage("/prmsu.png", "PNG", pageWidth - 40, 10, 25, 25);

    doc.setFont("times", "bold");
    doc.setFontSize(14);
    doc.text("Republic of the Philippines", pageWidth / 2, 18, {
      align: "center",
    });
    doc.text("President Ramon Magsaysay State University", pageWidth / 2, 25, {
      align: "center",
    });

    doc.setFont("times", "italic");
    doc.setFontSize(11);
    doc.text("(Ramon Magsaysay Technological University)", pageWidth / 2, 32, {
      align: "center",
    });
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

    autoTable(doc, {
      startY: 65,
      head: [["Student ID", "Name", "Course", "Subject", "Status", "Date"]],
      body: filteredLogs.map((log) => [
        log.student_id,
        `${log.first_name} ${log.last_name}`,
        log.course,
        `${log.subject_code} - ${log.subject_title}`,
        log.status,
        new Date(log.date).toLocaleDateString(),
      ]),
    });

    doc.save("attendance_report.pdf");
  };

  return (
    <div className="bg-neutral-950 p-8 rounded-2xl shadow-lg max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        {/* Title with Icon */}
        <h2 className="text-3xl font-extrabold flex items-center gap-2 bg-gradient-to-r from-emerald-400 to-green-600 bg-clip-text text-transparent">
            <FaUserCheck className="text-emerald-400" /> Attendance Monitoring
        </h2>

        {/* Export Button */}
        <button
          onClick={exportToPDF}
          className="flex items-center gap-2 px-5 py-2.5 
                    bg-gradient-to-r from-emerald-500 to-green-600 
                    hover:from-emerald-600 hover:to-green-700
                    text-white rounded-lg text-sm sm:text-base font-semibold 
                    shadow-md hover:shadow-lg hover:shadow-emerald-500/30
                    transform hover:scale-105 transition-all duration-200"
        >
          <FaDownload className="text-sm sm:text-base" /> Export PDF
        </button>
      </div>


      {/* Filters (with date range) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {["course", "subject", "section", "instructor"].map((field) => (
          <div key={field} className="relative">
            <select
              value={filters[field]}
              onChange={(e) => handleFilterChange(field, e.target.value)}
              className="w-full px-4 py-2.5 
                        bg-gradient-to-br from-neutral-800 to-neutral-900 
                        border border-neutral-700 
                        rounded-lg text-white text-sm appearance-none
                        focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400
                        shadow-sm hover:shadow-md hover:shadow-emerald-500/10
                        transition duration-200"
            >
              <option value="All" className="bg-neutral-900 text-white">
                All {field.charAt(0).toUpperCase() + field.slice(1)}s
              </option>
              {(field === "course"
                ? uniqueCourses
                : field === "subject"
                ? uniqueSubjects
                : field === "section"
                ? uniqueSections
                : uniqueInstructors
              ).map((item, idx) => (
                <option key={idx} value={item} className="bg-neutral-900 text-white">
                  {item}
                </option>
              ))}
            </select>
            {/* Dropdown Arrow */}
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
              ▼
            </span>
          </div>
        ))}

        {/* Start Date */}
        <div>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => handleFilterChange("startDate", e.target.value)}
            className="w-full px-4 py-2.5 
                      bg-gradient-to-br from-neutral-800 to-neutral-900 
                      border border-neutral-700 
                      rounded-lg text-white text-sm
                      focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400
                      shadow-sm hover:shadow-md hover:shadow-emerald-500/10
                      transition duration-200 [color-scheme:dark]"
          />
        </div>

        {/* End Date */}
        <div>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => handleFilterChange("endDate", e.target.value)}
            className="w-full px-4 py-2.5 
                      bg-gradient-to-br from-neutral-800 to-neutral-900 
                      border border-neutral-700 
                      rounded-lg text-white text-sm
                      focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400
                      shadow-sm hover:shadow-md hover:shadow-emerald-500/10
                      transition duration-200 [color-scheme:dark]"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Status Cards */}
        {[
          { 
            label: "Present", 
            color: "from-emerald-500/30 via-emerald-600/20 to-green-700/30", 
            text: "text-emerald-400", 
            icon: <FaCheckCircle className="text-emerald-400 text-xl" />, 
            glow: "hover:shadow-emerald-500/50" 
          },
          { 
            label: "Absent", 
            color: "from-red-500/30 via-red-600/20 to-rose-800/30", 
            text: "text-red-400", 
            icon: <FaTimesCircle className="text-red-400 text-xl" />, 
            glow: "hover:shadow-red-500/50" 
          },
          { 
            label: "Late", 
            color: "from-yellow-400/30 via-amber-500/20 to-orange-600/30", 
            text: "text-yellow-400", 
            icon: <FaClock className="text-yellow-400 text-xl" />, 
            glow: "hover:shadow-yellow-400/50" 
          },
        ].map(({ label, color, text, icon, glow }) => (
          <div
            key={label}
            className={`p-5 rounded-2xl border border-neutral-700 text-center 
                        bg-gradient-to-br ${color} backdrop-blur-sm
                        transition-all duration-300 transform hover:scale-105 
                        hover:shadow-lg ${glow}`}
          >
            <div className="flex justify-center mb-2">{icon}</div>
            <p className="text-neutral-400 text-sm font-medium">{label}</p>
            <p className={`text-3xl font-extrabold ${text}`}>{summary[label]}</p>
          </div>
        ))}

        {/* Attendance Rate */}
        {(() => {
          let gradient = "";
          let textColor = "";

          if (attendanceRate <= 50) {
            gradient = "from-red-500/30 via-red-600/20 to-rose-700/30";
            textColor = "text-red-400";
          } else if (attendanceRate < 80) {
            gradient = "from-yellow-400/30 via-amber-500/20 to-orange-600/30";
            textColor = "text-yellow-400";
          } else {
            gradient = "from-emerald-500/30 via-emerald-600/20 to-green-700/30";
            textColor = "text-emerald-400";
          }

          return (
            <div
              className={`p-5 rounded-2xl border border-neutral-700 text-center 
                          bg-gradient-to-br ${gradient} backdrop-blur-sm
                          transition-all duration-300 transform hover:scale-105 
                          hover:shadow-lg hover:shadow-${textColor.split("-")[1]}-500/40`}
            >
              <div className="flex justify-center mb-2">
                <FaChartPie className={`${textColor} text-xl`} />
              </div>
              <p className="text-neutral-400 text-sm font-medium">Attendance Rate</p>
              <p className={`text-3xl font-extrabold ${textColor}`}>
                {attendanceRate}%
              </p>
            </div>
          );
        })()}
      </div>



      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="bg-gradient-to-br from-neutral-900/90 to-neutral-950/90 p-6 rounded-2xl border border-neutral-700 shadow-lg">
          <h3 className="text-lg font-extrabold text-white mb-4 flex items-center gap-2">
            Daily Attendance
          </h3>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dailyData} barSize={40}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.3} />

              {/* ✅ Fix overlapping dates */}
              <XAxis
                dataKey="date"
                stroke="#aaa"
                angle={-30}
                textAnchor="end"
                interval={0}
                height={60}
              />
              <YAxis stroke="#aaa" />

              {/* ✅ Custom tooltip */}
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                  color: "#fff",
                }}
                cursor={{ fill: "rgba(255,255,255,0.05)" }}
              />
              <Legend wrapperStyle={{ color: "#ccc" }} />

              {/* ✅ Gradient Definitions */}
              <defs>
                <linearGradient id="presentGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#34d399" stopOpacity={0.9} />
                  <stop offset="95%" stopColor="#059669" stopOpacity={0.8} />
                </linearGradient>
                <linearGradient id="absentGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f87171" stopOpacity={0.9} />
                  <stop offset="95%" stopColor="#b91c1c" stopOpacity={0.8} />
                </linearGradient>
                <linearGradient id="lateGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.9} />
                  <stop offset="95%" stopColor="#b45309" stopOpacity={0.8} />
                </linearGradient>
              </defs>

              {/* ✅ Bars with hover animation */}
              <Bar
                dataKey="Present"
                fill="url(#presentGradient)"
                radius={[6, 6, 0, 0]}
                className="transition-all duration-300 hover:opacity-80"
              />
              <Bar
                dataKey="Absent"
                fill="url(#absentGradient)"
                radius={[6, 6, 0, 0]}
                className="transition-all duration-300 hover:opacity-80"
              />
              <Bar
                dataKey="Late"
                fill="url(#lateGradient)"
                radius={[6, 6, 0, 0]}
                className="transition-all duration-300 hover:opacity-80"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {/* Pie Chart */}
        <div className="bg-gradient-to-br from-neutral-900/90 to-neutral-950/90 p-6 rounded-2xl border border-neutral-700 shadow-lg">
          <h3 className="text-lg font-extrabold text-white mb-4 flex items-center gap-2">
            Attendance Distribution
          </h3>

          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              {/* ✅ Gradient definitions */}
              <defs>
                <linearGradient id="presentGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#34d399" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#059669" stopOpacity={0.9} />
                </linearGradient>
                <linearGradient id="absentGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#f87171" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#b91c1c" stopOpacity={0.9} />
                </linearGradient>
                <linearGradient id="lateGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#b45309" stopOpacity={0.9} />
                </linearGradient>
              </defs>

              {/* ✅ Pie with glow hover and neutral labels */}
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={120}
                paddingAngle={0}
                dataKey="value"
                stroke="none"
                isAnimationActive={true}
                label={({ name, value, percent }) => {
                  const percentage = (percent * 100).toFixed(1);
                  return `${name}: ${value} (${percentage}%)`;
                }}
                labelStyle={{
                  fill: "#e5e7eb", // neutral gray/white
                  fontWeight: "600",
                  fontSize: "0.8rem",
                }}
                labelLine={false}
              >
                {pieData.map((entry, idx) => {
                  const glow =
                    entry.name === "Present"
                      ? "drop-shadow(0 0 8px rgba(52,211,153,0.8))" // emerald
                      : entry.name === "Absent"
                      ? "drop-shadow(0 0 8px rgba(248,113,113,0.8))" // red
                      : "drop-shadow(0 0 8px rgba(251,191,36,0.8))"; // amber

                  return (
                    <Cell
                      key={`cell-${idx}`}
                      fill={
                        entry.name === "Present"
                          ? "url(#presentGrad)"
                          : entry.name === "Absent"
                          ? "url(#absentGrad)"
                          : "url(#lateGrad)"
                      }
                      style={{
                        filter: "none",
                        transition: "filter 0.3s ease",
                      }}
                      className="cursor-pointer"
                      onMouseEnter={(e) => (e.target.style.filter = glow)}
                      onMouseLeave={(e) => (e.target.style.filter = "none")}
                    />
                  );
                })}
              </Pie>


              {/* ✅ Tooltip */}
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                  color: "#fff",
                }}
                cursor={{ fill: "rgba(255,255,255,0.05)" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Line Chart */}
      <div className="bg-gradient-to-br from-neutral-900/90 to-neutral-950/90 p-6 rounded-2xl border border-neutral-700 shadow-lg">
        <h3 className="text-lg font-extrabold text-white mb-4 flex items-center gap-2">
          Attendance Trend
        </h3>

        <ResponsiveContainer width="100%" height={350}>
          <LineChart
            data={dailyData}
            margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
          >
            {/* ✅ Subtle Grid */}
            <CartesianGrid strokeDasharray="4 4" stroke="#374151" opacity={0.3} />

            {/* ✅ Axis Styling */}
            <XAxis
              dataKey="date"
              stroke="#9ca3af"
              tick={{ fontSize: 12 }}
              tickMargin={10}
              interval="preserveStartEnd"
            />
            <YAxis
              stroke="#9ca3af"
              tick={{ fontSize: 12 }}
              tickMargin={10}
            />

            {/* ✅ Tooltip Styled */}
            <Tooltip
              contentStyle={{
                backgroundColor: "#111827",
                border: "1px solid #374151",
                borderRadius: "10px",
                color: "#fff",
                fontSize: "0.85rem",
                boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
              }}
              cursor={{ stroke: "rgba(255,255,255,0.2)", strokeWidth: 2 }}
            />

            {/* ✅ Legend Styled */}
            <Legend
              wrapperStyle={{
                paddingTop: "10px",
                fontSize: "0.8rem",
                color: "#d1d5db",
              }}
            />

            {/* ✅ Gradient Definitions with smoother shades */}
            <defs>
              {/* Present (Green) */}
              <linearGradient id="presentGradTrend" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#34d399" stopOpacity={1} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0.7} />
              </linearGradient>

              {/* Absent (Red) */}
              <linearGradient id="absentGradTrend" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#f87171" stopOpacity={1} />
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0.7} />
              </linearGradient>

              {/* Late (Amber/Yellow) */}
              <linearGradient id="lateGradTrend" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#fbbf24" stopOpacity={1} />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.7} />
              </linearGradient>
            </defs>

            {/* Lines */}
            <Line
              type="monotone"
              dataKey="Present"
              stroke="url(#presentGradTrend)"
              strokeWidth={3}
              dot={{ r: 4, stroke: "#34d399", strokeWidth: 2, fill: "#111827" }}
              activeDot={{ r: 6, stroke: "#34d399", strokeWidth: 2, fill: "#111827" }}
            />
            <Line
              type="monotone"
              dataKey="Absent"
              stroke="url(#absentGradTrend)"
              strokeWidth={3}
              dot={{ r: 4, stroke: "#f87171", strokeWidth: 2, fill: "#111827" }}
              activeDot={{ r: 6, stroke: "#f87171", strokeWidth: 2, fill: "#111827" }}
            />
            <Line
              type="monotone"
              dataKey="Late"
              stroke="url(#lateGradTrend)"
              strokeWidth={3}
              dot={{ r: 4, stroke: "#fbbf24", strokeWidth: 2, fill: "#111827" }}
              activeDot={{ r: 6, stroke: "#fbbf24", strokeWidth: 2, fill: "#111827" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>


      {/* Breakdown Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-6">
        <label className="text-sm font-medium text-neutral-300">
          Breakdown View:
        </label>
        <div className="relative w-full sm:w-64">
          <select
            value={breakdownView}
            onChange={(e) => setBreakdownView(e.target.value)}
            className="w-full px-4 py-2.5
                      bg-gradient-to-br from-neutral-800 via-neutral-900 to-black
                      border border-neutral-700 rounded-lg 
                      text-white text-sm appearance-none
                      focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400
                      shadow-sm hover:shadow-md hover:shadow-emerald-500/10
                      transition duration-200"
          >
            <option value="None" className="bg-neutral-900 text-white">None</option>
            <option value="Student" className="bg-neutral-900 text-white">By Student</option>
            <option value="Subject" className="bg-neutral-900 text-white">By Subject</option>
            <option value="Course" className="bg-neutral-900 text-white">By Course</option>
          </select>

          {/* Custom dropdown arrow */}
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
            ▼
          </span>
        </div>
      </div>

    {/* Breakdown Table */}
    {breakdownView !== "None" && (
      <div className="rounded-xl border border-neutral-700 overflow-hidden shadow-lg mt-6">
        {/* Header (desktop only) */}
        <div className="hidden md:grid grid-cols-6 bg-gradient-to-r from-emerald-500/10 to-green-600/10 
                        text-green-300 font-semibold text-xs uppercase tracking-wide border-b border-neutral-700">
          <div className="px-4 py-3">{breakdownView}</div>
          <div className="px-4 py-3">Present</div>
          <div className="px-4 py-3">Absent</div>
          <div className="px-4 py-3">Late</div>
          <div className="px-4 py-3">Total</div>
          <div className="px-4 py-3 text-center">Rate</div>
        </div>

        {/* Rows */}
        {breakdownData.map((row, idx) => {
          const rateValue = parseFloat(row.Rate.toString().replace("%", "")) || 0;

          let rateColor =
            rateValue >= 80
              ? "bg-gradient-to-r from-emerald-500/30 to-green-600/30 text-emerald-300 border border-emerald-500/40"
              : rateValue >= 50
              ? "bg-gradient-to-r from-amber-400/30 to-orange-600/30 text-amber-300 border border-amber-500/40"
              : "bg-gradient-to-r from-red-500/30 to-rose-700/30 text-red-300 border border-red-500/40";

          return (
            <div
              key={idx}
              className={`grid md:grid-cols-6 text-sm 
                          border-b border-neutral-700 
                          transition duration-300
                          ${idx % 2 === 0 ? "bg-neutral-900/40" : "bg-neutral-800/40"}
                          hover:bg-gradient-to-r hover:from-emerald-500/10 hover:to-green-600/10 
                          hover:shadow-lg hover:shadow-emerald-500/20`}
            >
              {/* ✅ Desktop Row */}
              <div className="hidden md:contents text-white">
                <div className="px-4 py-3">{row.name}</div>
                <div className="px-4 py-3 text-green-400 font-medium">{row.Present}</div>
                <div className="px-4 py-3 text-red-400 font-medium">{row.Absent}</div>
                <div className="px-4 py-3 text-yellow-400 font-medium">{row.Late}</div>
                <div className="px-4 py-3 font-medium">{row.Total}</div>
                <div className="px-4 py-3 flex justify-center">
                  <span
                    className={`inline-flex items-center justify-center 
                                min-w-[70px] h-8 px-3 rounded-full text-xs font-bold ${rateColor}`}
                  >
                    {row.Rate}
                  </span>
                </div>
              </div>

              {/* ✅ Mobile Card (dropdown style) */}
              <div className="md:hidden p-3 text-sm text-neutral-300">
                <div className="grid grid-cols-[1fr_auto_auto] items-center gap-2">
                  {/* Main Info */}
                  <div>
                    <p className="font-semibold text-white truncate">{row.name}</p>
                  </div>

                  {/* Rate Badge */}
                  <span
                    className={`inline-flex items-center justify-center 
                                min-w-[70px] h-6 px-2 rounded-full text-xs font-bold ${rateColor}`}
                  >
                    {row.Rate}
                  </span>

                  {/* Toggle Button */}
                  <button
                    onClick={() => toggleRow(idx)}
                    className="text-neutral-400 hover:text-emerald-400 transition"
                  >
                    {expandedRows[idx] ? <FaChevronUp /> : <FaChevronDown />}
                  </button>
                </div>

                {/* Expanded Section */}
                {expandedRows[idx] && (
                <div className="mt-3 border-t border-neutral-700 pt-2 text-xs text-neutral-400 space-y-1">
                  <p>
                    <span className="font-semibold text-neutral-300">Present:</span>{" "}
                    <span className="text-green-400 font-medium">{row.Present}</span>
                  </p>
                  <p>
                    <span className="font-semibold text-neutral-300">Absent:</span>{" "}
                    <span className="text-red-400 font-medium">{row.Absent}</span>
                  </p>
                  <p>
                    <span className="font-semibold text-neutral-300">Late:</span>{" "}
                    <span className="text-yellow-400 font-medium">{row.Late}</span>
                  </p>
                  <p>
                    <span className="font-semibold text-neutral-300">Total:</span>{" "}
                    <span className="text-white font-medium">{row.Total}</span>
                  </p>
                </div>
              )}
              </div>
            </div>
          );
        })}
      </div>
    )}

      {/* ✅ Raw Logs Section */}
      <div className="mt-10">
        {/* Section Header */}
        <h3 className="text-lg md:text-xl font-extrabold mb-4 
                      text-white
                      bg-clip-text flex items-center gap-2">
               Attendance Raw Logs
        </h3>

        {/* ✅ Raw Logs Table (Enhanced) */}
        <div className="rounded-xl border border-neutral-700 overflow-hidden shadow-lg">
          {/* Header (desktop only) */}
          <div className="hidden md:grid grid-cols-6 bg-gradient-to-r from-emerald-500/10 to-green-600/10 
                          text-emerald-300 font-semibold text-xs uppercase tracking-wide border-b border-neutral-700">
            <div className="px-4 py-3">Student ID</div>
            <div className="px-4 py-3">Name</div>
            <div className="px-4 py-3">Course</div>
            <div className="px-4 py-3">Subject</div>
            <div className="px-4 py-3">Status</div>
            <div className="px-4 py-3">Date</div>
          </div>

          {loading ? (
            <div className="px-4 py-6 text-center text-neutral-400 italic">
              Loading logs...
            </div>
          ) : filteredLogs.length > 0 ? (
            filteredLogs.map((log, idx) => (
              <div
                key={idx}
                className={`border-b border-neutral-700 
                            ${idx % 2 === 0 ? "bg-neutral-900/40" : "bg-neutral-800/40"}
                            hover:bg-gradient-to-r hover:from-emerald-500/10 hover:to-green-600/10 
                            transition duration-300`}
              >
                {/* Desktop Row */}
                <div className="hidden md:grid grid-cols-6 text-sm text-white">
                  <div className="px-4 py-3">{log.student_id}</div>
                  <div className="px-4 py-3">{log.first_name} {log.last_name}</div>
                  <div className="px-4 py-3">{log.course}</div>
                  <div className="px-4 py-3">{log.subject_code}</div>
                  <div className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-bold
                        ${
                          log.status === "Present"
                            ? "bg-gradient-to-r from-emerald-500/20 to-green-600/20 text-emerald-400"
                            : log.status === "Absent"
                            ? "bg-gradient-to-r from-red-500/20 to-rose-700/20 text-red-400"
                            : "bg-gradient-to-r from-amber-400/20 to-orange-600/20 text-amber-400"
                        }`}
                    >
                      {log.status}
                    </span>
                  </div>
                  <div className="px-4 py-3 text-neutral-400">
                    {new Date(log.date).toLocaleDateString()}
                  </div>
                </div>

                {/* Mobile Card (Compact + Expandable) */}
                <div className="md:hidden p-3 text-sm text-neutral-300">
                  <div className="grid grid-cols-[1fr_auto_auto] items-center gap-2">
                    {/* Main Info */}
                    <div>
                      <p className="text-xs text-neutral-400">ID: {log.student_id}</p>
                      <p className="font-semibold text-white truncate">
                        {log.first_name} {log.last_name}
                      </p>
                    </div>

                    {/* Status (always aligned) */}
                    <span
                      className={`inline-flex items-center justify-center 
                                  min-w-[70px] h-6 px-2 rounded-full text-xs font-bold
                                  ${
                                    log.status === "Present"
                                      ? "bg-gradient-to-r from-emerald-500/20 to-green-600/20 text-emerald-400"
                                      : log.status === "Absent"
                                      ? "bg-gradient-to-r from-red-500/20 to-rose-700/20 text-red-400"
                                      : "bg-gradient-to-r from-amber-400/20 to-orange-600/20 text-amber-400"
                                  }`}
                    >
                      {log.status}
                    </span>

                    {/* Toggle Button */}
                    <button
                      onClick={() => toggleRow(idx)}
                      className="text-neutral-400 hover:text-emerald-400 transition"
                    >
                      {expandedRows[idx] ? <FaChevronUp /> : <FaChevronDown />}
                    </button>
                  </div>

                  {/* Expanded Section */}
                  {expandedRows[idx] && (
                    <div className="mt-3 border-t border-neutral-700 pt-2 text-xs text-neutral-400 space-y-1">
                      <p><span className="font-semibold text-neutral-300">Course:</span> {log.course}</p>
                      <p><span className="font-semibold text-neutral-300">Subject:</span> {log.subject_code}</p>
                      <p><span className="font-semibold text-neutral-300">Date:</span> {new Date(log.date).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="px-4 py-6 text-center text-neutral-400 italic">
              No attendance logs found
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttendanceMonitoringComponent;
