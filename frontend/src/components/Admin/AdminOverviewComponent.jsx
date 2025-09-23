// src/components/Admin/AdminOverviewComponent.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from "recharts";
import {
  FaUserGraduate,
  FaChalkboardTeacher,
  FaBook,
  FaCalendarCheck,
  FaChartPie,
  FaChartBar,
  FaListAlt,
  FaUserCircle,
} from "react-icons/fa";

/** Axios instance */
const API = axios.create({ baseURL: "http://localhost:5000" });
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default function AdminOverviewComponent() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [stats, setStats] = useState({
    total_students: 0,
    total_instructors: 0,
    total_classes: 0,
    attendance_today: 0,
  });

  const [distribution, setDistribution] = useState({
    present: 0,
    late: 0,
    absent: 0,
  });

  const [trend, setTrend] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);
  const [lastStudent, setLastStudent] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const [statsRes, distRes, trendRes, recentRes, lastStudRes] =
          await Promise.allSettled([
            API.get("/api/admin/overview/stats"),
            API.get("/api/admin/overview/attendance-distribution"),
            API.get("/api/admin/overview/attendance-trend", { params: { days: 7 } }),
            API.get("/api/admin/overview/recent-logs", { params: { limit: 5 } }),
            API.get("/api/admin/overview/last-student"),
          ]);

        if (statsRes.status === "fulfilled") setStats(normalizeStats(statsRes.value.data));
        if (distRes.status === "fulfilled") setDistribution(normalizeDistribution(distRes.value.data));
        if (trendRes.status === "fulfilled") {
          const tdata = trendRes.value.data.trend || trendRes.value.data;
          setTrend(Array.isArray(tdata) ? tdata : []);
        }
        if (recentRes.status === "fulfilled") setRecentLogs(Array.isArray(recentRes.value.data) ? recentRes.value.data : []);
        if (lastStudRes.status === "fulfilled") setLastStudent(lastStudRes.value.data || null);
      } catch (e) {
        setErr(e?.response?.data?.error || "Failed to load overview.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const COLORS = ["#22c55e", "#eab308", "#ef4444"];

  return (
    <div className="space-y-10">
      {/* ✅ Header */}
      <div className="text-center md:text-left">
        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent flex items-center gap-2">
           Admin Dashboard Overview
        </h1>
        <p className="text-neutral-400 text-sm mt-1">
          Monitor student, instructor, and class activities in real-time.
        </p>
      </div>

      {/* ✅ Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<FaUserGraduate />} label="Total Students" value={stats.total_students} />
        <StatCard icon={<FaChalkboardTeacher />} label="Instructors" value={stats.total_instructors} />
        <StatCard icon={<FaBook />} label="Classes" value={stats.total_classes} />
        <StatCard icon={<FaCalendarCheck />} label="Attendance Today" value={stats.attendance_today} />
      </div>

      {/* ✅ Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-green-400">
            <FaChartPie /> Attendance Distribution
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={[
                  { name: "Present", value: distribution.present },
                  { name: "Late", value: distribution.late },
                  { name: "Absent", value: distribution.absent },
                ]}
                cx="50%"
                cy="50%"
                outerRadius={90}
                label
                dataKey="value"
              >
                {["Present", "Late", "Absent"].map((entry, idx) => (
                  <Cell key={`cell-${idx}`} fill={COLORS[idx]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-green-400">
            <FaChartBar /> Attendance Trend (7 Days)
          </h3>
          {trend.length === 0 ? (
            <div className="text-neutral-500 text-sm">No data available</div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" tick={{ fill: "#9CA3AF" }} />
                <YAxis tick={{ fill: "#9CA3AF" }} />
                <Tooltip />
                <Bar dataKey="count" fill="#22c55e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* ✅ Recent Logs + Last Student */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg flex items-center gap-2 text-green-400">
              <FaListAlt /> Recent Attendance Logs
            </h3>
            <span className="text-xs text-neutral-400">Last 5 Records</span>
          </div>
          <Table
            columns={["Student", "Subject", "Status", "Timestamp"]}
            rows={recentLogs.map((log) => ({
              Student: formatName(log?.student),
              Subject: log?.subject || "-",
              Status: badge(log?.status),
              Timestamp: formatDateTime(log?.timestamp),
            }))}
          />
        </Card>

        <Card>
          <h3 className="font-semibold text-lg mb-3 flex items-center gap-2 text-green-400">
            Last Student Registered
          </h3>
          {lastStudent ? (
            <div className="bg-neutral-900 p-5 rounded-lg shadow-inner flex items-center gap-4">
              <FaUserCircle className="text-5xl text-green-400" />
              <div>
                <p className="text-lg font-bold text-green-400">{formatName(lastStudent)}</p>
                <p className="text-sm text-neutral-300">ID: {lastStudent.student_id || "-"}</p>
                <p className="text-xs text-neutral-400 mt-1">
                  Registered: {formatDateTime(lastStudent.created_at)}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-neutral-500 text-sm">No recent registration.</div>
          )}
        </Card>
      </div>

      {loading && <div className="text-neutral-400 text-sm">Loading overview…</div>}
      {err && <div className="text-red-400 text-sm">{err}</div>}
    </div>
  );
}

/* ============== helpers ============== */
function normalizeStats(s = {}) {
  return {
    total_students: s.total_students ?? 0,
    total_instructors: s.total_instructors ?? 0,
    total_classes: s.total_classes ?? 0,
    attendance_today: s.attendance_today ?? 0,
  };
}

function normalizeDistribution(d = {}) {
  return {
    present: d.present ?? 0,
    late: d.late ?? 0,
    absent: d.absent ?? 0,
  };
}

function Card({ children, className = "" }) {
  return (
    <div
      className={`rounded-xl bg-neutral-800 border border-neutral-700 p-5 shadow-lg hover:shadow-green-500/10 transition ${className}`}
    >
      {children}
    </div>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <Card className="flex flex-col items-center justify-center text-center hover:scale-105 transition-transform">
      <div className="text-3xl mb-2 text-green-400">{icon}</div>
      <p className="text-sm text-neutral-400">{label}</p>
      <p className="text-2xl font-extrabold text-white">{value ?? 0}</p>
    </Card>
  );
}

function Table({ columns = [], rows = [] }) {
  return (
    <div className="overflow-auto rounded-lg border border-neutral-800">
      <table className="min-w-full text-sm">
        <thead className="bg-neutral-900 text-neutral-300">
          <tr>
            {columns.map((c) => (
              <th key={c} className="px-4 py-3 text-left font-medium">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td className="px-3 py-6 text-neutral-500 text-center" colSpan={columns.length}>
                No data
              </td>
            </tr>
          ) : (
            rows.map((r, i) => (
              <tr
                key={i}
                className={`border-t border-neutral-800 hover:bg-neutral-900/70 transition ${i % 2 === 0 ? "bg-neutral-800/40" : ""}`}
              >
                {columns.map((c) => (
                  <td key={c} className="px-4 py-3 align-top">{r[c]}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function badge(status) {
  const s = String(status || "").toLowerCase();
  const map = {
    present: "bg-green-600/20 text-green-300 border-green-600/40",
    late: "bg-yellow-600/20 text-yellow-300 border-yellow-600/40",
    absent: "bg-red-600/20 text-red-300 border-red-600/40",
  };
  const cls = map[s] || "bg-neutral-700/40 text-neutral-300 border-neutral-600/40";
  return (
    <span className={`px-2 py-1 rounded-md text-xs border inline-block font-medium ${cls}`}>
      {status || "-"}
    </span>
  );
}

function formatName(obj) {
  if (!obj) return "-";
  const fn = obj.first_name || obj.firstName || "";
  const ln = obj.last_name || obj.lastName || "";
  const full = (obj.full_name || obj.fullName || `${fn} ${ln}`).trim();
  return full || "-";
}

function formatDateTime(dt) {
  if (!dt) return "-";
  try {
    const d = new Date(dt);
    return d.toLocaleString("en-PH", { timeZone: "Asia/Manila" });
  } catch {
    return dt;
  }
}
