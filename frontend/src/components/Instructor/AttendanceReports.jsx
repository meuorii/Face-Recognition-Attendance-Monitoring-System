// src/components/Instructor/AttendanceReport.jsx
import { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  getClassesByInstructor,
  getAttendanceReportByClass,
} from "../../services/api";
import { toast } from "react-toastify";
import { FaFilePdf, FaCalendarAlt, FaClipboardList } from "react-icons/fa";

const AttendanceReport = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [logs, setLogs] = useState([]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // ✅ Consistent with Subjects.jsx
  const instructor = JSON.parse(localStorage.getItem("userData"));
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (instructor?.instructor_id && token) {
      fetchClasses();
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
    if (!selectedClass) return toast.warning("Please select a class.");
    const from = startDate ? startDate.toISOString().split("T")[0] : "";
    const to = endDate ? endDate.toISOString().split("T")[0] : "";

    setLoadingLogs(true);
    try {
      const data = await getAttendanceReportByClass(selectedClass, from, to);
      setLogs(data);
    } catch (err) {
      console.error("❌ Failed to fetch attendance logs:", err);
      toast.error("Failed to fetch attendance logs.");
    } finally {
      setLoadingLogs(false);
    }
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Attendance Report", 14, 15);
    autoTable(doc, {
      startY: 25,
      head: [["Date", "Student ID", "Name", "Status"]],
      body: logs.map((log) => [
        log.date,
        log.student_id,
        `${log.first_name} ${log.last_name}`,
        log.status,
      ]),
    });
    doc.save("attendance_report.pdf");
  };

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
          className="flex-1 px-4 py-3 rounded-lg bg-neutral-800 border border-neutral-700 text-white focus:outline-none focus:ring-2 focus:ring-green-400"
        >
          <option value="">-- Select Class --</option>
          {classes.map((c) => (
            <option key={c._id} value={c._id}>
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

        <button
          onClick={fetchLogs}
          disabled={loadingLogs}
          className="px-6 py-3 rounded-lg bg-green-500 hover:bg-green-600 text-white font-semibold shadow transition disabled:opacity-50"
        >
          {loadingLogs ? "Loading..." : "Filter"}
        </button>
      </div>

      {/* Table */}
      {logs.length > 0 ? (
        <>
          <div className="overflow-x-auto rounded-lg border border-neutral-700">
            <table className="min-w-full text-sm text-left text-gray-300">
              <thead className="bg-neutral-800 text-green-400">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th>Student ID</th>
                  <th>Full Name</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, index) => (
                  <tr
                    key={index}
                    className="border-b border-neutral-700 hover:bg-neutral-800/50 transition"
                  >
                    <td className="px-4 py-3">{log.date}</td>
                    <td>{log.student_id}</td>
                    <td className="font-medium text-white">
                      {`${log.first_name} ${log.last_name}`}
                    </td>
                    <td
                      className={`${
                        log.status === "Present"
                          ? "text-green-400"
                          : "text-red-400"
                      } font-semibold`}
                    >
                      {log.status}
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
          {loadingLogs ? "Loading attendance logs..." : "No attendance records found."}
        </p>
      )}
    </div>
  );
};

export default AttendanceReport;
