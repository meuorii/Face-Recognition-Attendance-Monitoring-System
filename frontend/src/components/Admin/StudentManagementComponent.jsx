import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import ViewStudentModal from "./ViewStudentModal";
import EditStudentModal from "./EditStudentModal";
import DeleteConfirmationModal from "./DeleteConfirmationModal"; // ✅ new import

const StudentManagementComponent = () => {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [courseFilter, setCourseFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [recentStudents, setRecentStudents] = useState([]);
  const [topPerformers, setTopPerformers] = useState([]);
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

        // Recently registered
        const recent = [...data]
          .sort(
            (a, b) =>
              new Date(b.created_at || 0) - new Date(a.created_at || 0)
          )
          .slice(0, 10);
        setRecentStudents(recent);

        // Top performers
        const top = [...data]
          .filter((s) => s.attendance_rate !== undefined)
          .sort((a, b) => b.attendance_rate - a.attendance_rate)
          .slice(0, 5);
        setTopPerformers(top);

        // Course distribution
        const dist = {};
        data.forEach((s) => {
          const key = s.course;
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
          s.first_name.toLowerCase().includes(query) ||
          s.last_name.toLowerCase().includes(query) ||
          s.student_id.toString().includes(query)
      );
    }

    setFilteredStudents(filtered);
  }, [courseFilter, searchQuery, students]);

  // Compute course distribution
  const totalStudents = Object.values(distribution).reduce((a, b) => a + b, 0);

  const colors = [
    "bg-green-500",
    "bg-blue-500",
    "bg-yellow-500",
    "bg-red-500",
    "bg-purple-500",
    "bg-pink-500",
  ];

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
    <div className="bg-neutral-900 text-white p-6 rounded-xl shadow-lg space-y-8">
      {/* Header + Filters */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-2xl font-bold text-green-400">Student Management</h2>

        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ID or Name"
            className="px-4 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-sm"
          />

          {/* Course filter */}
          <select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            className="px-4 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-sm"
          >
            <option value="">All Courses</option>
            <option value="BSINFOTECH">BSINFOTECH</option>
            <option value="BSCS">BSCS</option>
          </select>

          {/* Register */}
          <div className="flex gap-2">
            <button
              onClick={() => navigate("/student/register")}
              className="px-5 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-semibold shadow-md transition"
            >
              + Register Student
            </button>
          </div>
        </div>
      </div>

      {/* Analytics / Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Distribution */}
        <div className="bg-neutral-800 rounded-lg p-4 shadow border border-neutral-700">
          <h3 className="text-lg font-semibold text-green-400 mb-3">
            Course Distribution
          </h3>
          <div className="flex flex-col gap-2">
            {Object.entries(distribution).map(([key, count], i) => (
              <div key={key} className="flex items-center gap-2">
                <div
                  className={`w-4 h-4 rounded ${colors[i % colors.length]}`}
                />
                <span className="text-sm">
                  {key} – {count} ({((count / totalStudents) * 100).toFixed(1)}%)
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recently Registered */}
        <div className="bg-neutral-800 rounded-lg p-4 shadow border border-neutral-700">
          <h3 className="text-lg font-semibold text-green-400 mb-3">
            Recently Registered
          </h3>
          <div className="space-y-2">
            {recentStudents.map((s) => (
              <div
                key={s.student_id}
                className="p-2 bg-neutral-700/50 rounded text-sm flex justify-between"
              >
                <span>
                  {s.first_name} {s.last_name}
                </span>
                <span className="text-neutral-400 text-xs">
                  {new Date(s.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Performers */}
        <div className="bg-neutral-800 rounded-lg p-4 shadow border border-neutral-700">
          <h3 className="text-lg font-semibold text-green-400 mb-3">
            Top Attendance Performers
          </h3>
          <div className="space-y-2">
            {topPerformers.map((s) => (
              <div
                key={s.student_id}
                className="flex justify-between p-2 bg-neutral-700/50 rounded text-sm"
              >
                <span>
                  {s.first_name} {s.last_name}
                </span>
                <span className="text-green-400 font-bold">
                  {s.attendance_rate}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ✅ Student List */}
      <div className="rounded-xl border border-neutral-700 overflow-hidden shadow-lg">
        <div className="hidden md:grid grid-cols-8 bg-neutral-800/80 text-neutral-200 font-semibold text-sm uppercase tracking-wide border-b border-neutral-700">
          <div className="px-4 py-3">Student ID</div>
          <div className="px-4 py-3">First Name</div>
          <div className="px-4 py-3">Last Name</div>
          <div className="px-4 py-3">Course</div>
          <div className="px-4 py-3">Attendance</div>
          <div className="px-4 py-3">Spoof</div>
          <div className="px-4 py-3">Last Seen</div>
          <div className="px-4 py-3 text-center">Actions</div>
        </div>

        {filteredStudents.length > 0 ? (
          filteredStudents.map((s) => (
            <div
              key={s.student_id}
              className="border-b border-neutral-800 hover:bg-neutral-800/40 transition"
            >
              {/* Desktop Row */}
              <div className="hidden md:grid grid-cols-8 text-sm text-neutral-300">
                <div className="px-4 py-3 font-mono text-neutral-400">
                  {s.student_id}
                </div>
                <div className="px-4 py-3">{s.first_name}</div>
                <div className="px-4 py-3">{s.last_name}</div>
                <div className="px-4 py-3 text-green-300 font-medium">
                  {s.course}
                </div>

                {/* Attendance */}
                <div className="px-4 py-3">
                  {s.attendance_rate !== undefined ? (
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        s.attendance_rate < 75
                          ? "bg-red-500/20 text-red-400"
                          : "bg-green-500/20 text-green-400"
                      }`}
                    >
                      {s.attendance_rate}%
                    </span>
                  ) : (
                    <span className="text-neutral-500">N/A</span>
                  )}
                </div>

                {/* Spoof attempts */}
                <div className="px-4 py-3">
                  <span className="px-2 py-1 rounded-full text-xs bg-red-500/20 text-red-400">
                    {s.spoof_attempts || 0}
                  </span>
                </div>

                {/* Last seen */}
                <div className="px-4 py-3 text-neutral-400 text-xs">
                  {s.last_seen ? new Date(s.last_seen).toLocaleDateString() : "—"}
                </div>

                {/* Actions */}
                <div className="px-4 py-3 flex gap-2 justify-center">
                  <button
                    onClick={() => handleView(s)}
                    className="px-2 py-1 rounded-md bg-blue-500/20 text-blue-400 text-xs hover:bg-blue-500/30 transition"
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleEdit(s)}
                    className="px-2 py-1 rounded-md bg-yellow-500/20 text-yellow-400 text-xs hover:bg-yellow-500/30 transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteRequest(s)}
                    className="px-2 py-1 rounded-md bg-red-500/20 text-red-400 text-xs hover:bg-red-500/30 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-neutral-500 py-6 text-sm">
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
