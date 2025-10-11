// src/components/Student/StudentOverview.jsx
import { useEffect, useState } from "react";
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

const StudentOverview = () => {
  const [overviewData, setOverviewData] = useState(null);
  const [attendanceTrend, setAttendanceTrend] = useState([]);
  const [subjectSummary, setSubjectSummary] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const student = JSON.parse(localStorage.getItem("userData"));
  const token = localStorage.getItem("token");

  // ✅ Gradient Colors
  const COLORS = [
    "url(#gradGreen)",
    "url(#gradRed)",
    "url(#gradYellow)",
  ];

  // ✅ Format Date (Month Day, Year)
  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return isNaN(date.getTime())
      ? dateStr
      : date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
  };

  // ✅ Format Time (AM/PM)
  const formatTime = (timeStr) => {
    if (!timeStr) return "N/A";
    const date = new Date(`1970-01-01T${timeStr}`);
    return isNaN(date.getTime())
      ? timeStr
      : date.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });
  };

  // ✅ Attendance Rate Color Logic
  const getRateGradient = (rate) => {
    if (rate < 50) return "from-red-500/30 to-red-700/20 text-red-400";
    if (rate < 80) return "from-yellow-400/30 to-yellow-600/20 text-yellow-400";
    return "from-emerald-400/30 to-green-600/20 text-emerald-400";
  };

  useEffect(() => {
    if (!student?.student_id || !token) {
      toast.error("Student not logged in.");
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const headers = { Authorization: `Bearer ${token}` };

        const [overviewRes, trendRes, subjectRes, logsRes] = await Promise.all([
          axios.get(
            `http://localhost:5000/api/student/${student.student_id}/overview`,
            { headers }
          ),
          axios.get(
            `http://localhost:5000/api/student/${student.student_id}/overview/attendance-trend`,
            { headers }
          ),
          axios.get(
            `http://localhost:5000/api/student/${student.student_id}/overview/subjects`,
            { headers }
          ),
          axios.get(
            `http://localhost:5000/api/student/${student.student_id}/overview/recent-logs`,
            { headers }
          ),
        ]);

        // ✅ Adjust attendance rate: (Present + Late) / Total Sessions * 100
        const rawData = overviewRes.data || {};
        const totalPresent = (rawData.present || 0) + (rawData.late || 0);
        const totalSessions = rawData.totalSessions || 1;
        const attendanceRate = ((totalPresent / totalSessions) * 100).toFixed(1);

        setOverviewData({
          ...rawData,
          totalPresent,
          attendanceRate,
        });
        setAttendanceTrend(trendRes.data);
        setSubjectSummary(subjectRes.data);
        setRecentLogs(logsRes.data);
      } catch (err) {
        console.error("❌ Failed to load student overview:", err);
        toast.error("Failed to load student overview data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [student?.student_id, token]);

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-400">Loading student overview...</div>
    );
  }

  if (!overviewData) {
    return (
      <div className="p-6 text-center text-red-400">
        Failed to load student overview data.
      </div>
    );
  }

  return (
    <div className="p-8 bg-neutral-950 min-h-screen rounded-xl text-white">
      
      {/* Header */}
      <h2 className="text-3xl font-extrabold mb-10 bg-gradient-to-r from-emerald-400 to-green-600 bg-clip-text text-transparent">
        Student Overview
      </h2>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-10">
        {[
          { label: "Classes Enrolled", value: overviewData.totalClasses, color: "emerald" },
          { label: "Total Sessions", value: overviewData.totalSessions, color: "emerald" },
          {
            label: "Attendance Rate",
            value: `${overviewData.attendanceRate}%`,
            gradient: getRateGradient(overviewData.attendanceRate),
            color: "emerald",
          },
          {
            label: "Total Lates",
            value: overviewData.late,
            gradient: "from-amber-400/30 to-orange-600/20 text-amber-400",
            color: "amber",
          },
          {
            label: "Total Absents",
            value: overviewData.absent,
            gradient: "from-red-500/30 to-red-700/20 text-red-400",
            color: "red",
          },
        ].map((card, i) => (
          <div
            key={i}
            className={`relative group p-5 rounded-xl border border-white/10 backdrop-blur-md
              transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] transform 
              hover:-translate-y-1 hover:scale-[1.05]
              ${
                card.color === "red"
                  ? "hover:shadow-[0_0_25px_rgba(239,68,68,0.35)] hover:border-red-500/40"
                  : card.color === "amber"
                  ? "hover:shadow-[0_0_25px_rgba(250,204,21,0.35)] hover:border-amber-400/40"
                  : "hover:shadow-[0_0_25px_rgba(16,185,129,0.35)] hover:border-emerald-400/40"
              }
              ${card.label === "Total Absents" ? "col-span-2 md:col-span-1" : ""}
              ${card.gradient ? `bg-gradient-to-br ${card.gradient}` : "bg-white/5 hover:bg-white/10"}
              overflow-hidden
            `}
          >
            {/* ✨ subtle animated light sweep on hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
              <div
                className={`absolute top-0 left-0 w-full h-full 
                  ${
                    card.color === "red"
                      ? "bg-gradient-to-br from-red-500/10 via-red-400/5 to-transparent"
                      : card.color === "amber"
                      ? "bg-gradient-to-br from-amber-400/10 via-amber-300/5 to-transparent"
                      : "bg-gradient-to-br from-emerald-400/10 via-emerald-300/5 to-transparent"
                  }
                  animate-[shine_2.5s_ease-in-out_infinite]
                `}
              ></div>
            </div>

            {/* Card Content */}
            <p className="text-gray-300 text-sm tracking-wide">{card.label}</p>
            <h3
              className={`text-2xl font-extrabold mt-1 relative z-10 ${
                card.gradient ? "drop-shadow-[0_0_8px_rgba(255,255,255,0.15)]" : "text-white"
              }`}
            >
              {card.value}
            </h3>
          </div>
        ))}
      </div>


      {/* Middle Section: Attendance Trend + Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        {/* Attendance Trend */}
        <div className="bg-white/5 backdrop-blur-md p-6 rounded-xl shadow-lg border border-white/10">
          <h3 className="text-lg font-semibold mb-4 text-emerald-400">
            Attendance Trend
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={attendanceTrend}>
              <defs>
                {/* Present */}
                <linearGradient id="gradPresent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity={1} />
                  <stop offset="100%" stopColor="#16a34a" stopOpacity={0.3} />
                </linearGradient>
                {/* Late */}
                <linearGradient id="gradLate" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#facc15" stopOpacity={1} />
                  <stop offset="100%" stopColor="#ca8a04" stopOpacity={0.3} />
                </linearGradient>
                {/* Absent */}
                <linearGradient id="gradAbsent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={1} />
                  <stop offset="100%" stopColor="#b91c1c" stopOpacity={0.3} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="_id" stroke="#aaa" />
              <YAxis stroke="#aaa" />

              <Tooltip
                contentStyle={{
                  background: "rgba(17,24,39,0.9)", // glass dark bg
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                  backdropFilter: "blur(6px)",
                  color: "#fff",
                }}
                formatter={(value, name) => [
                  value,
                  name.charAt(0).toUpperCase() + name.slice(1), // Capitalize tooltip label
                ]}
                labelStyle={{ color: "#22c55e", fontWeight: 600 }}
              />

              {/* ✅ Three trend lines */}
              <Line
                type="monotone"
                dataKey="present"
                stroke="url(#gradPresent)"
                strokeWidth={3}
                dot={{ r: 4, fill: "#22c55e" }}
                name="Present"
              />
              <Line
                type="monotone"
                dataKey="late"
                stroke="url(#gradLate)"
                strokeWidth={3}
                dot={{ r: 4, fill: "#facc15" }}
                name="Late"
              />
              <Line
                type="monotone"
                dataKey="absent"
                stroke="url(#gradAbsent)"
                strokeWidth={3}
                dot={{ r: 4, fill: "#ef4444" }}
                name="Absent"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Attendance Distribution */}
        <div className="bg-white/5 backdrop-blur-md p-6 rounded-xl shadow-lg border border-white/10">
          <h3 className="text-lg font-semibold mb-4 text-emerald-400">
            Attendance Distribution
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <defs>
                {/* ✅ Gradient definitions */}
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
                data={[
                  { name: "Present", value: overviewData.present, fill: "url(#gradGreen)" },
                  { name: "Absent", value: overviewData.absent, fill: "url(#gradRed)" },
                  { name: "Late", value: overviewData.late, fill: "url(#gradYellow)" },
                ]}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="value"
                labelLine={true} // ✅ line + label outside
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                isAnimationActive={true}
              >
                <Cell stroke="rgba(255,255,255,0.2)" strokeWidth={2} />
              </Pie>

              {/* ✅ Glassy Tooltip */}
              <Tooltip
                formatter={(value, name) => [`${value}`, name]}
                contentStyle={{
                  background: "rgba(17,24,39,0.9)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                  backdropFilter: "blur(8px)",
                  color: "#fff",
                }}
                itemStyle={{ color: "#fff" }}
                labelStyle={{ color: "#22c55e", fontWeight: 600 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Subject Breakdown */}
      <div className="bg-white/5 backdrop-blur-md p-6 rounded-xl shadow-lg border border-white/10 mb-10">
        <h3 className="text-lg font-semibold mb-4 text-emerald-400">
          Subject Breakdown
        </h3>

        {/* ✅ Table for large screens, card view for small */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full text-sm text-left text-gray-300">
            <thead className="bg-gradient-to-r from-emerald-600/30 to-green-800/30 text-emerald-400">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th>Title</th>
                <th>Present</th>
                <th>Absent</th>
                <th>Late</th>
                <th>Rate</th>
              </tr>
            </thead>
            <tbody>
              {subjectSummary.map((subj, index) => {
                const subjPresent = (subj.present || 0) + (subj.late || 0);
                const subjTotal =
                  (subj.present || 0) +
                  (subj.absent || 0) +
                  (subj.late || 0);
                const subjRate =
                  subjTotal > 0
                    ? ((subjPresent / subjTotal) * 100).toFixed(1)
                    : 0;

                return (
                  <tr
                    key={index}
                    className="border-b border-white/10 hover:bg-neutral-800/40 transition rounded-lg"
                  >
                    <td className="px-4 py-3 font-semibold text-white">
                      {subj.subject_code}
                    </td>
                    <td>{subj.subject_title}</td>
                    <td>
                      <span className="px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-medium">
                        {subj.present}
                      </span>
                    </td>
                    <td>
                      <span className="px-2 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-medium">
                        {subj.absent}
                      </span>
                    </td>
                    <td>
                      <span className="px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-medium">
                        {subj.late}
                      </span>
                    </td>
                    <td className="font-semibold">{subjRate}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ✅ Mobile Card View */}
        <div className="md:hidden flex flex-col gap-4">
          {subjectSummary.map((subj, index) => {
            const subjPresent = (subj.present || 0) + (subj.late || 0);
            const subjTotal =
              (subj.present || 0) +
              (subj.absent || 0) +
              (subj.late || 0);
            const subjRate =
              subjTotal > 0
                ? ((subjPresent / subjTotal) * 100).toFixed(1)
                : 0;

            return (
              <div
                key={index}
                className="bg-neutral-800/60 p-4 rounded-xl border border-white/10 shadow hover:shadow-lg transition"
              >
                <p className="text-emerald-400 font-semibold mb-1">
                  {subj.subject_code}
                </p>
                <p className="text-gray-300 mb-3 text-sm">{subj.subject_title}</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full">
                    P: {subj.present}
                  </span>
                  <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-full">
                    A: {subj.absent}
                  </span>
                  <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full">
                    L: {subj.late}
                  </span>
                  <span className="font-bold text-white">{subjRate}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Attendance Logs */}
      <div className="bg-white/5 backdrop-blur-md p-6 rounded-xl shadow-lg border border-white/10">
        <h3 className="text-lg font-semibold mb-4 text-emerald-400">
          Recent Attendance Logs
        </h3>

        {recentLogs.length > 0 ? (
          <>
            {/* ✅ Table view (desktop) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full text-sm text-left text-gray-300">
                <thead className="bg-gradient-to-r from-emerald-600/30 to-green-800/30 text-emerald-400">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th>Subject</th>
                    <th>Status</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {recentLogs.map((log, index) => (
                    <tr
                      key={index}
                      className="border-b border-white/10 hover:bg-neutral-800/40 transition"
                    >
                      <td className="px-4 py-3">{formatDate(log.date)}</td>
                      <td>{log.subject_code} – {log.subject_title}</td>
                      <td>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            log.status === "Present"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : log.status === "Late"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td>{formatTime(log.time)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ✅ Card view (mobile & tablet) */}
            <div className="md:hidden flex flex-col gap-4">
              {recentLogs.map((log, index) => (
                <div
                  key={index}
                  className="bg-neutral-800/60 p-4 rounded-xl border border-white/10 shadow hover:shadow-lg transition"
                >
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm text-gray-400">{formatDate(log.date)}</p>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        log.status === "Present"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : log.status === "Late"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {log.status}
                    </span>
                  </div>
                  <p className="font-semibold text-white text-sm mb-1">
                    {log.subject_code} – {log.subject_title}
                  </p>
                  <p className="text-xs text-gray-400">Time: {formatTime(log.time)}</p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-gray-400 italic">No recent logs available.</p>
        )}
</div>
    </div>
  );
};

export default StudentOverview;
