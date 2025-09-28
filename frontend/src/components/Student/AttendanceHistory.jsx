import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAttendanceLogsByStudent } from "../../services/api";
import { toast } from "react-toastify";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaDownload,
  FaEye,
  FaChartPie,
} from "react-icons/fa";
import SubjectLogsModal from "./SubjectsLogsModal";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Sector,
  LabelList,
} from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Gradients for fill
const COLORS = ["url(#gradGreen)", "url(#gradRed)", "url(#gradYellow)"];

// Solid colors for glow
const GLOW_COLORS = {
  Present: "#22c55e",
  Absent: "#ef4444",
  Late: "#facc15",
};

const renderActiveShape = (props) => {
  const RADIAN = Math.PI / 180;
  const {
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    fill,
    payload,
  } = props;

  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);

  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 20) * cos;
  const my = cy + (outerRadius + 20) * sin;
  const ex = mx + (cos >= 0 ? 20 : -20);
  const ey = my;

  // ✅ Glow color based on status
  const glowColor = GLOW_COLORS[payload.name] || "#fff";

  return (
    <g>
      {/* Expanded slice with glow */}
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        stroke="#fff"
        strokeWidth={2}
        style={{
          filter: `drop-shadow(0px 0px 10px ${glowColor})`,
          transition: "all 0.3s ease",
        }}
      />

      {/* Connector line */}
      <path
        d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`}
        stroke={glowColor}
        fill="none"
        strokeWidth={2}
      />
      <circle cx={ex} cy={ey} r={4} fill={glowColor} stroke="white" strokeWidth={1.5} />
    </g>
  );
};

const AttendanceHistory = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [subjectBreakdown, setSubjectBreakdown] = useState([]);
  const [summary, setSummary] = useState({
    totalSessions: 0,
    present: 0,
    absent: 0,
    late: 0,
    attendanceRate: 0,
  });
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [showPercentages, setShowPercentages] = useState(true);

  const userData = localStorage.getItem("userData");
  const student = userData ? JSON.parse(userData) : null;
  const studentId = student?.student_id;

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const exportToPDF = () => {
    if (subjectBreakdown.length === 0) {
      toast.info("⚠ No attendance records to export.");
      return;
    }

    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.addImage("/ccit-logo.png", "PNG", 15, 10, 25, 25);
    doc.addImage("/prmsu.png", "PNG", pageWidth - 40, 10, 25, 25);
    doc.setFont("times", "bold");
    doc.setFontSize(14);
    doc.text("President Ramon Magsaysay State University", pageWidth / 2, 25, {
      align: "center",
    });
    doc.setFontSize(12);
    doc.text("STUDENT ATTENDANCE HISTORY", pageWidth / 2, 40, { align: "center" });

    doc.setFontSize(10);
    doc.text(`Student: ${student.first_name} ${student.last_name}`, 20, 55);
    doc.text(`Student ID: ${student.student_id}`, 20, 62);
    doc.text(`Date Generated: ${formatDate(new Date().toISOString())}`, 20, 69);

    autoTable(doc, {
      startY: 80,
      head: [["Subject", "Present", "Absent", "Late", "Total"]],
      body: subjectBreakdown.map((s) => [
        `${s.subject_code || ""} ${s.subject_title || "—"}`,
        s.present,
        s.absent,
        s.late,
        s.total,
      ]),
      styles: { font: "helvetica", fontSize: 10 },
      headStyles: { fillColor: [34, 197, 94] },
    });

    doc.save(`attendance_history_${studentId}.pdf`);
  };

  useEffect(() => {
    if (!studentId) {
      toast.error("Student not logged in.");
      navigate("/student/login");
      return;
    }

    const fetchLogs = async () => {
      try {
        const data = await getAttendanceLogsByStudent(studentId);
        const logsData = data.logs || [];
        setLogs(logsData);

        const breakdown = {};
        let present = 0,
          absent = 0,
          late = 0;

        logsData.forEach((log) => {
          const key = log.subject_code || log.subject_title;
          if (!breakdown[key]) {
            breakdown[key] = {
              subject_code: log.subject_code,
              subject_title: log.subject_title,
              present: 0,
              absent: 0,
              late: 0,
              total: 0,
            };
          }
          breakdown[key].total += 1;
          if (log.status === "Present") {
            breakdown[key].present += 1;
            present++;
          } else if (log.status === "Absent") {
            breakdown[key].absent += 1;
            absent++;
          } else if (log.status === "Late") {
            breakdown[key].late += 1;
            late++;
          }
        });

        const totalSessions = logsData.length;
        const attended = present + late;
        const attendanceRate =
          totalSessions > 0 ? Math.round((attended / totalSessions) * 100) : 0;

        setSubjectBreakdown(Object.values(breakdown));
        setSummary({ totalSessions, present, absent, late, attendanceRate });
      } catch (err) {
        console.error("Fetch error:", err);
        toast.error("Failed to load attendance logs.");
      }
    };

    fetchLogs();
  }, [studentId, navigate]);

  const pieData = [
    { name: "Present", value: summary.present },
    { name: "Absent", value: summary.absent },
    { name: "Late", value: summary.late },
  ];

  const barData = subjectBreakdown.map((s) => {
  const total = (s.present ?? 0) + (s.absent ?? 0) + (s.late ?? 0);

  return {
    name: s.subject_code || s.subject_title,
    Present: s.present,
    Absent: s.absent,
    Late: s.late,
    PresentPct: total ? Math.round((s.present / total) * 100) : 0,
    AbsentPct: total ? Math.round((s.absent / total) * 100) : 0,
    LatePct: total ? Math.round((s.late / total) * 100) : 0,
  };
});


  return (
    <div className="bg-neutral-950 p-6 sm:p-8 rounded-2xl shadow-xl border border-white/10 max-w-7xl mx-auto text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <h2 className="text-3xl font-extrabold bg-gradient-to-r from-emerald-400 to-green-600 bg-clip-text text-transparent">
          Attendance History
        </h2>
        {subjectBreakdown.length > 0 && (
          <button
            onClick={exportToPDF}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 px-4 py-2 rounded-lg shadow-md text-white transition-all duration-300 hover:scale-[1.03]"
          >
            <FaDownload /> Export PDF
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
        {[
          {
            label: "Total Sessions",
            value: summary.totalSessions,
            gradient: "from-slate-500/30 via-gray-700/20 to-slate-900/30",
            text: "text-white",
            glow: "hover:shadow-gray-400/40",
          },
          {
            label: "Present",
            value: summary.present,
            gradient: "from-emerald-500/30 via-emerald-600/20 to-green-700/30",
            text: "text-emerald-400",
            icon: <FaCheckCircle className="text-emerald-400" />,
            glow: "hover:shadow-emerald-500/50",
          },
          {
            label: "Absent",
            value: summary.absent,
            gradient: "from-red-500/30 via-red-600/20 to-rose-800/30",
            text: "text-red-400",
            icon: <FaTimesCircle className="text-red-400" />,
            glow: "hover:shadow-red-500/50",
          },
          {
            label: "Late",
            value: summary.late,
            gradient: "from-yellow-400/30 via-amber-500/20 to-orange-600/30",
            text: "text-yellow-400",
            icon: <FaClock className="text-yellow-400" />,
            glow: "hover:shadow-yellow-400/50",
          },
        ].map((card, idx) => (
          <div
            key={idx}
            className={`relative overflow-hidden p-5 rounded-2xl text-center border border-white/10
                        bg-gradient-to-br ${card.gradient} backdrop-blur-md
                        shadow-lg transition-all duration-500 ease-out
                        hover:scale-[1.05] ${card.glow}`}
          >
            <div className="absolute inset-0 bg-white/5 rounded-2xl blur-2xl opacity-20 pointer-events-none" />
            <p className="text-gray-300 flex items-center gap-2 justify-center relative z-10 font-medium">
              {card.icon} {card.label}
            </p>
            <p className={`text-3xl font-extrabold ${card.text} mt-2 relative z-10`}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Attendance Rate Progress */}
      <div className="mb-12">
        <p className="text-gray-400 text-sm mb-2 font-medium tracking-wide">
          Attendance Rate
        </p>

        <div className="relative w-full h-5 bg-neutral-800/60 rounded-full shadow-inner border border-white/10 backdrop-blur-sm">
          {/* Gradient progress bar */}
          <div
            className={`h-full rounded-full transition-all duration-700 ease-in-out 
              ${summary.attendanceRate < 50
                ? "bg-gradient-to-r from-red-500 via-rose-600 to-red-700 animate-pulse"
                : summary.attendanceRate < 80
                ? "bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 animate-pulse"
                : "bg-gradient-to-r from-emerald-400 via-green-500 to-emerald-600"}`}
            style={{ width: `${summary.attendanceRate}%` }}
          />

          {/* Floating percentage badge */}
          <div
            className="absolute top-1/2 -translate-y-1/2 text-xs font-bold text-white px-2 py-0.5 rounded-md shadow-lg transition-all"
            style={{
              left: `${summary.attendanceRate}%`,
              transform: "translateX(-50%) translateY(-50%)",
              background:
                summary.attendanceRate < 50
                  ? "linear-gradient(to right, #ef4444, #dc2626)"
                  : summary.attendanceRate < 80
                  ? "linear-gradient(to right, #facc15, #ca8a04)"
                  : "linear-gradient(to right, #22c55e, #16a34a)",
            }}
          >
            {summary.attendanceRate}%
          </div>
        </div>

        {/* Tooltip text */}
        <p
          className={`mt-2 text-sm font-medium text-center transition-all ${
            summary.attendanceRate < 50
              ? "text-red-400"
              : summary.attendanceRate < 80
              ? "text-yellow-400"
              : "text-emerald-400"
          }`}
        >
          {summary.attendanceRate < 50
            ? "Needs Improvement"
            : summary.attendanceRate < 80
            ? "Good"
            : "Excellent"}
        </p>
      </div>


      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
      {/* Pie Chart with glow */}
      <div className="relative bg-white/5 backdrop-blur-lg p-6 rounded-2xl border border-white/10 shadow-lg overflow-hidden hover:shadow-emerald-500/10 transition-all duration-500">
        {/* 🔹 Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-green-700/5 pointer-events-none rounded-2xl" />

        <h3 className="relative text-lg font-semibold mb-6 flex items-center gap-2 bg-gradient-to-r from-emerald-400 via-green-500 to-green-600 bg-clip-text text-transparent drop-shadow-sm z-10">
          <FaChartPie className="text-emerald-400" /> Status Distribution
        </h3>

        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <defs>
              <linearGradient id="gradGreen" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#22c55e" />
                <stop offset="100%" stopColor="#16a34a" />
              </linearGradient>
              <linearGradient id="gradRed" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="100%" stopColor="#dc2626" />
              </linearGradient>
              <linearGradient id="gradYellow" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#facc15" />
                <stop offset="100%" stopColor="#ca8a04" />
              </linearGradient>
            </defs>

            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              innerRadius={53}
              outerRadius={110}
              activeShape={renderActiveShape}
              label={({ cx, cy, midAngle, outerRadius, percent, name, value, fill }) => {
                const RADIAN = Math.PI / 180;
                const sin = Math.sin(-RADIAN * midAngle);
                const cos = Math.cos(-RADIAN * midAngle);

                const sx = cx + (outerRadius + 10) * cos;
                const sy = cy + (outerRadius + 10) * sin;
                const mx = cx + (outerRadius + 20) * cos;
                const my = cy + (outerRadius + 20) * sin;
                const ex = mx + (cos >= 0 ? 22 : -22);
                const ey = my;
                const textAnchor = cos >= 0 ? "start" : "end";

                return (
                  <g>
                    {/* Connector line */}
                    <path
                      d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`}
                      stroke={fill}
                      fill="none"
                      strokeWidth={1.5}
                    />
                    <circle cx={ex} cy={ey} r={3} fill={fill} />

                    {/* Label */}
                    <text
                      x={ex + (cos >= 0 ? 6 : -6)}
                      y={ey}
                      textAnchor={textAnchor}
                      fill="#fff"
                      fontSize={12}
                      fontWeight="600"
                      style={{
                        paintOrder: "stroke",
                        stroke: "rgba(0,0,0,0.6)",
                        strokeWidth: "2px",
                      }}
                    >
                      {`${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                    </text>
                  </g>
                );
              }}
              labelLine={false}
            >
              {pieData.map((entry, idx) => (
                <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
              ))}
            </Pie>

            <Tooltip
              formatter={(value, name) => [`${value}`, name]}
              contentStyle={{
                background: "#eaf1e6",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: "10px",
                backdropFilter: "blur(8px)",
                color: "#fff",
                padding: "8px 12px",
              }}
              itemStyle={{ fontSize: "13px" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>


       <div className="relative bg-white/5 backdrop-blur-lg p-6 rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-green-700/5 pointer-events-none" />

        {/* Header + Toggle */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold bg-gradient-to-r from-emerald-400 to-green-600 bg-clip-text text-transparent">
            Per Subject Breakdown
          </h3>

          <div className="flex space-x-3">
            {/* Counts Button */}
            <button
              onClick={() => setShowPercentages(false)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-300
                ${
                  !showPercentages
                    ? "bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-600/40 scale-105"
                    : "bg-gradient-to-r from-neutral-800 to-neutral-900 text-gray-300 hover:from-neutral-700 hover:to-neutral-800 hover:shadow-md hover:shadow-gray-500/20"
                }`}
            >
              Counts
            </button>

            {/* Percentages Button */}
            <button
              onClick={() => setShowPercentages(true)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-300
                ${
                  showPercentages
                    ? "bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-600/40 scale-105"
                    : "bg-gradient-to-r from-neutral-800 to-neutral-900 text-gray-300 hover:from-neutral-700 hover:to-neutral-800 hover:shadow-md hover:shadow-gray-500/20"
                }`}
            >
              Percentages
            </button>
          </div>
        </div>

        {/* Chart */}
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={barData} barSize={28} barGap={12}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.04)"
            />

            <XAxis
              dataKey="name"
              stroke="rgba(255,255,255,0.15)"
              tick={{ fill: "#bbb", fontSize: 11, fontWeight: 500 }}
              axisLine={{ stroke: "rgba(255,255,255,0.15)" }}
              tickLine={false}
            />

            <YAxis
              stroke="rgba(255,255,255,0.15)"
              tick={{ fill: "#bbb", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              domain={showPercentages ? [0, 100] : ["auto", "auto"]}
              tickFormatter={(val) =>
                showPercentages ? `${val}%` : val
              }
              padding={{ top: 10 }}
            />

            <Tooltip
              formatter={(value, name, entry) => {
                if (!showPercentages) return [value, name];
                const total =
                  (entry.payload.Present ?? 0) +
                  (entry.payload.Absent ?? 0) +
                  (entry.payload.Late ?? 0);
                if (!total) return ["0%", name];
                return [
                  `${Math.round((value / total) * 100)}%`,
                  name,
                ];
              }}
              contentStyle={{
                background: "rgba(17,24,39,0.95)",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: "12px",
                backdropFilter: "blur(10px)",
                color: "#fff",
                padding: "8px 12px",
              }}
              itemStyle={{ fontSize: "12px" }}
              cursor={{ fill: "rgba(255,255,255,0.05)" }}
            />

            {/* Bars */}
            <Bar
              dataKey={showPercentages ? "PresentPct" : "Present"}
              fill="url(#gradGreen)"
              radius={[8, 8, 0, 0]}
            >
              <LabelList
                dataKey={showPercentages ? "PresentPct" : "Present"}
                position="top"
                fill="#22c55e"
                fontSize={11}
                fontWeight={600}
                formatter={(val) =>
                  showPercentages ? `${val}%` : val
                }
              />
            </Bar>

            <Bar
              dataKey={showPercentages ? "AbsentPct" : "Absent"}
              fill="url(#gradRed)"
              radius={[8, 8, 0, 0]}
            >
              <LabelList
                dataKey={showPercentages ? "AbsentPct" : "Absent"}
                position="top"
                fill="#ef4444"
                fontSize={11}
                fontWeight={600}
                formatter={(val) =>
                  showPercentages ? `${val}%` : val
                }
              />
            </Bar>

            <Bar
              dataKey={showPercentages ? "LatePct" : "Late"}
              fill="url(#gradYellow)"
              radius={[8, 8, 0, 0]}
            >
              <LabelList
                dataKey={showPercentages ? "LatePct" : "Late"}
                position="top"
                fill="#facc15"
                fontSize={11}
                fontWeight={600}
                formatter={(val) =>
                  showPercentages ? `${val}%` : val
                }
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      </div>

      {/* Subject Breakdown Table */}
      {subjectBreakdown.length > 0 ? (
        <div className="border border-white/10 rounded-2xl bg-gradient-to-br from-neutral-900/60 to-neutral-950/80 backdrop-blur-lg shadow-xl">
          {/* Desktop / Tablet Table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="min-w-full text-sm text-gray-200">
              {/* Table Header */}
              <thead className="sticky top-0 z-10 bg-gradient-to-r from-emerald-600/40 via-emerald-700/30 to-green-800/40 text-emerald-300 backdrop-blur-md">
                <tr>
                  <th className="py-3 px-4 text-left font-semibold text-xs uppercase tracking-wide">Subject</th>
                  <th className="py-3 px-4 text-center font-semibold text-xs uppercase tracking-wide">Present</th>
                  <th className="py-3 px-4 text-center font-semibold text-xs uppercase tracking-wide">Absent</th>
                  <th className="py-3 px-4 text-center font-semibold text-xs uppercase tracking-wide">Late</th>
                  <th className="py-3 px-4 text-center font-semibold text-xs uppercase tracking-wide">Total</th>
                  <th className="py-3 px-4 text-center font-semibold text-xs uppercase tracking-wide">Actions</th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody>
                {subjectBreakdown.map((subj, idx) => (
                  <tr
                    key={idx}
                    className={`transition-all duration-300 ${
                      idx % 2 === 0 ? "bg-neutral-900/40" : "bg-neutral-800/30"
                    } hover:bg-neutral-700/40 hover:shadow-md`}
                  >
                    <td className="py-3 px-4 font-medium text-gray-100 whitespace-nowrap">
                      {subj.subject_code || ""} {subj.subject_title || "—"}
                    </td>
                    <td className="py-3 px-4 text-center font-semibold text-emerald-400">{subj.present}</td>
                    <td className="py-3 px-4 text-center font-semibold text-red-400">{subj.absent}</td>
                    <td className="py-3 px-4 text-center font-semibold text-yellow-400">{subj.late}</td>
                    <td className="py-3 px-4 text-center font-semibold text-gray-200">{subj.total}</td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setSelectedSubject(subj)}
                        className="flex items-center gap-2 mx-auto px-3 py-1.5 
                                  rounded-lg text-xs font-medium 
                                  text-emerald-400 border border-emerald-400/40 
                                  hover:border-emerald-400 hover:text-white 
                                  hover:shadow-[0_0_10px_rgba(34,197,94,0.5)] 
                                  transition-all duration-300"
                      >
                        <FaEye className="text-sm" />
                        View Logs
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="sm:hidden space-y-4 p-4">
            {subjectBreakdown.map((subj, idx) => (
              <div
                key={idx}
                className="bg-neutral-900/60 rounded-xl p-4 border border-white/10 shadow-md"
              >
                <p className="text-gray-100 font-semibold mb-2">
                  {subj.subject_code || ""} {subj.subject_title || "—"}
                </p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-emerald-400">Present: {subj.present}</span>
                  <span className="text-red-400">Absent: {subj.absent}</span>
                  <span className="text-yellow-400">Late: {subj.late}</span>
                  <span className="text-gray-300">Total: {subj.total}</span>
                </div>
                <div className="mt-3">
                  <button
                    onClick={() => setSelectedSubject(subj)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-1.5 
                              rounded-lg text-xs font-medium 
                              text-emerald-400 border border-emerald-400/40 
                              hover:border-emerald-400 hover:text-white 
                              hover:shadow-[0_0_10px_rgba(34,197,94,0.5)] 
                              transition-all duration-300"
                  >
                    <FaEye className="text-sm" />
                    View Logs
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-gray-400 text-sm mt-4 text-center">
          No attendance records found.
        </p>
      )}

      {/* Modal */}
      <SubjectLogsModal
        subject={selectedSubject}
        logs={logs}
        onClose={() => setSelectedSubject(null)}
        formatDate={formatDate}
      />
    </div>
  );
};

export default AttendanceHistory;
