// src/components/Instructor/AttendanceReport.jsx
import { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  getClassesByInstructor,
  getAttendanceReportByClass,
  getAttendanceReportAll,
} from "../../services/api";
import { toast } from "react-toastify";
import {
  FaFilePdf,
  FaCalendarAlt,
  FaClipboardList,
  FaListUl,
} from "react-icons/fa";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useModal } from "./ModalManager"; // ✅ use global modal context
import DailyLogsModal from "./DailyLogsModal";

const COLORS = ["#22c55e", "#ef4444", "#facc15"]; // green, red, yellow

const AttendanceReport = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [logs, setLogs] = useState([]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");

  const instructor = JSON.parse(localStorage.getItem("userData"));
  const token = localStorage.getItem("token");
  const { openModal } = useModal(); // ✅ use modal manager

  // Load classes + all logs on mount
  useEffect(() => {
    if (instructor?.instructor_id && token) {
      fetchClasses();
      fetchLogs(); // load all logs initially
    } else {
      toast.error("No instructor data found. Please log in again.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchClasses = async () => {
    setLoadingClasses(true);
    try {
      const data = await getClassesByInstructor(instructor.instructor_id, token);
      setClasses(data);
    } catch (err) {
      console.error("❌ Failed to load classes:", err);
      toast.error("Failed to load classes.");
    } finally {
      setLoadingClasses(false);
    }
  };

  const fetchLogs = async () => {
    const from = startDate ? startDate.toISOString().split("T")[0] : null;
    const to = endDate ? endDate.toISOString().split("T")[0] : null;

    setLoadingLogs(true);
    try {
      let data = [];
      if (selectedClass) {
        data = await getAttendanceReportByClass(selectedClass, from, to);
      } else {
        data = await getAttendanceReportAll(from, to);
      }

      // Group logs by student_id
      const grouped = {};
      data.forEach((log) => {
        const sid = log.student_id;
        if (!sid) return;

        if (!grouped[sid]) {
          grouped[sid] = {
            student_id: log.student_id,
            first_name: log.first_name,
            last_name: log.last_name,
            total_attendances: 0,
            present: 0,
            absent: 0,
            late: 0,
            statuses: [],
          };
        }
        grouped[sid].total_attendances++;
        if (log.status === "Present") grouped[sid].present++;
        if (log.status === "Absent") grouped[sid].absent++;
        if (log.status === "Late") grouped[sid].late++;
        grouped[sid].statuses.push({
          date: log.date,
          status: log.status,
          time: log.time,
          subject_code: log.subject_code || null,
          subject_title: log.subject_title || null
        });
      });

      setLogs(Object.values(grouped));
    } catch (err) {
      console.error("❌ Failed to fetch attendance logs:", err);
      toast.error("Failed to fetch attendance logs.");
    } finally {
      setLoadingLogs(false);
    }
  };

  // Auto-refresh logs when class changes
  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClass]);

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Attendance Report", 14, 15);
    autoTable(doc, {
      startY: 25,
      head: [["Student ID", "Name", "Present", "Absent", "Late", "Total"]],
      body: logs.map((log) => [
        log.student_id,
        `${log.first_name} ${log.last_name}`,
        log.present,
        log.absent,
        log.late,
        log.total_attendances,
      ]),
    });
    doc.save("attendance_report.pdf");
  };

 // Summary stats
  const totalStudents = logs.length;
  const totalSessions = logs.reduce(
    (sum, log) => Math.max(sum, log.statuses.length),
    0
  );
  const totalRecords = logs.reduce(
    (sum, log) => sum + log.total_attendances,
    0
  );

  // ✅ Count both Present + Late as attended
  const totalAttended = logs.reduce(
    (sum, log) => sum + log.present + log.late,
    0
  );

  const attendanceRate = totalRecords
    ? ((totalAttended / totalRecords) * 100).toFixed(2)
    : 0;

  // Chart data
  const pieData = [
    { name: "Present", value: logs.reduce((sum, log) => sum + log.present, 0) },
    { name: "Absent", value: logs.reduce((sum, log) => sum + log.absent, 0) },
    { name: "Late", value: logs.reduce((sum, log) => sum + log.late, 0) },
  ];
  const barData = logs.map((log) => ({
    name: `${log.first_name} ${log.last_name}`,
    Present: log.present,
    Absent: log.absent,
    Late: log.late,
  }));

  return (
    <div className="bg-neutral-900 p-8 rounded-2xl shadow-lg border border-neutral-700 w-full">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <FaClipboardList className="text-green-400 text-2xl" />
        <h2 className="text-2xl font-bold text-green-400">Attendance Report</h2>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4 mb-8">
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          disabled={loadingClasses}
          className="flex-1 px-4 py-3 rounded-lg bg-neutral-800 border border-neutral-700 text-white"
        >
          <option value="">-- All Classes --</option>
          {classes.map((c) => (
            <option key={c._id} value={c.class_id || c._id}>
              {c.subject_code} – {c.subject_title}
            </option>
          ))}
        </select>

        {/* Start Date */}
        <div className="flex items-center gap-2 bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2">
          <FaCalendarAlt className="text-green-400" />
          <DatePicker
            selected={startDate}
            onChange={(date) => setStartDate(date)}
            placeholderText="Start Date"
            className="bg-transparent text-white outline-none"
          />
        </div>

        {/* End Date */}
        <div className="flex items-center gap-2 bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2">
          <FaCalendarAlt className="text-green-400" />
          <DatePicker
            selected={endDate}
            onChange={(date) => setEndDate(date)}
            placeholderText="End Date"
            className="bg-transparent text-white outline-none"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-3 rounded-lg bg-neutral-800 border border-neutral-700 text-white"
        >
          <option>All</option>
          <option>Present</option>
          <option>Absent</option>
          <option>Late</option>
        </select>

        <button
          onClick={fetchLogs}
          disabled={loadingLogs}
          className="px-6 py-3 rounded-lg bg-green-500 hover:bg-green-600 text-white font-semibold shadow transition"
        >
          {loadingLogs ? "Loading..." : "Filter"}
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-neutral-800 p-4 rounded-lg border border-neutral-700">
          <p className="text-gray-400">Total Students</p>
          <p className="text-2xl font-bold text-white">{totalStudents}</p>
        </div>
        <div className="bg-neutral-800 p-4 rounded-lg border border-neutral-700">
          <p className="text-gray-400">Total Sessions</p>
          <p className="text-2xl font-bold text-white">{totalSessions}</p>
        </div>
        <div className="bg-neutral-800 p-4 rounded-lg border border-neutral-700">
          <p className="text-gray-400">Total Records</p>
          <p className="text-2xl font-bold text-white">{totalRecords}</p>
        </div>
        <div className="bg-neutral-800 p-4 rounded-lg border border-neutral-700">
          <p className="text-gray-400">Attendance Rate</p>
          <p className="text-2xl font-bold text-green-400">{attendanceRate}%</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-neutral-800 p-4 rounded-lg border border-neutral-700">
          <h3 className="text-lg font-semibold text-green-400 mb-2">
            Status Distribution
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                outerRadius={100}
                label
              >
                {pieData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-neutral-800 p-4 rounded-lg border border-neutral-700">
          <h3 className="text-lg font-semibold text-green-400 mb-2">
            Per Student Breakdown
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={barData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="Present" fill="#22c55e" />
              <Bar dataKey="Absent" fill="#ef4444" />
              <Bar dataKey="Late" fill="#facc15" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Table */}
      {logs.length > 0 ? (
        <>
          <div className="overflow-x-auto rounded-lg border border-neutral-700">
            <table className="min-w-full text-sm text-left text-gray-300">
              <thead className="bg-neutral-800 text-green-400">
                <tr>
                  <th className="px-4 py-3">Student ID</th>
                  <th>Name</th>
                  <th>Present</th>
                  <th>Absent</th>
                  <th>Late</th>
                  <th>Total</th>
                  <th>Daily Logs</th>
                </tr>
              </thead>
              <tbody>
                {logs
                  .filter(
                    (log) =>
                      statusFilter === "All" ||
                      log.statuses.some((s) => s.status === statusFilter)
                  )
                  .map((log, index) => (
                    <tr
                      key={index}
                      className="border-b border-neutral-700 hover:bg-neutral-800/50 transition"
                    >
                      <td className="px-4 py-3">{log.student_id}</td>
                      <td className="font-medium text-white">
                        {`${log.first_name} ${log.last_name}`}
                      </td>
                      <td className="text-green-400 font-semibold">
                        {log.present}
                      </td>
                      <td className="text-red-400 font-semibold">
                        {log.absent}
                      </td>
                      <td className="text-yellow-400 font-semibold">
                        {log.late}
                      </td>
                      <td className="text-white">{log.total_attendances}</td>
                      <td>
                        <button
                          onClick={() =>
                            openModal(
                              <DailyLogsModal student={log} />
                            )
                          }
                          className="text-sm text-green-400 hover:underline flex items-center gap-1"
                        >
                          <FaListUl /> View
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Export Button */}
          <div className="flex justify-end mt-6">
            <button
              onClick={exportToPDF}
              className="flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg shadow transition"
            >
              <FaFilePdf /> Export as PDF
            </button>
          </div>
        </>
      ) : (
        <p className="text-gray-400 text-center mt-6">
          {loadingLogs
            ? "Loading attendance logs..."
            : "No attendance records found."}
        </p>
      )}
    </div>
  );
};

export default AttendanceReport;
