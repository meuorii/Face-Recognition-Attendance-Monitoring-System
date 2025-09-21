// src/components/Instructor/InstructorOverview.jsx
import { useEffect, useState } from "react";
import {
  FaChalkboardTeacher,
  FaUsers,
  FaCalendarAlt,
  FaChartLine,
  FaClipboardList,
  FaCheckCircle,
  FaTimesCircle,
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

  const COLORS = ["#22c55e", "#facc15", "#ef4444"]; // ✅ green, yellow, red

  useEffect(() => {
    if (!instructor?.instructor_id || !token) {
      toast.error("Instructor not logged in.");
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const headers = { Authorization: `Bearer ${token}` };

        // ✅ Parallel requests
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
        setAttendanceTrend(trendRes.data);
        setClassSummary(classRes.data);
      } catch (err) {
        console.error(
          "❌ Failed to load overview:",
          err.response?.data || err.message
        );
        toast.error("Failed to load overview data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [instructor?.instructor_id, token]);

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-400">
        Loading instructor overview...
      </div>
    );
  }

  if (!overviewData) {
    return (
      <div className="p-6 text-center text-red-400">
        Failed to load overview data.
      </div>
    );
  }

  return (
    <div className="p-6 bg-neutral-900 min-h-screen rounded-xl text-white">
      {/* Header */}
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-green-400">
        <FaChalkboardTeacher /> Instructor Overview
      </h2>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-10">
        <div className="bg-neutral-800 p-5 rounded-xl shadow flex items-center gap-4">
          <FaChalkboardTeacher className="text-green-400 text-3xl" />
          <div>
            <p className="text-gray-400 text-sm">Total Classes</p>
            <h3 className="text-xl font-semibold">
              {overviewData.totalClasses}
            </h3>
          </div>
        </div>
        <div className="bg-neutral-800 p-5 rounded-xl shadow flex items-center gap-4">
          <FaUsers className="text-green-400 text-3xl" />
          <div>
            <p className="text-gray-400 text-sm">Total Students</p>
            <h3 className="text-xl font-semibold">
              {overviewData.totalStudents}
            </h3>
          </div>
        </div>
        <div className="bg-neutral-800 p-5 rounded-xl shadow flex items-center gap-4">
          <FaCalendarAlt className="text-green-400 text-3xl" />
          <div>
            <p className="text-gray-400 text-sm">Active Sessions</p>
            <h3 className="text-xl font-semibold">
              {overviewData.activeSessions}
            </h3>
          </div>
        </div>
        <div className="bg-neutral-800 p-5 rounded-xl shadow flex items-center gap-4">
          <FaCheckCircle className="text-green-400 text-3xl" />
          <div>
            <p className="text-gray-400 text-sm">Present</p>
            <h3 className="text-xl font-semibold">
              {overviewData.present || 0}
            </h3>
          </div>
        </div>
        <div className="bg-neutral-800 p-5 rounded-xl shadow flex items-center gap-4">
          <FaClock className="text-yellow-400 text-3xl" />
          <div>
            <p className="text-gray-400 text-sm">Late</p>
            <h3 className="text-xl font-semibold">{overviewData.late || 0}</h3>
          </div>
        </div>
      </div>

      {/* Attendance Rate Progress */}
      <div className="bg-neutral-800 p-5 rounded-xl shadow mb-10">
        <p className="text-gray-400 text-sm mb-1">Attendance Rate</p>
        <div className="w-full bg-neutral-700 rounded-full h-3">
          <div
            className="bg-green-500 h-3 rounded-full"
            style={{ width: `${overviewData.attendanceRate}%` }}
          />
        </div>
        <p className="text-right text-sm font-semibold mt-1">
          {overviewData.attendanceRate}%
        </p>
      </div>

      {/* Middle Section: Attendance Trend + Attendance Pie */}
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
                  { name: "Present", value: overviewData.present || 0 },
                  { name: "Late", value: overviewData.late || 0 },
                  { name: "Absent", value: overviewData.absent || 0 },
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

      {/* Class Summary */}
      <div className="bg-neutral-800 p-6 rounded-xl shadow">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-green-400">
          <FaChalkboardTeacher /> My Classes
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left text-gray-300">
            <thead className="bg-neutral-700 text-green-400">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th>Title</th>
                <th>Section</th>
                <th>Schedule</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {classSummary.map((c, index) => (
                <tr
                  key={index}
                  className="border-b border-neutral-700 hover:bg-neutral-700/40 transition"
                >
                  <td className="px-4 py-3">{c.subject_code}</td>
                  <td>{c.subject_title}</td>
                  <td>{c.section}</td>
                  <td>
                    {c.schedule_blocks?.length > 0
                      ? c.schedule_blocks
                          .map(
                            (b) =>
                              `${b.days?.join(", ")} • ${b.start}-${b.end}`
                          )
                          .join(" | ")
                      : "N/A"}
                  </td>
                  <td
                    className={
                      c.is_attendance_active
                        ? "text-green-400 font-semibold"
                        : "text-red-400 font-semibold"
                    }
                  >
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
