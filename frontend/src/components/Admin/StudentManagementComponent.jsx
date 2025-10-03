// src/components/Admin/StudentManagementComponent.jsx
import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import ViewStudentModal from "./ViewStudentModal";
import EditStudentModal from "./EditStudentModal";
import DeleteConfirmationModal from "./DeleteConfirmationModal";
import { FaUsers, FaPlus, FaSearch } from "react-icons/fa";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const StudentManagementComponent = () => {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [courseFilter, setCourseFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [recentStudents, setRecentStudents] = useState([]);
  const [distribution, setDistribution] = useState({});
  const [selectedStudent, setSelectedStudent] = useState(null);
  const navigate = useNavigate();

  // ✅ Modal states
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Fetch students
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/admin/students");
        const data = res.data || [];
        setStudents(data);
        setFilteredStudents(data);

        // Recently registered (last 5 only)
        const recent = [...data]
          .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
          .slice(0, 5);
        setRecentStudents(recent);

        // Course distribution
        const dist = {};
        data.forEach((s) => {
          const key = s.course || "Unassigned";
          dist[key] = (dist[key] || 0) + 1;
        });
        setDistribution(dist);
      } catch (err) {
        toast.error("Failed to fetch students.");
        console.error(err);
      }
    };

    fetchStudents();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = students;

    if (courseFilter) {
      filtered = filtered.filter((s) => s.course === courseFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          (s.first_name || "").toLowerCase().includes(query) ||
          (s.last_name || "").toLowerCase().includes(query) ||
          (s.student_id || "").toLowerCase().includes(query)
      );
    }

    setFilteredStudents(filtered);
  }, [courseFilter, searchQuery, students]);

  useEffect(() => {
  const modalOpen = isViewModalOpen || isEditModalOpen || isDeleteModalOpen;

  if (modalOpen) {
    document.body.style.overflow = "hidden";  // 🚫 Disable background scroll
  } else {
    document.body.style.overflow = "auto";    // ✅ Restore scroll
  }

  return () => {
    document.body.style.overflow = "auto"; // Cleanup just in case
  };
}, [isViewModalOpen, isEditModalOpen, isDeleteModalOpen]);

  // Compute course distribution
  const totalStudents = Object.values(distribution).reduce((a, b) => a + b, 0);
  const chartData = Object.entries(distribution).map(([course, count]) => ({
    name: course,
    value: count,
  }));

  const COLORS = ["#10b981", "#14b8a6", "#3b82f6", "#f59e0b"]; // Emerald, Teal, Blue, Amber fallback

  // ✅ Fetch single student
  const fetchStudentById = async (studentId) => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/admin/students/${studentId}`
      );
      return res.data;
    } catch (err) {
      toast.error("Failed to fetch student details");
      console.error(err);
      return null;
    }
  };

  // ✅ Handle View
  const handleView = async (student) => {
    const freshStudent = await fetchStudentById(student.student_id);
    if (freshStudent) {
      setSelectedStudent(freshStudent);
      setIsViewModalOpen(true);
    }
  };

  // ✅ Handle Edit
  const handleEdit = async (student) => {
    const freshStudent = await fetchStudentById(student.student_id);
    if (freshStudent) {
      setSelectedStudent(freshStudent);
      setIsEditModalOpen(true);
    }
  };

  // ✅ Handle Delete (open modal)
  const handleDeleteRequest = (student) => {
    setSelectedStudent(student);
    setIsDeleteModalOpen(true);
  };

  // ✅ Confirm delete
  const confirmDelete = async () => {
    try {
      await axios.delete(
        `http://localhost:5000/api/admin/students/${selectedStudent.student_id}`
      );
      setStudents((prev) =>
        prev.filter((s) => s.student_id !== selectedStudent.student_id)
      );
      setFilteredStudents((prev) =>
        prev.filter((s) => s.student_id !== selectedStudent.student_id)
      );
      toast.success("Student deleted successfully");
    } catch (err) {
      toast.error("Failed to delete student.");
      console.error(err);
    } finally {
      setIsDeleteModalOpen(false);
      setSelectedStudent(null);
    }
  };

  // ✅ Update student after edit
  const handleStudentUpdated = (updatedStudent) => {
    setStudents((prev) =>
      prev.map((s) =>
        s.student_id === updatedStudent.student_id ? updatedStudent : s
      )
    );
    setFilteredStudents((prev) =>
      prev.map((s) =>
        s.student_id === updatedStudent.student_id ? updatedStudent : s
      )
    );
  };

  return (
    <div className="bg-neutral-950/80 text-white p-8 rounded-2xl shadow-xl space-y-10 backdrop-blur-lg">
      {/* Header + Filters */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <h2 className="text-3xl font-extrabold flex items-center gap-3">
          <FaUsers className="text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.7)]" />
          <span className="bg-gradient-to-r from-emerald-400 to-green-600 bg-clip-text text-transparent">
            Student Management
          </span>
        </h2>

        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
          {/* Search */}
          <div className="relative flex-1">
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ID or Name"
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-neutral-900/70 border border-white/10 text-sm focus:ring-2 focus:ring-emerald-500 transition"
            />
          </div>

          {/* Course filter */}
          <select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            className="px-4 py-2 rounded-lg bg-neutral-900/70 border border-white/10 text-sm focus:ring-2 focus:ring-emerald-500 transition"
          >
            <option value="">All Courses</option>
            {Object.keys(distribution).map((course) => (
              <option key={course} value={course}>
                {course}
              </option>
            ))}
          </select>

          {/* Register */}
          <button
            onClick={() => navigate("/student/register")}
            className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 rounded-lg text-sm font-semibold shadow-md transition transform hover:scale-105"
          >
            <FaPlus /> Register Student
          </button>
        </div>
      </div>

      {/* Analytics / Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* ✅ Course Distribution (PieChart) */}
<div className="p-6 bg-neutral-900/70 rounded-2xl border border-white/10 shadow-lg backdrop-blur-md">
  <h3 className="text-lg font-semibold text-emerald-400 mb-6">
    Course Distribution
  </h3>
  {totalStudents === 0 ? (
    <p className="text-gray-400 text-sm italic">No students available.</p>
  ) : (
    <ResponsiveContainer width="100%" height={420}>
      <PieChart>
        <defs>
          {/* Gradient for BSINFOTECH */}
          <linearGradient id="gradBSIT" x1="0" y1="0" x2="1" y2="1">
            <stop offset="30%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#16a34a" />
          </linearGradient>
          {/* Gradient for BSCS */}
          <linearGradient id="gradBSCS" x1="0" y1="0" x2="1" y2="1">
            <stop offset="30%" stopColor="#2dd4bf" />  {/* teal-400 */}
            <stop offset="100%" stopColor="#16a34a" /> {/* green-600 */}
          </linearGradient>
        </defs>

        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={140}  // 🔹 Larger chart
          innerRadius={60}   // 🔹 Donut style
          paddingAngle={0}   // 🔹 Adds spacing between slices
          label={({ name, percent }) =>
            `${name} ${(percent * 100).toFixed(1)}%`
          }
          labelLine={false}
        >
          {chartData.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={
                entry.name === "BSINFOTECH"
                  ? "url(#gradBSIT)"
                  : "url(#gradBSCS)"
              }
              stroke="#1f2937"
              strokeWidth={2}
              className="transition-transform duration-300 hover:scale-105"
            />
          ))}
        </Pie>

        <Tooltip
          formatter={(value, name) => [`${value} students`, name]}
          contentStyle={{
            background: "rgba(17,24,39,0.95)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "10px",
            color: "#fff",
          }}
        />
        <Legend
          wrapperStyle={{ color: "#d1d5db", fontSize: "14px", marginTop: "12px" }}
          iconType="circle"
        />
      </PieChart>
    </ResponsiveContainer>
  )}
</div>


        {/* ✅ Recently Registered */}
        <div className="p-6 bg-gradient-to-br from-neutral-900/80 to-neutral-950/80 rounded-2xl 
                        border border-white/10 shadow-lg backdrop-blur-md">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-extrabold bg-gradient-to-r from-emerald-400 to-green-500 
                          bg-clip-text text-transparent flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Recently Registered
            </h3>
            <span className="text-xs text-gray-400">Last 5 Students</span>
          </div>

          <div className="space-y-3">
            {recentStudents.map((s) => (
              <div
                key={s.student_id}
                className="group p-4 bg-neutral-800/60 rounded-xl border border-white/5 
                          shadow-sm hover:shadow-emerald-500/20 transition-all duration-300 
                          transform hover:scale-[1.02] hover:-translate-y-[2px] cursor-pointer"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-white group-hover:text-emerald-300 transition">
                      {s.first_name} {s.last_name}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {s.course || "Unassigned"}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400 italic">
                    {s.created_at
                      ? new Date(s.created_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "—"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

       {/* ✅ Student List */}
      <div className="rounded-2xl border border-white/10 overflow-hidden shadow-lg bg-neutral-900/60 backdrop-blur-md">
        <div className="hidden md:grid grid-cols-6 bg-gradient-to-r from-emerald-600/20 to-green-800/20 text-emerald-300 font-semibold text-sm uppercase tracking-wide border-b border-white/10">
          <div className="px-4 py-3">Student ID</div>
          <div className="px-4 py-3">First Name</div>
          <div className="px-4 py-3">Last Name</div>
          <div className="px-4 py-3">Course</div>
          <div className="px-4 py-3">Attendance</div>
          <div className="px-4 py-3 text-center">Actions</div>
        </div>

        {filteredStudents.length > 0 ? (
          filteredStudents.map((s) => (
            <div
              key={s.student_id}
              className="border-b border-white/5 hover:bg-neutral-800/40 transition"
            >
              {/* Desktop Row */}
              <div className="hidden md:grid grid-cols-6 text-sm text-gray-300">
                <div className="px-4 py-3 font-mono text-gray-400">
                  {s.student_id}
                </div>
                <div className="px-4 py-3">{s.first_name}</div>
                <div className="px-4 py-3">{s.last_name}</div>
                <div className="px-4 py-3 text-emerald-300 font-medium">
                  {s.course}
                </div>
                <div className="px-4 py-3">
                  {s.attendance_rate !== null &&
                  s.attendance_rate !== undefined ? (
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        s.attendance_rate < 50
                          ? "bg-red-500/20 text-red-400"
                          : s.attendance_rate < 75
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-emerald-500/20 text-emerald-400"
                      }`}
                    >
                      {s.attendance_rate}%
                    </span>
                  ) : (
                    <span className="text-gray-500">N/A</span>
                  )}
                </div>
                <div className="px-4 py-3 flex gap-2 justify-center">
                  <button
                    onClick={() => handleView(s)}
                    className="px-3 py-1 rounded-md bg-blue-500/20 text-blue-400 text-xs hover:bg-blue-500/30 hover:scale-105 transition"
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleEdit(s)}
                    className="px-3 py-1 rounded-md bg-yellow-500/20 text-yellow-400 text-xs hover:bg-yellow-500/30 hover:scale-105 transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteRequest(s)}
                    className="px-3 py-1 rounded-md bg-red-500/20 text-red-400 text-xs hover:bg-red-500/30 hover:scale-105 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden p-4 bg-neutral-800/60 rounded-lg border border-white/5 m-2 shadow hover:shadow-lg transition">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-white">
                    {s.first_name} {s.last_name}
                  </span>
                  <span className="text-xs text-gray-400">{s.course}</span>
                </div>
                <p className="text-xs text-gray-400 mb-2">ID: {s.student_id}</p>
                <div className="flex justify-between items-center">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      s.attendance_rate < 50
                        ? "bg-red-500/20 text-red-400"
                        : s.attendance_rate < 75
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-emerald-500/20 text-emerald-400"
                    }`}
                  >
                    {s.attendance_rate ?? "N/A"}%
                  </span>
                  <div className="flex gap-2">
                    <button onClick={() => handleView(s)} className="px-2 py-1 rounded bg-blue-500/20 text-blue-400 text-xs">
                      View
                    </button>
                    <button onClick={() => handleEdit(s)} className="px-2 py-1 rounded bg-yellow-500/20 text-yellow-400 text-xs">
                      Edit
                    </button>
                    <button onClick={() => handleDeleteRequest(s)} className="px-2 py-1 rounded bg-red-500/20 text-red-400 text-xs">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-gray-500 py-6 text-sm">
            No students found.
          </div>
        )}
      </div>

      {/* ✅ Modals */}
      <ViewStudentModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        student={selectedStudent}
      />
      <EditStudentModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        student={selectedStudent}
        onStudentUpdated={handleStudentUpdated}
      />
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        student={selectedStudent}
      />
    </div>
  );
};

export default StudentManagementComponent;
