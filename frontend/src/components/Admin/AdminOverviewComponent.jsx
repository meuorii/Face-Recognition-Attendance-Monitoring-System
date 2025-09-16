import { useEffect, useMemo, useState } from "react";
import axios from "axios";

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
    spoof_attempts_today: 0,
  });

  const [distribution, setDistribution] = useState({
    present: 0,
    late: 0,
    absent: 0,
  });

  const [trend, setTrend] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);
  const [lastSpoof, setLastSpoof] = useState(null);
  const [lastStudent, setLastStudent] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const [
          statsRes,
          distRes,
          trendRes,
          recentRes,
          spoofRes,
          lastStudRes,
        ] = await Promise.allSettled([
          API.get("/api/admin/overview/stats"),
          API.get("/api/admin/overview/attendance-distribution"),
          API.get("/api/admin/overview/attendance-trend", { params: { days: 7 } }),
          API.get("/api/admin/overview/recent-logs", { params: { limit: 5 } }),
          API.get("/api/admin/overview/last-spoof"),
          API.get("/api/admin/overview/last-student"),
        ]);

        if (statsRes.status === "fulfilled") setStats(normalizeStats(statsRes.value.data));
        if (distRes.status === "fulfilled") setDistribution(normalizeDistribution(distRes.value.data));
        if (trendRes.status === "fulfilled") setTrend(Array.isArray(trendRes.value.data) ? trendRes.value.data : []);
        if (recentRes.status === "fulfilled") setRecentLogs(Array.isArray(recentRes.value.data) ? recentRes.value.data : []);
        if (spoofRes.status === "fulfilled") setLastSpoof(spoofRes.value.data || null);
        if (lastStudRes.status === "fulfilled") setLastStudent(lastStudRes.value.data || null);
      } catch (e) {
        setErr(e?.response?.data?.error || "Failed to load overview.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const totalDist = Math.max(
    1,
    (distribution.present || 0) + (distribution.late || 0) + (distribution.absent || 0)
  );

  const trendMax = useMemo(
    () => Math.max(1, ...trend.map((t) => Number(t?.count) || 0)),
    [trend]
  );

  return (
    <div className="space-y-8">
      {/* ✅ Header */}
      <div className="text-center md:text-left">
        <h1 className="text-2xl md:text-3xl font-bold text-green-400">
          Admin Dashboard Overview
        </h1>
        <p className="text-neutral-400 text-sm mt-1">
          A summary of students, instructors, attendance, and recent activities.
        </p>
      </div>

      {/* ✅ Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard label="Total Students" value={stats.total_students} />
        <StatCard label="Total Instructors" value={stats.total_instructors} />
        <StatCard label="Classes / Subjects" value={stats.total_classes} />
        <StatCard label="Attendance Today" value={stats.attendance_today} />
        <StatCard label="Spoof Attempts" value={stats.spoof_attempts_today} />
      </div>

      {/* ✅ Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Distribution */}
        <Card>
          <h3 className="font-semibold text-lg mb-4">Attendance Distribution</h3>
          <div className="flex items-center justify-center">
            <div
              className="w-28 h-28 sm:w-36 sm:h-36 md:w-40 md:h-40 lg:w-44 lg:h-44 rounded-full shadow-inner border border-neutral-700"
              style={{
                background: `conic-gradient(
                  #22c55e 0% ${(distribution.present / totalDist) * 100}%,
                  #eab308 ${(distribution.present / totalDist) * 100}% ${
                    ((distribution.present + distribution.late) / totalDist) * 100
                  }%,
                  #dc2626 ${((distribution.present + distribution.late) / totalDist) * 100}% 100%
                )`,
              }}
            />
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-xs sm:text-sm text-neutral-300 mt-4">
            <Legend color="bg-green-600" label="Present" value={distribution.present} />
            <Legend color="bg-yellow-500" label="Late" value={distribution.late} />
            <Legend color="bg-red-600" label="Absent" value={distribution.absent} />
          </div>
        </Card>

        {/* Trend */}
        <Card className="md:col-span-1 lg:col-span-2">
          <h3 className="font-semibold text-lg mb-4">Attendance Trend (7 Days)</h3>
          <div className="flex items-end gap-2 h-36 sm:h-44">
            {trend.length === 0 ? (
              <div className="text-neutral-500 text-sm">No data</div>
            ) : (
              trend.map((t) => (
                <div key={t.date} className="flex flex-col items-center flex-1">
                  <div
                    className="w-full bg-green-600 rounded-t"
                    style={{ height: `${(Number(t.count || 0) / trendMax) * 100}%` }}
                    title={`${t.date}: ${t.count}`}
                  />
                  <div className="mt-2 text-[10px] sm:text-[11px] text-neutral-400">
                    {formatDay(t.date)}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* ✅ Recent + Side panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <Card className="md:col-span-2 xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">Recent Attendance Logs</h3>
            <span className="text-xs text-neutral-400">Last 5</span>
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

        <div className="space-y-6">
          <Card>
            <h3 className="font-semibold text-lg mb-3">Last Spoof Attempt</h3>
            {lastSpoof ? (
              <ul className="text-sm text-neutral-300 space-y-1">
                <li><span className="text-neutral-400">Student:</span> {formatName(lastSpoof.student)}</li>
                <li><span className="text-neutral-400">Subject:</span> {lastSpoof.subject || "-"}</li>
                <li><span className="text-neutral-400">Reason:</span> {lastSpoof.reason || "-"}</li>
                <li><span className="text-neutral-400">Detected:</span> {formatDateTime(lastSpoof.detected_at)}</li>
              </ul>
            ) : (
              <div className="text-neutral-500 text-sm">No spoof attempts.</div>
            )}
          </Card>

          <Card>
            <h3 className="font-semibold text-lg mb-3">Last Student Registered</h3>
            {lastStudent ? (
              <ul className="text-sm text-neutral-300 space-y-1">
                <li><span className="text-neutral-400">Name:</span> {formatName(lastStudent)}</li>
                <li><span className="text-neutral-400">ID:</span> {lastStudent.student_id || "-"}</li>
                <li><span className="text-neutral-400">Registered:</span> {formatDateTime(lastStudent.created_at)}</li>
              </ul>
            ) : (
              <div className="text-neutral-500 text-sm">No recent registration.</div>
            )}
          </Card>
        </div>
      </div>

      {/* ✅ Status */}
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
    spoof_attempts_today: s.spoof_attempts_today ?? 0,
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
    <div className={`rounded-xl bg-neutral-800 border border-neutral-700 p-5 shadow-lg ${className}`}>
      {children}
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <Card>
      <p className="text-sm text-neutral-400">{label}</p>
      <p className="text-2xl font-bold text-green-400">{value ?? 0}</p>
    </Card>
  );
}

function Legend({ color, label, value }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`inline-block w-3 h-3 rounded ${color}`} />
      <span className="text-neutral-400">{label}:</span>
      <span className="text-neutral-200">{value ?? 0}</span>
    </div>
  );
}

function Table({ columns = [], rows = [] }) {
  return (
    <div className="overflow-auto rounded-lg border border-neutral-800">
      <table className="min-w-full text-sm">
        <thead className="bg-neutral-900 text-neutral-300">
          <tr>
            {columns.map((c) => (
              <th key={c} className="px-3 py-2 text-left font-medium">{c}</th>
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
              <tr key={i} className="border-t border-neutral-800 hover:bg-neutral-900/50">
                {columns.map((c) => (
                  <td key={c} className="px-3 py-2 align-top">{r[c]}</td>
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
    <span className={`px-2 py-1 rounded-md text-xs border inline-block ${cls}`}>
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
    return d.toLocaleString();
  } catch {
    return dt;
  }
}

function formatDay(yyyy_mm_dd) {
  if (!yyyy_mm_dd) return "";
  const d = new Date(yyyy_mm_dd);
  if (isNaN(d.getTime())) return yyyy_mm_dd;
  return d.toLocaleDateString(undefined, { weekday: "short" });
}
