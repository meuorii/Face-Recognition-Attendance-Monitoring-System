// src/components/Instructor/InstructorOverview.jsx
import { useEffect, useState } from "react";
import {
  FaChalkboardTeacher,
  FaUsers,
  FaCalendarAlt,
  FaChartLine,
  FaClipboardList,
  FaCheckCircle,
  FaClock,
} from "react-icons/fa";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { toast } from "react-toastify";
import axios from "axios";
import { format, parseISO } from "date-fns";

const InstructorOverview = () => {
  const [overviewData, setOverviewData] = useState(null);
  const [attendanceTrend, setAttendanceTrend] = useState([]);
  const [classSummary, setClassSummary] = useState([]);
  const [loading, setLoading] = useState(true);

  const instructor = JSON.parse(localStorage.getItem("userData"));
  const token = localStorage.getItem("token");

  const COLORS = ["url(#gradGreen)", "url(#gradYellow)", "url(#gradRed)"];

  useEffect(() => {
    if (!instructor?.instructor_id || !token) {
      toast.error("Instructor not logged in.");
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const headers = { Authorization: `Bearer ${token}` };

        const [overviewRes, trendRes, classRes] = await Promise.all([
          axios.get(
            `http://localhost:5000/api/instructor/${instructor.instructor_id}/overview`,
            { headers }
          ),
          axios.get(
            `http://localhost:5000/api/instructor/${instructor.instructor_id}/overview/attendance-trend`,
            { headers }
          ),
          axios.get(
            `http://localhost:5000/api/instructor/${instructor.instructor_id}/overview/classes`,
            { headers }
          ),
        ]);

        setOverviewData(overviewRes.data);

        const rawTrend = trendRes.data || [];
        setAttendanceTrend(
          rawTrend.map((t) => ({
            date: t.date,
            present: t.present || 0,
            late: t.late || 0,
            absent: t.absent || 0,
          }))
        );

        setClassSummary(classRes.data);
      } catch (err) {
        console.error("❌ Failed to load overview:", err.response?.data || err.message);
        toast.error("Failed to load overview data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [instructor?.instructor_id, token]);

  if (loading) {
    return <div className="p-6 text-center text-gray-400">Loading instructor overview...</div>;
  }

  if (!overviewData) {
    return <div className="p-6 text-center text-red-400">Failed to load overview data.</div>;
  }

  return (
    <div className="p-8 bg-neutral-950 min-h-screen rounded-xl text-white relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/20 blur-[160px] rounded-full"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-green-600/20 blur-[160px] rounded-full"></div>

      {/* Header */}
      <h2 className="relative z-10 text-2xl font-bold mb-6 flex items-center gap-2 
        text-transparent bg-gradient-to-r from-emerald-400 to-green-600 bg-clip-text">
        <FaChalkboardTeacher className="text-emerald-400 text-2xl" />
        Instructor Overview
      </h2>

      {/* Stat Cards */}
      <div className="relative z-10 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-10">
        {[
          { 
            icon: <FaChalkboardTeacher />, 
            label: "Total Classes", 
            value: overviewData.totalClasses,
            gradient: "from-emerald-500/70 to-green-600/20",
            glow: "hover:shadow-emerald-500/40",
            iconColor: "text-emerald-300"
          },
          { 
            icon: <FaUsers />, 
            label: "Total Students", 
            value: overviewData.totalStudents,
            gradient: "from-blue-500/70 to-cyan-600/20",
            glow: "hover:shadow-blue-500/40",
            iconColor: "text-blue-300"
          },
          { 
            icon: <FaCalendarAlt />, 
            label: "Active Sessions", 
            value: overviewData.activeSessions,
            gradient: "from-purple-500/70 to-pink-600/20",
            glow: "hover:shadow-purple-500/40",
            iconColor: "text-purple-300"
          },
          { 
            icon: <FaCheckCircle />, 
            label: "Present", 
            value: overviewData.present || 0,
            gradient: "from-green-500/70 to-emerald-600/20",
            glow: "hover:shadow-green-500/40",
            iconColor: "text-green-300"
          },
          { 
            icon: <FaClock />, 
            label: "Late", 
            value: overviewData.late || 0, 
            isLate: true,
            gradient: "from-amber-500/70 to-yellow-600/20",
            glow: "hover:shadow-amber-500/40",
            iconColor: "text-amber-300"
          },
        ].map((stat, idx) => (
          <div
            key={idx}
            className={`
              bg-gradient-to-br ${stat.gradient}
              backdrop-blur-lg p-5 rounded-xl border border-white/10 
              shadow-md transition-all duration-500 transform
              hover:scale-[1.05] hover:shadow-2xl ${stat.glow}
              flex items-center gap-4
              ${stat.isLate ? "col-span-2 lg:col-span-1" : ""}
            `}
          >
            <div className={`text-3xl ${stat.iconColor} transition-colors duration-500`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-gray-300 text-sm">{stat.label}</p>
              <h3 className="text-2xl font-bold text-white">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Attendance Rate */}
      {(() => {
        const rate = overviewData.attendanceRate;

        // Dynamic styles based on rate
        let progressGradient = "";
        let badgeClass = "";
        let hoverShadow = "";
        let statusText = "";
        let statusColor = "";

        if (rate < 50) {
          progressGradient = "bg-gradient-to-r from-red-500 via-rose-600 to-red-700";
          badgeClass =
            "bg-gradient-to-r from-red-500/70 to-red-700/30 text-red-300 border border-red-500/30";
          hoverShadow = "hover:shadow-red-500/30";
          statusText = "Needs Improvement";
          statusColor = "text-red-400";
        } else if (rate < 80) {
          progressGradient =
            "bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-600";
          badgeClass =
            "bg-gradient-to-r from-yellow-500/70 to-yellow-700/30 text-yellow-300 border border-yellow-500/30";
          hoverShadow = "hover:shadow-yellow-500/30";
          statusText = "Good";
          statusColor = "text-yellow-400";
        } else {
          progressGradient =
            "bg-gradient-to-r from-emerald-400 via-green-500 to-emerald-600";
          badgeClass =
            "bg-gradient-to-r from-emerald-500/70 to-green-700/30 text-green-300 border border-green-500/30";
          hoverShadow = "hover:shadow-emerald-500/30";
          statusText = "Excellent";
          statusColor = "text-emerald-400";
        }

        return (
          <div
            className={`relative z-10 bg-neutral-950 backdrop-blur-lg p-6 rounded-xl border border-white/10 
                        shadow-md transition-all duration-500 mb-10 ${hoverShadow}`}
          >
            {/* Header Row */}
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <p className="text-gray-300 text-sm font-medium tracking-wide">
                Attendance Rate
              </p>
              <span
                className={`text-xs sm:text-sm font-bold px-3 py-1 rounded-lg shadow-md ${badgeClass}`}
              >
                {rate.toFixed(2)}%
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-neutral-800/70 rounded-full h-4 sm:h-5 overflow-hidden shadow-inner border border-white/10">
              <div
                className={`h-4 sm:h-5 rounded-full transition-all duration-700 ease-out ${progressGradient}`}
                style={{ width: `${rate}%` }}
              />
            </div>

            {/* Status Text */}
            <p
              className={`mt-3 text-center text-sm sm:text-base font-medium transition-all ${statusColor}`}
            >
              {statusText}
            </p>
          </div>
        );
      })()}

      {/* Charts */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        {/* Attendance Trend */}
        <div className="p-6 rounded-xl border border-white/10 bg-neutral-950 backdrop-blur-md shadow-lg">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-emerald-400">
            <FaChartLine /> Attendance Trend
          </h3>
          <ResponsiveContainer width="100%" height={340}>
          <LineChart data={attendanceTrend}>
            {/* ✅ Gradient defs */}
            <defs>
              <linearGradient id="gradPresent" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34d399" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#059669" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="gradLate" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fde047" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#ca8a04" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="gradAbsent" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f87171" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#b91c1c" stopOpacity={0.1} />
              </linearGradient>
            </defs>

            {/* ✅ Grid + Axis */}
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />

            {/* X Axis with formatted dates */}
            <XAxis
              dataKey="date"
              stroke="#9ca3af"
              tick={{ fill: "#9ca3af", fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: "rgba(255,255,255,0.2)" }}
              tickFormatter={(date) => format(parseISO(date), "MMM d")}
            />

            <YAxis
              stroke="#9ca3af"
              tick={{ fill: "#9ca3af", fontSize: 12 }}
              axisLine={{ stroke: "rgba(255,255,255,0.2)" }}
            />

            {/* ✅ Glass tooltip */}
            <Tooltip
              contentStyle={{
                background: "rgba(17, 24, 39, 0.85)", // dark glass
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
              }}
              itemStyle={{ color: "#fff" }}
              labelFormatter={(date) => format(parseISO(date), "MMMM dd, yyyy")} // full format in tooltip
              labelStyle={{ color: "#a3e635", fontWeight: "600" }}
            />

            {/* ✅ Smooth glowing lines */}
            <Line
              type="monotone"
              dataKey="present"
              stroke="url(#gradPresent)"
              strokeWidth={3}
              dot={{ r: 4, fill: "#22c55e", stroke: "#111" }}
              activeDot={{ r: 6, fill: "#22c55e" }}
            />
            <Line
              type="monotone"
              dataKey="late"
              stroke="url(#gradLate)"
              strokeWidth={3}
              dot={{ r: 4, fill: "#facc15", stroke: "#111" }}
              activeDot={{ r: 6, fill: "#facc15" }}
            />
            <Line
              type="monotone"
              dataKey="absent"
              stroke="url(#gradAbsent)"
              strokeWidth={3}
              dot={{ r: 4, fill: "#ef4444", stroke: "#111" }}
              activeDot={{ r: 6, fill: "#ef4444" }}
            />
          </LineChart>
        </ResponsiveContainer>
        </div>

        {/* Attendance Distribution */}
        <div className="p-6 rounded-xl border border-white/10 bg-neutral-950 backdrop-blur-md shadow-lg">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-emerald-400">
            <FaClipboardList /> Attendance Distribution
          </h3>
          <ResponsiveContainer width="100%" height={340}>
          <PieChart>
            {/* ✅ Gradient definitions */}
            <defs>
              <linearGradient id="gradGreen" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#34d399" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
              <linearGradient id="gradYellow" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#fde047" />
                <stop offset="100%" stopColor="#ca8a04" />
              </linearGradient>
              <linearGradient id="gradRed" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#f87171" />
                <stop offset="100%" stopColor="#b91c1c" />
              </linearGradient>

              {/* ✅ Glow filters */}
              <filter id="glowGreen" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="4" result="blur" />
                <feFlood floodColor="#22c55e" floodOpacity="0.8" />
                <feComposite in2="blur" operator="in" />
                <feMerge>
                  <feMergeNode />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              <filter id="glowYellow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="4" result="blur" />
                <feFlood floodColor="#facc15" floodOpacity="0.8" />
                <feComposite in2="blur" operator="in" />
                <feMerge>
                  <feMergeNode />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              <filter id="glowRed" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="4" result="blur" />
                <feFlood floodColor="#ef4444" floodOpacity="0.8" />
                <feComposite in2="blur" operator="in" />
                <feMerge>
                  <feMergeNode />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* ✅ Pie with gradient slices */}
            <Pie
              data={[
                { name: "Present", value: overviewData.present || 0, fill: "url(#gradGreen)", glow: "url(#glowGreen)" },
                { name: "Late", value: overviewData.late || 0, fill: "url(#gradYellow)", glow: "url(#glowYellow)" },
                { name: "Absent", value: overviewData.absent || 0, fill: "url(#gradRed)", glow: "url(#glowRed)" },
              ]}
              cx="50%"
              cy="50%"
              outerRadius={110}
              innerRadius={40} // ✅ donut style
              paddingAngle={0}
              dataKey="value"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {[
                { fill: "url(#gradGreen)", glow: "url(#glowGreen)" },
                { fill: "url(#gradYellow)", glow: "url(#glowYellow)" },
                { fill: "url(#gradRed)", glow: "url(#glowRed)" },
              ].map((slice, idx) => (
                <Cell
                  key={idx}
                  fill={slice.fill}
                  stroke="rgba(255,255,255,0.3)"
                  strokeWidth={1.5}
                  onMouseEnter={(e) => (e.target.style.filter = slice.glow)}
                  onMouseLeave={(e) => (e.target.style.filter = "none")}
                  style={{ transition: "filter 0.3s ease" }}
                />
              ))}
            </Pie>

            {/* ✅ Glassy tooltip */}
            <Tooltip
              contentStyle={{
                background: "rgba(17,24,39,0.85)", // dark glass
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
              }}
              itemStyle={{ color: "#fff" }}
              labelStyle={{ color: "#a3e635", fontWeight: 600 }}
            />
          </PieChart>
        </ResponsiveContainer>
        </div>
      </div>

      {/* Class Summary */}
      <div className="relative z-10 bg-neutral-950 backdrop-blur-lg p-6 rounded-xl shadow-lg border border-white/10">
        {/* Title */}
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-emerald-400">
          <FaChalkboardTeacher /> My Classes
        </h3>

        {/* ✅ Desktop Table */}
        <div className="hidden md:block overflow-x-hidden">
          <table className="min-w-full text-sm text-left text-gray-300">
            <thead className="bg-gradient-to-r from-emerald-500/10 to-emerald-600/10 text-green-300 uppercase text-xs tracking-wide">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th>Title</th>
                <th>Section</th>
                <th>Schedule</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {classSummary.map((c, idx) => (
                <tr
                  key={idx}
                  className="border-b border-neutral-700 
                            hover:bg-gradient-to-r hover:from-emerald-500/10 hover:to-transparent 
                            hover:shadow-md hover:shadow-emerald-500/20
                            transition-all duration-300 ease-in-out transform hover:scale-[1.01] cursor-pointer"
                >
                  <td className="px-4 py-3 font-medium text-white">{c.subject_code}</td>
                  <td className="text-gray-300">{c.subject_title}</td>
                  <td className="text-gray-300">{c.section}</td>
                  <td className="text-gray-400">
                    {c.schedule_blocks?.length > 0
                      ? c.schedule_blocks
                          .map((b) => `${b.days?.join(", ")} • ${b.start}–${b.end}`)
                          .join(" | ")
                      : "N/A"}
                  </td>
                  <td
                    className={`font-semibold ${
                      c.is_attendance_active ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {c.is_attendance_active ? "Active" : "Inactive"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ✅ Mobile & Tablet Cards */}
        <div className="md:hidden space-y-4">
          {classSummary.map((c, idx) => (
            <div
              key={idx}
              className={`bg-neutral-950 rounded-lg p-4 border border-neutral-700 
                          transition-all duration-500 transform 
                          hover:scale-[1.02] hover:shadow-lg 
                          ${c.is_attendance_active 
                            ? "hover:border-emerald-400/70 hover:shadow-emerald-500/30" 
                            : "hover:border-red-400/70 hover:shadow-red-500/30"}`}
            >
              <p className="text-sm text-gray-400 mb-1">
                <span className="font-semibold text-emerald-400">Code:</span>{" "}
                {c.subject_code}
              </p>
              <p className="text-white font-medium">{c.subject_title}</p>
              <p className="text-sm text-gray-300">
                <span className="font-semibold text-emerald-400">Section:</span>{" "}
                {c.section}
              </p>
              <p className="text-sm text-gray-300">
                <span className="font-semibold text-emerald-400">Schedule:</span>{" "}
                {c.schedule_blocks?.length > 0
                  ? c.schedule_blocks
                      .map((b) => `${b.days?.join(", ")} • ${b.start}–${b.end}`)
                      .join(" | ")
                  : "N/A"}
              </p>
              <p
                className={`mt-3 font-semibold text-sm px-2 py-1 inline-block rounded-md transition-all duration-500
                  ${c.is_attendance_active 
                    ? "text-emerald-300 bg-gradient-to-r from-emerald-400/70 to-green-500/30 border border-emerald-500/30" 
                    : "text-red-300 bg-gradient-to-r from-red-400/70 to-red-500/30 border border-red-500/30"}`}
              >
                {c.is_attendance_active ? "Active" : "Inactive"}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InstructorOverview;
