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

const AttendanceReport = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [logs, setLogs] = useState([]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const instructor = JSON.parse(localStorage.getItem("instructor_data"));

  useEffect(() => {
    if (instructor?.instructor_id) {
      fetchClasses();
    }
  }, []);

  const fetchClasses = async () => {
    setLoadingClasses(true);
    try {
      const data = await getClassesByInstructor(instructor.instructor_id);
      setClasses(data);
    } catch (err) {
      console.error("Failed to load classes:", err);
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
      console.error("Failed to fetch attendance logs:", err);
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
    <div className="bg-gray-800 p-6 rounded-xl shadow-lg w-full">
      <h2 className="text-green-400 font-bold text-xl mb-4">
        Instructor Attendance Report
      </h2>

      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          disabled={loadingClasses}
          className="w-full lg:w-1/3 px-4 py-2 rounded-lg bg-gray-700 text-white"
        >
          <option value="">-- Select Class --</option>
          {classes.map((c) => (
            <option key={c._id} value={c._id}>
              {c.subject_code} - {c.subject_title}
            </option>
          ))}
        </select>

        <DatePicker
          selected={startDate}
          onChange={(date) => setStartDate(date)}
          placeholderText="Start Date"
          className="px-4 py-2 rounded-lg bg-gray-700 text-white"
        />
        <DatePicker
          selected={endDate}
          onChange={(date) => setEndDate(date)}
          placeholderText="End Date"
          className="px-4 py-2 rounded-lg bg-gray-700 text-white"
        />

        <button
          onClick={fetchLogs}
          disabled={loadingLogs}
          className="bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded-lg text-white font-semibold"
        >
          {loadingLogs ? "Loading..." : "Filter"}
        </button>
      </div>

      {logs.length > 0 ? (
        <>
          <div className="overflow-x-auto rounded-lg">
            <table className="min-w-full text-sm text-left text-gray-300 mb-4 border border-gray-700">
              <thead className="bg-gray-700 text-green-300">
                <tr>
                  <th className="px-4 py-2">Date</th>
                  <th>Student ID</th>
                  <th>Name</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, index) => (
                  <tr key={index} className="border-b border-gray-600">
                    <td className="px-4 py-2">{log.date}</td>
                    <td>{log.student_id}</td>
                    <td>{`${log.first_name} ${log.last_name}`}</td>
                    <td>{log.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            onClick={exportToPDF}
            className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-lg font-semibold text-white"
          >
            Export PDF
          </button>
        </>
      ) : (
        <p className="text-gray-400 text-center">
          {loadingLogs ? "Loading attendance logs..." : "No attendance records found."}
        </p>
      )}
    </div>
  );
};

export default AttendanceReport;
