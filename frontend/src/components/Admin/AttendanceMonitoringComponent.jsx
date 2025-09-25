import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { FaDownload } from "react-icons/fa";
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
          ? ((stats.Present / stats.Total) * 100).toFixed(1) + "%"
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
    <div className="bg-neutral-900 p-8 rounded-2xl shadow-lg border border-neutral-700 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Attendance Monitoring</h2>
        <button
          onClick={exportToPDF}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium shadow"
        >
          <FaDownload /> Export PDF
        </button>
      </div>

      {/* Filters (with date range) */}
      <div className="grid grid-cols-1 sm:grid-cols-6 gap-4">
        {["course", "subject", "section", "instructor"].map((field) => (
          <select
            key={field}
            value={filters[field]}
            onChange={(e) => handleFilterChange(field, e.target.value)}
            className="px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm"
          >
            <option value="All">
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
              <option key={idx} value={item}>
                {item}
              </option>
            ))}
          </select>
        ))}

        <input
          type="date"
          value={filters.startDate}
          onChange={(e) => handleFilterChange("startDate", e.target.value)}
          className="px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm"
        />
        <input
          type="date"
          value={filters.endDate}
          onChange={(e) => handleFilterChange("endDate", e.target.value)}
          className="px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm"
        />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {["Present", "Absent", "Late"].map((status) => (
          <div
            key={status}
            className="bg-neutral-800 p-4 rounded-xl border border-neutral-700 text-center"
          >
            <p className="text-neutral-400 text-sm">{status}</p>
            <p
              className="text-2xl font-bold"
              style={{ color: COLORS[status] }}
            >
              {summary[status]}
            </p>
          </div>
        ))}
        <div className="bg-neutral-800 p-4 rounded-xl border border-neutral-700 text-center">
          <p className="text-neutral-400 text-sm">Attendance Rate</p>
          <p className="text-2xl font-bold text-blue-400">{attendanceRate}%</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="bg-neutral-800 p-4 rounded-xl border border-neutral-700">
          <h3 className="text-white font-semibold mb-4">Daily Attendance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis dataKey="date" stroke="#ccc" />
              <YAxis stroke="#ccc" />
              <Tooltip />
              <Legend />
              <Bar dataKey="Present" fill={COLORS.Present} />
              <Bar dataKey="Absent" fill={COLORS.Absent} />
              <Bar dataKey="Late" fill={COLORS.Late} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {/* Pie Chart */}
        <div className="bg-neutral-800 p-4 rounded-xl border border-neutral-700">
          <h3 className="text-white font-semibold mb-4">Attendance Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={pieData}
              cx="40%" // shifted left kasi nasa kanan ang legend
              cy="50%"
              innerRadius={70}
              outerRadius={120}
              paddingAngle={0}
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[entry.name]} />
              ))}
            </Pie>

            {/* Custom center text */}
            <text
              x="34%"
              y="48%"
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-3xl font-bold"
              fill="#ffffff"
            >
              {summary.Total}
            </text>
            <text
              x="34%"
              y="55%"
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-sm"
              fill="#ffffff"
            >
              {attendanceRate}%
            </text>

            <Legend
              layout="vertical"
              verticalAlign="middle"
              align="right"
              iconType="circle"
            />
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        </div>
      </div>

      {/* Line Chart */}
      <div className="bg-neutral-800 p-4 rounded-xl border border-neutral-700">
        <h3 className="text-white font-semibold mb-4">Attendance Trend</h3>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={dailyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis dataKey="date" stroke="#ccc" />
            <YAxis stroke="#ccc" />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="Present"
              stroke={COLORS.Present}
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="Absent"
              stroke={COLORS.Absent}
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="Late"
              stroke={COLORS.Late}
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Breakdown Selector */}
      <div>
        <label className="text-white mr-3">Breakdown View:</label>
        <select
          value={breakdownView}
          onChange={(e) => setBreakdownView(e.target.value)}
          className="px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm"
        >
          <option value="None">None</option>
          <option value="Student">By Student</option>
          <option value="Subject">By Subject</option>
          <option value="Course">By Course</option>
        </select>
      </div>

      {/* Breakdown Table */}
      {breakdownView !== "None" && (
        <div className="rounded-xl border border-neutral-700 overflow-hidden shadow-lg">
          <div className="hidden md:grid grid-cols-6 bg-neutral-800/80 text-neutral-200 font-semibold text-sm uppercase tracking-wide border-b border-neutral-700">
            <div className="px-4 py-3">{breakdownView}</div>
            <div className="px-4 py-3">Present</div>
            <div className="px-4 py-3">Absent</div>
            <div className="px-4 py-3">Late</div>
            <div className="px-4 py-3">Total</div>
            <div className="px-4 py-3 text-center">Rate</div>
          </div>
          {breakdownData.map((row, idx) => (
            <div
              key={idx}
              className="grid grid-cols-6 text-sm text-white border-b border-neutral-700 hover:bg-neutral-800/60"
            >
              <div className="px-4 py-3">{row.name}</div>
              <div className="px-4 py-3 text-green-400">{row.Present}</div>
              <div className="px-4 py-3 text-red-400">{row.Absent}</div>
              <div className="px-4 py-3 text-yellow-400">{row.Late}</div>
              <div className="px-4 py-3">{row.Total}</div>
              <div className="px-4 py-3 text-center font-bold">{row.Rate}</div>
            </div>
          ))}
        </div>
      )}

      {/* Raw Logs Table */}
      <div className="rounded-xl border border-neutral-700 overflow-hidden shadow-lg">
        <div className="hidden md:grid grid-cols-6 bg-neutral-800/80 text-neutral-200 font-semibold text-sm uppercase tracking-wide border-b border-neutral-700">
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
              className="grid grid-cols-6 text-sm text-white border-b border-neutral-700 hover:bg-neutral-800/60"
            >
              <div className="px-4 py-3">{log.student_id}</div>
              <div className="px-4 py-3">
                {log.first_name} {log.last_name}
              </div>
              <div className="px-4 py-3">{log.course}</div>
              <div className="px-4 py-3">{log.subject_code}</div>
              <div
                className={`px-4 py-3 font-semibold ${
                  log.status === "Present"
                    ? "text-green-400"
                    : log.status === "Absent"
                    ? "text-red-400"
                    : "text-yellow-400"
                }`}
              >
                {log.status}
              </div>
              <div className="px-4 py-3">
                {new Date(log.date).toLocaleDateString()}
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
  );
};

export default AttendanceMonitoringComponent;
