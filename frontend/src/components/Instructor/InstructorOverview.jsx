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
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-10">
        {[
          { icon: <FaChalkboardTeacher />, label: "Total Classes", value: overviewData.totalClasses },
          { icon: <FaUsers />, label: "Total Students", value: overviewData.totalStudents },
          { icon: <FaCalendarAlt />, label: "Active Sessions", value: overviewData.activeSessions },
          { icon: <FaCheckCircle />, label: "Present", value: overviewData.present || 0 },
          { icon: <FaClock />, label: "Late", value: overviewData.late || 0 },
        ].map((stat, idx) => (
          <div
            key={idx}
            className="bg-white/10 backdrop-blur-lg p-5 rounded-xl shadow-lg border border-white/10 
            hover:scale-[1.03] hover:shadow-emerald-500/30 transition-all duration-300 flex items-center gap-4"
          >
            <div className="text-emerald-400 text-3xl">{stat.icon}</div>
            <div>
              <p className="text-gray-400 text-sm">{stat.label}</p>
              <h3 className="text-xl font-semibold">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Attendance Rate */}
      <div className="relative z-10 bg-white/10 backdrop-blur-lg p-5 rounded-xl shadow-lg border border-white/10 mb-10">
        <p className="text-gray-400 text-sm mb-2">Attendance Rate</p>

        {/* ✅ Progress Bar with Dynamic Gradient */}
        <div className="w-full bg-neutral-700 rounded-full h-3 overflow-hidden">
          <div
            className={`h-3 rounded-full transition-all duration-700 ${
              overviewData.attendanceRate < 50
                ? "bg-gradient-to-r from-red-500 via-red-600 to-red-700"
                : overviewData.attendanceRate < 80
                ? "bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-600"
                : "bg-gradient-to-r from-emerald-400 via-green-500 to-emerald-600"
            }`}
            style={{ width: `${overviewData.attendanceRate}%` }}
          />
        </div>

        {/* ✅ Dynamic Text Color */}
        <p
          className={`text-right text-sm font-semibold mt-2 ${
            overviewData.attendanceRate < 50
              ? "text-red-400"
              : overviewData.attendanceRate < 80
              ? "text-yellow-400"
              : "text-green-400"
          }`}
        >
          {overviewData.attendanceRate}%
        </p>
      </div>

      {/* Charts */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        {/* Attendance Trend */}
        <div className="p-6 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md shadow-lg">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-emerald-400">
            <FaChartLine /> Attendance Trend
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={attendanceTrend}>
              {/* ✅ Gradient defs */}
              <defs>
                <linearGradient id="gradPresent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="gradLate" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#facc15" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#facc15" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="gradAbsent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0.1} />
                </linearGradient>
              </defs>

              {/* ✅ Grid + Axis */}
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="date" stroke="#9ca3af" tick={{ fill: "#9ca3af" }} />
              <YAxis stroke="#9ca3af" tick={{ fill: "#9ca3af" }} />

              {/* ✅ Glass tooltip */}
              <Tooltip
                contentStyle={{
                  background: "rgba(17, 24, 39, 0.85)", // dark glass
                  backdropFilter: "blur(8px)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                }}
                itemStyle={{ color: "#fff" }}
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
        <div className="p-6 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md shadow-lg">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-emerald-400">
            <FaClipboardList /> Attendance Distribution
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              {/* ✅ Gradient definitions */}
              <defs>
                <linearGradient id="gradGreen" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity={1} />
                  <stop offset="100%" stopColor="#16a34a" stopOpacity={0.7} />
                </linearGradient>
                <linearGradient id="gradYellow" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#facc15" stopOpacity={1} />
                  <stop offset="100%" stopColor="#eab308" stopOpacity={0.7} />
                </linearGradient>
                <linearGradient id="gradRed" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={1} />
                  <stop offset="100%" stopColor="#dc2626" stopOpacity={0.7} />
                </linearGradient>
              </defs>

              {/* ✅ Pie with gradient slices */}
              <Pie
                data={[
                  { name: "Present", value: overviewData.present || 0, fill: "url(#gradGreen)" },
                  { name: "Late", value: overviewData.late || 0, fill: "url(#gradYellow)" },
                  { name: "Absent", value: overviewData.absent || 0, fill: "url(#gradRed)" },
                ]}
                cx="50%"
                cy="50%"
                outerRadius={95}
                innerRadius={50} // ✅ donut style
                paddingAngle={0}
                dataKey="value"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {[
                  "url(#gradGreen)",
                  "url(#gradYellow)",
                  "url(#gradRed)",
                ].map((fill, idx) => (
                  <Cell key={idx} fill={fill} stroke="rgba(255,255,255,0.3)" strokeWidth={1.5} />
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
      <div className="relative z-10 bg-white/10 backdrop-blur-lg p-6 rounded-xl shadow-lg border border-white/10">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-emerald-400">
          <FaChalkboardTeacher /> My Classes
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left text-gray-300">
            <thead className="bg-neutral-700/50 text-emerald-400">
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
                  className="border-b border-neutral-700 hover:bg-white/5 transition"
                >
                  <td className="px-4 py-3">{c.subject_code}</td>
                  <td>{c.subject_title}</td>
                  <td>{c.section}</td>
                  <td>
                    {c.schedule_blocks?.length > 0
                      ? c.schedule_blocks.map((b) => `${b.days?.join(", ")} • ${b.start}-${b.end}`).join(" | ")
                      : "N/A"}
                  </td>
                  <td className={c.is_attendance_active ? "text-emerald-400 font-semibold" : "text-red-400 font-semibold"}>
                    {c.is_attendance_active ? "Active" : "Inactive"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InstructorOverview;
