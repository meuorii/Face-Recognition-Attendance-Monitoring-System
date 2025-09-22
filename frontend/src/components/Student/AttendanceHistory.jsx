// src/components/Student/AttendanceHistory.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAttendanceLogsByStudent } from "../../services/api";
import { toast } from "react-toastify";
import { FaCheckCircle, FaTimesCircle, FaClock, FaDownload } from "react-icons/fa";

const AttendanceHistory = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [summary, setSummary] = useState({
    totalSessions: 0,
    present: 0,
    absent: 0,
    late: 0,
    attendanceRate: 0,
  });
  const [subjectFilter, setSubjectFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const userData = localStorage.getItem("userData");
  const student = userData ? JSON.parse(userData) : null;
  const studentId = student?.student_id;

  // ✅ Format Date
  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";

    // Match YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [y, m, d] = dateStr.split("-");
      return new Date(y, m - 1, d).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }

    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;

    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // ✅ Format Time
  const formatTime = (timeStr) => {
    if (!timeStr) return "—";

    // If it's plain HH:MM or HH:MM:SS
    if (/^\d{2}:\d{2}(:\d{2})?$/.test(timeStr)) {
      return timeStr; // Keep raw for now
    }

    const d = new Date(timeStr);
    if (isNaN(d.getTime())) return timeStr;

    return d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // ✅ CSV Export
  const exportToCSV = () => {
    const headers = ["Subject", "Date", "Time", "Status"];
    const rows = filteredLogs.map((log) => [
      `${log.subject_code || ""} ${log.subject_title || ""}`.trim() || "—",
      formatDate(log.date),
      formatTime(log.time),
      log.status,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = `attendance_history_${studentId}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ✅ Fetch Logs + Summary from backend
  useEffect(() => {
    if (!studentId) {
      toast.error("Student not logged in.");
      navigate("/student/login");
      return;
    }

    const fetchLogs = async () => {
      try {
        const data = await getAttendanceLogsByStudent(studentId);
        console.log("✅ Attendance API response:", data);

        setLogs(data.logs || []);
        setFilteredLogs(data.logs || []);
        setSummary(data.summary || {});
      } catch (err) {
        console.error("Fetch error:", err);
        toast.error("Failed to load attendance logs.");
      }
    };

    fetchLogs();
  }, [studentId, navigate]);

  // ✅ Apply Filters
  useEffect(() => {
    let filtered = [...logs];

    if (subjectFilter) {
      filtered = filtered.filter((log) =>
        `${log.subject_code || ""} ${log.subject_title || ""}`
          .toLowerCase()
          .includes(subjectFilter.toLowerCase())
      );
    }

    if (fromDate) {
      filtered = filtered.filter(
        (log) => new Date(log.date) >= new Date(fromDate)
      );
    }

    if (toDate) {
      filtered = filtered.filter(
        (log) => new Date(log.date) <= new Date(toDate)
      );
    }

    setFilteredLogs(filtered);
  }, [subjectFilter, fromDate, toDate, logs]);

  return (
    <div className="bg-neutral-900 p-6 rounded-2xl shadow-md border border-neutral-700 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-white text-2xl font-semibold border-b border-neutral-700 pb-2">
          Attendance History
        </h2>
        {filteredLogs.length > 0 && (
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white text-sm px-4 py-2 rounded-lg transition"
          >
            <FaDownload /> Export CSV
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-neutral-800 p-4 rounded-xl text-center">
          <p className="text-gray-400">Total Sessions</p>
          <p className="text-2xl font-bold text-white">
            {summary.totalSessions || 0}
          </p>
        </div>
        <div className="bg-neutral-800 p-4 rounded-xl text-center">
          <p className="text-gray-400 flex items-center gap-1 justify-center">
            <FaCheckCircle className="text-green-400" /> Present
          </p>
          <p className="text-2xl font-bold text-green-400">
            {summary.present || 0}
          </p>
        </div>
        <div className="bg-neutral-800 p-4 rounded-xl text-center">
          <p className="text-gray-400 flex items-center gap-1 justify-center">
            <FaTimesCircle className="text-red-400" /> Absent
          </p>
          <p className="text-2xl font-bold text-red-400">
            {summary.absent || 0}
          </p>
        </div>
        <div className="bg-neutral-800 p-4 rounded-xl text-center">
          <p className="text-gray-400 flex items-center gap-1 justify-center">
            <FaClock className="text-yellow-400" /> Late
          </p>
          <p className="text-2xl font-bold text-yellow-400">
            {summary.late || 0}
          </p>
        </div>
      </div>

      {/* Attendance Rate */}
      <div className="mb-6">
        <p className="text-gray-400 text-sm mb-1">Attendance Rate</p>
        <div className="w-full bg-neutral-700 rounded-full h-3">
          <div
            className="bg-green-500 h-3 rounded-full transition-all"
            style={{ width: `${summary.attendanceRate || 0}%` }}
          />
        </div>
        <p className="text-right text-sm text-gray-300 mt-1">
          {summary.attendanceRate || 0}%
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <input
          type="text"
          placeholder="Filter by subject..."
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
          className="px-4 py-2 rounded-lg bg-neutral-800 text-white border border-neutral-700 focus:ring-2 focus:ring-green-500 w-full md:w-1/3"
        />
        <input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          className="px-4 py-2 rounded-lg bg-neutral-800 text-white border border-neutral-700 focus:ring-2 focus:ring-green-500 w-full md:w-1/4"
        />
        <input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          className="px-4 py-2 rounded-lg bg-neutral-800 text-white border border-neutral-700 focus:ring-2 focus:ring-green-500 w-full md:w-1/4"
        />
      </div>

      {/* Logs Table */}
      {filteredLogs.length > 0 ? (
        <div className="overflow-x-auto border border-neutral-700 rounded-xl">
          <table className="min-w-full text-sm text-gray-300">
            <thead className="bg-neutral-800 text-green-400">
              <tr>
                <th className="py-3 px-4 text-left">Subject</th>
                <th className="py-3 px-4 text-left">Date</th>
                <th className="py-3 px-4 text-left">Time</th>
                <th className="py-3 px-4 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log, idx) => (
                <tr
                  key={idx}
                  className="border-b border-neutral-700 hover:bg-neutral-800/60 transition"
                >
                  <td className="py-2 px-4">
                    {log.subject_code || ""} {log.subject_title || "—"}
                  </td>
                  <td className="py-2 px-4">{formatDate(log.date)}</td>
                  <td className="py-2 px-4">{formatTime(log.time)}</td>
                  <td className="py-2 px-4">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        log.status === "Present"
                          ? "bg-green-500/20 text-green-400"
                          : log.status === "Late"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-gray-400 text-sm mt-4 text-center">
          No attendance records found.
        </p>
      )}
    </div>
  );
};

export default AttendanceHistory;
