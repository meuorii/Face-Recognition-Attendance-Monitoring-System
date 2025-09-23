// src/components/Student/AttendanceHistory.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAttendanceLogsByStudent } from "../../services/api";
import { toast } from "react-toastify";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaDownload,
  FaEye,
  FaChartPie,
} from "react-icons/fa";
import SubjectLogsModal from "./SubjectsLogsModal";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const COLORS = ["#22c55e", "#ef4444", "#facc15"]; // green, red, yellow

const AttendanceHistory = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [subjectBreakdown, setSubjectBreakdown] = useState([]);
  const [summary, setSummary] = useState({
    totalSessions: 0,
    present: 0,
    absent: 0,
    late: 0,
    attendanceRate: 0,
  });
  const [selectedSubject, setSelectedSubject] = useState(null);

  const userData = localStorage.getItem("userData");
  const student = userData ? JSON.parse(userData) : null;
  const studentId = student?.student_id;

  // ✅ Format Date
  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // ✅ PDF Export
  const exportToPDF = () => {
    if (subjectBreakdown.length === 0) {
      toast.info("⚠ No attendance records to export.");
      return;
    }

    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();

    // Logos
    doc.addImage("/ccit-logo.png", "PNG", 15, 10, 25, 25);
    doc.addImage("/prmsu.png", "PNG", pageWidth - 40, 10, 25, 25);

    // University Header
    doc.setFont("times", "bold");
    doc.setFontSize(14);
    doc.text("Republic of the Philippines", pageWidth / 2, 18, { align: "center" });
    doc.text("President Ramon Magsaysay State University", pageWidth / 2, 25, { align: "center" });

    doc.setFont("times", "italic");
    doc.setFontSize(11);
    doc.text("(Ramon Magsaysay Technological University)", pageWidth / 2, 32, { align: "center" });
    doc.text("Iba, Zambales", pageWidth / 2, 38, { align: "center" });

    doc.setFont("times", "bold");
    doc.setFontSize(12);
    doc.text("COLLEGE OF COMMUNICATION AND INFORMATION TECHNOLOGY", pageWidth / 2, 45, {
      align: "center",
    });

    // Report Title
    doc.setFontSize(14);
    doc.setTextColor(34, 197, 94);
    doc.text("STUDENT ATTENDANCE HISTORY", pageWidth / 2, 55, { align: "center" });

    // Student Info
    doc.setFont("times", "normal");
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Student: ${student.first_name} ${student.last_name}`, 20, 65);
    doc.text(`Student ID: ${student.student_id}`, 20, 72);
    doc.text(`Date Generated: ${formatDate(new Date().toISOString())}`, 20, 79);

    // Summary
    doc.setFont("times", "bold");
    doc.setFontSize(8);
    doc.text(
      `Summary → Sessions: ${summary.totalSessions} | Present: ${summary.present} | Absent: ${summary.absent} | Late: ${summary.late} | Attendance Rate: ${summary.attendanceRate}%`,
      20,
      88
    );

    // Table
    autoTable(doc, {
      startY: 98,
      head: [["Subject", "Present", "Absent", "Late", "Total"]],
      body: subjectBreakdown.map((s) => [
        `${s.subject_code || ""} ${s.subject_title || "—"}`,
        s.present,
        s.absent,
        s.late,
        s.total,
      ]),
      styles: {
        font: "helvetica",
        fontSize: 10,
        cellPadding: 3,
        lineColor: [34, 197, 94],
        lineWidth: 0.2,
      },
      headStyles: {
        fillColor: [34, 197, 94],
        textColor: [255, 255, 255],
        halign: "center",
      },
      bodyStyles: { halign: "center" },
      alternateRowStyles: { fillColor: [240, 255, 240] },
    });

    doc.save(`attendance_history_${studentId}.pdf`);
  };

  // ✅ Fetch Logs + Calculate Summary
  useEffect(() => {
    if (!studentId) {
      toast.error("Student not logged in.");
      navigate("/student/login");
      return;
    }

    const fetchLogs = async () => {
      try {
        const data = await getAttendanceLogsByStudent(studentId);
        const logsData = data.logs || [];
        setLogs(logsData);

        // 🔹 Recalculate summary and breakdown locally
        const breakdown = {};
        let present = 0,
          absent = 0,
          late = 0;

        logsData.forEach((log) => {
          const key = log.subject_code || log.subject_title;
          if (!breakdown[key]) {
            breakdown[key] = {
              subject_code: log.subject_code,
              subject_title: log.subject_title,
              present: 0,
              absent: 0,
              late: 0,
              total: 0,
            };
          }
          breakdown[key].total += 1;
          if (log.status === "Present") {
            breakdown[key].present += 1;
            present++;
          } else if (log.status === "Absent") {
            breakdown[key].absent += 1;
            absent++;
          } else if (log.status === "Late") {
            breakdown[key].late += 1;
            late++;
          }
        });

        const totalSessions = logsData.length;
        const attended = present + late;
        const attendanceRate =
          totalSessions > 0 ? Math.round((attended / totalSessions) * 100) : 0;

        setSubjectBreakdown(Object.values(breakdown));
        setSummary({
          totalSessions,
          present,
          absent,
          late,
          attendanceRate,
        });
      } catch (err) {
        console.error("Fetch error:", err);
        toast.error("Failed to load attendance logs.");
      }
    };

    fetchLogs();
  }, [studentId, navigate]);

  // ✅ Chart Data
  const pieData = [
    { name: "Present", value: summary.present },
    { name: "Absent", value: summary.absent },
    { name: "Late", value: summary.late },
  ];

  const barData = subjectBreakdown.map((s) => ({
    name: s.subject_code || s.subject_title,
    Present: s.present,
    Absent: s.absent,
    Late: s.late,
  }));

  return (
    <div className="bg-neutral-900 p-6 rounded-2xl shadow-md border border-neutral-700 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-white text-2xl font-semibold border-b border-neutral-700 pb-2 w-full sm:w-auto">
          Attendance History
        </h2>
        {subjectBreakdown.length > 0 && (
          <button
            onClick={exportToPDF}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white text-sm px-4 py-2 rounded-lg transition w-full sm:w-auto justify-center"
          >
            <FaDownload /> Export PDF
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-neutral-800 p-4 rounded-xl text-center">
          <p className="text-gray-400">Total Sessions</p>
          <p className="text-2xl font-bold text-white">{summary.totalSessions}</p>
        </div>
        <div className="bg-neutral-800 p-4 rounded-xl text-center">
          <p className="text-gray-400 flex items-center gap-1 justify-center">
            <FaCheckCircle className="text-green-400" /> Present
          </p>
          <p className="text-2xl font-bold text-green-400">{summary.present}</p>
        </div>
        <div className="bg-neutral-800 p-4 rounded-xl text-center">
          <p className="text-gray-400 flex items-center gap-1 justify-center">
            <FaTimesCircle className="text-red-400" /> Absent
          </p>
          <p className="text-2xl font-bold text-red-400">{summary.absent}</p>
        </div>
        <div className="bg-neutral-800 p-4 rounded-xl text-center">
          <p className="text-gray-400 flex items-center gap-1 justify-center">
            <FaClock className="text-yellow-400" /> Late
          </p>
          <p className="text-2xl font-bold text-yellow-400">{summary.late}</p>
        </div>
      </div>

      {/* Attendance Rate Progress */}
      <div className="mb-8">
        <p className="text-gray-400 text-sm mb-1">Attendance Rate</p>
        <div className="w-full bg-neutral-700 rounded-full h-3">
          <div
            className="bg-green-500 h-3 rounded-full transition-all"
            style={{ width: `${summary.attendanceRate}%` }}
          />
        </div>
        <p className="text-right text-sm text-gray-300 mt-1">
          {summary.attendanceRate}%
        </p>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        <div className="bg-neutral-800 p-4 rounded-xl border border-neutral-700">
          <h3 className="text-green-400 font-semibold mb-3 flex items-center gap-2">
            <FaChartPie /> Status Distribution
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                outerRadius={90}
                label
              >
                {pieData.map((_, idx) => (
                  <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-neutral-800 p-4 rounded-xl border border-neutral-700">
          <h3 className="text-green-400 font-semibold mb-3">Per Subject Breakdown</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
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

      {/* Subject Breakdown Table */}
      {subjectBreakdown.length > 0 ? (
        <div className="overflow-x-auto border border-neutral-700 rounded-xl">
          <table className="min-w-full text-sm text-gray-300">
            <thead className="bg-neutral-800 text-green-400">
              <tr>
                <th className="py-3 px-4 text-left">Subject</th>
                <th className="py-3 px-4 text-center">Present</th>
                <th className="py-3 px-4 text-center">Absent</th>
                <th className="py-3 px-4 text-center">Late</th>
                <th className="py-3 px-4 text-center">Total</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {subjectBreakdown.map((subj, idx) => (
                <tr
                  key={idx}
                  className="border-b border-neutral-700 hover:bg-neutral-800/60 transition"
                >
                  <td className="py-2 px-4">
                    {subj.subject_code || ""} {subj.subject_title || "—"}
                  </td>
                  <td className="py-2 px-4 text-center text-green-400">
                    {subj.present}
                  </td>
                  <td className="py-2 px-4 text-center text-red-400">
                    {subj.absent}
                  </td>
                  <td className="py-2 px-4 text-center text-yellow-400">
                    {subj.late}
                  </td>
                  <td className="py-2 px-4 text-center">{subj.total}</td>
                  <td className="py-2 px-4 text-center">
                    <button
                      onClick={() => setSelectedSubject(subj)}
                      className="flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-500 text-white rounded-lg text-xs transition"
                    >
                      <FaEye /> View Logs
                    </button>
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

      {/* Modal */}
      <SubjectLogsModal
        subject={selectedSubject}
        logs={logs}
        onClose={() => setSelectedSubject(null)}
        formatDate={formatDate}
      />
    </div>
  );
};

export default AttendanceHistory;
