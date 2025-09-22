// src/components/Student/StudentOverview.jsx
import { useEffect, useState } from "react";
import {
  FaUserGraduate,
  FaCalendarAlt,
  FaClipboardList,
  FaChartLine,
  FaBook,
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

const StudentOverview = () => {
  const [overviewData, setOverviewData] = useState(null);
  const [attendanceTrend, setAttendanceTrend] = useState([]);
  const [subjectSummary, setSubjectSummary] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const student = JSON.parse(localStorage.getItem("userData"));
  const token = localStorage.getItem("token");

  const COLORS = ["#22c55e", "#ef4444", "#facc15"]; // Present, Absent, Late

  // ✅ Format Date (Month Day, Year)
  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // ✅ Format Time (AM/PM)
  const formatTime = (timeStr) => {
    if (!timeStr) return "N/A";
    const date = new Date(`1970-01-01T${timeStr}`);
    if (isNaN(date.getTime())) return timeStr;
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
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
        console.error(
          "❌ Failed to load student overview:",
          err.response?.data || err.message
        );
        toast.error("Failed to load student overview data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [student?.student_id, token]);

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-400">
        Loading student overview...
      </div>
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
    <div className="p-6 bg-neutral-900 min-h-screen rounded-xl text-white">
      {/* Header */}
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-green-400">
        <FaUserGraduate /> Welcome, {student.first_name} {student.last_name}
      </h2>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="bg-neutral-800 p-5 rounded-xl shadow flex items-center gap-4">
          <FaBook className="text-green-400 text-3xl" />
          <div>
            <p className="text-gray-400 text-sm">Classes Enrolled</p>
            <h3 className="text-xl font-semibold">
              {overviewData.totalClasses}
            </h3>
          </div>
        </div>
        <div className="bg-neutral-800 p-5 rounded-xl shadow flex items-center gap-4">
          <FaCalendarAlt className="text-green-400 text-3xl" />
          <div>
            <p className="text-gray-400 text-sm">Total Sessions</p>
            <h3 className="text-xl font-semibold">
              {overviewData.totalSessions}
            </h3>
          </div>
        </div>
        <div className="bg-neutral-800 p-5 rounded-xl shadow flex items-center gap-4">
          <FaClipboardList className="text-green-400 text-3xl" />
          <div>
            <p className="text-gray-400 text-sm">Attendance Rate</p>
            <h3 className="text-xl font-semibold">
              {overviewData.attendanceRate}%
            </h3>
          </div>
        </div>
        <div className="bg-neutral-800 p-5 rounded-xl shadow flex items-center gap-4">
          <FaClock className="text-yellow-400 text-3xl" />
          <div>
            <p className="text-gray-400 text-sm">Total Lates</p>
            <h3 className="text-xl font-semibold text-yellow-400">
              {overviewData.late}
            </h3>
          </div>
        </div>
      </div>

      {/* Middle Section: Attendance Trend + Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        {/* Attendance Trend */}
        <div className="bg-neutral-800 p-6 rounded-xl shadow">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-green-400">
            <FaChartLine /> Attendance Trend
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={attendanceTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="_id" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="rate"
                stroke="#22c55e"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Attendance Distribution */}
        <div className="bg-neutral-800 p-6 rounded-xl shadow">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-green-400">
            <FaClipboardList /> Attendance Distribution
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={[
                  { name: "Present", value: overviewData.present },
                  { name: "Absent", value: overviewData.absent },
                  { name: "Late", value: overviewData.late },
                ]}
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
                dataKey="value"
              >
                {COLORS.map((color, index) => (
                  <Cell key={`cell-${index}`} fill={color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Subject Breakdown */}
      <div className="bg-neutral-800 p-6 rounded-xl shadow mb-10">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-green-400">
          <FaBook /> Subject Breakdown
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left text-gray-300">
            <thead className="bg-neutral-700 text-green-400">
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
                const subjTotal = (subj.present || 0) + (subj.absent || 0) + (subj.late || 0);
                const subjRate = subjTotal > 0 ? ((subjPresent / subjTotal) * 100).toFixed(1) : 0;

                return (
                  <tr
                    key={index}
                    className="border-b border-neutral-700 hover:bg-neutral-700/40 transition"
                  >
                    <td className="px-4 py-3">{subj.subject_code}</td>
                    <td>{subj.subject_title}</td>
                    <td className="text-green-400">{subj.present}</td>
                    <td className="text-red-400">{subj.absent}</td>
                    <td className="text-yellow-400">{subj.late}</td>
                    <td>{subjRate}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Attendance Logs */}
      <div className="bg-neutral-800 p-6 rounded-xl shadow">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-green-400">
          <FaCalendarAlt /> Recent Attendance Logs
        </h3>
        {recentLogs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left text-gray-300">
              <thead className="bg-neutral-700 text-green-400">
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
                    className="border-b border-neutral-700 hover:bg-neutral-700/40 transition"
                  >
                    <td className="px-4 py-3">{formatDate(log.date)}</td>
                    <td>
                      {log.subject_code} – {log.subject_title}
                    </td>
                    <td
                      className={`font-semibold ${
                        log.status === "Present" || log.status === "Late"
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {log.status}
                    </td>
                    <td>{formatTime(log.time)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-400 italic">No recent logs available.</p>
        )}
      </div>
    </div>
  );
};

export default StudentOverview;
