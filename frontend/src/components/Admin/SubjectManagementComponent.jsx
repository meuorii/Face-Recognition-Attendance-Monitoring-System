import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { FaPlus, FaEdit, FaTrash, FaEye } from "react-icons/fa";
import AddSubjectModal from "./AddSubjectModal";

export default function SubjectManagementComponent() {
  const [subjects, setSubjects] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState("");
  const [yearSemFilter, setYearSemFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // fetch all subjects
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/admin/subjects");
        setSubjects(res.data || []);
        setFiltered(res.data || []);
      } catch (err) {
        toast.error("Failed to fetch subjects");
        console.error(err);
      }
    };
    fetchSubjects();
  }, []);

  // apply filters
  useEffect(() => {
    let data = [...subjects];

    if (courseFilter) {
      data = data.filter(
        (s) => (s.course || "").toLowerCase() === courseFilter.toLowerCase()
      );
    }

    if (yearSemFilter) {
      if (yearSemFilter === "Summer") {
        data = data.filter((s) => (s.semester || "").toLowerCase() === "summer");
      } else {
        const [year, sem] = yearSemFilter.split(" - ");
        data = data.filter(
          (s) =>
            (s.year_level || "").toLowerCase() === year.toLowerCase() &&
            (s.semester || "").toLowerCase() === sem.toLowerCase()
        );
      }
    }

    if (search) {
      const q = search.toLowerCase();
      data = data.filter(
        (s) =>
          (s.subject_code || "").toLowerCase().includes(q) ||
          (s.subject_title || "").toLowerCase().includes(q)
      );
    }

    setFiltered(data);
  }, [search, courseFilter, yearSemFilter, subjects]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this subject?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/admin/subjects/${id}`);
      setSubjects((prev) => prev.filter((s) => s._id !== id));
      toast.success("Subject deleted successfully");
    } catch (err) {
      toast.error("Failed to delete subject");
      console.error(err);
    }
  };

  // ✅ Add newly created subject to list immediately
  const handleSubjectAdded = (newSubject) => {
    setSubjects((prev) => [...prev, newSubject]);
    setFiltered((prev) => [...prev, newSubject]);
  };

  return (
    <div className="bg-neutral-900 text-white p-6 rounded-xl shadow-lg space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-2xl font-bold text-green-400">
          Subject Management
        </h2>
        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search code or title"
            className="px-4 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-sm"
          />

          {/* Course filter */}
          <select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            className="px-4 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-sm"
          >
            <option value="">All Courses</option>
            <option value="BSCS">BSCS</option>
            <option value="BSINFOTECH">BSINFOTECH</option>
          </select>

          {/* Year + Semester filter */}
          <select
            value={yearSemFilter}
            onChange={(e) => setYearSemFilter(e.target.value)}
            className="px-4 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-sm"
          >
            <option value="">All Year & Sem</option>
            <option value="1st Year - 1st Sem">1st Year - 1st Sem</option>
            <option value="1st Year - 2nd Sem">1st Year - 2nd Sem</option>
            <option value="2nd Year - 1st Sem">2nd Year - 1st Sem</option>
            <option value="2nd Year - 2nd Sem">2nd Year - 2nd Sem</option>
            <option value="3rd Year - 1st Sem">3rd Year - 1st Sem</option>
            <option value="3rd Year - 2nd Sem">3rd Year - 2nd Sem</option>
            <option value="4th Year - 1st Sem">4th Year - 1st Sem</option>
            <option value="4th Year - 2nd Sem">4th Year - 2nd Sem</option>
            <option value="Summer">Summer</option>
          </select>

          {/* Add Subject */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-semibold shadow-md transition"
          >
            <FaPlus /> Add Subject
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-neutral-700 overflow-hidden shadow-lg">
        <div className="hidden md:grid grid-cols-6 bg-neutral-800/80 text-neutral-200 font-semibold text-sm uppercase tracking-wide border-b border-neutral-700">
          <div className="px-4 py-3">Code</div>
          <div className="px-4 py-3">Title</div>
          <div className="px-4 py-3">Course</div>
          <div className="px-4 py-3">Year</div>
          <div className="px-4 py-3">Semester</div>
          <div className="px-4 py-3 text-center">Actions</div>
        </div>

        {filtered.length > 0 ? (
          filtered.map((s) => (
            <div
              key={s._id}
              className="border-b border-neutral-800 hover:bg-neutral-800/40 transition"
            >
              <div className="hidden md:grid grid-cols-6 text-sm text-neutral-300">
                <div className="px-4 py-3">{s.subject_code}</div>
                <div className="px-4 py-3">{s.subject_title}</div>
                <div className="px-4 py-3">{s.course}</div>
                <div className="px-4 py-3">{s.year_level || "—"}</div>
                <div className="px-4 py-3">{s.semester || "—"}</div>
                <div className="px-4 py-3 flex gap-2 justify-center">
                  <button className="p-2 rounded-md bg-blue-500/20 text-blue-400 hover:bg-blue-500/30">
                    <FaEye />
                  </button>
                  <button className="p-2 rounded-md bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30">
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => handleDelete(s._id)}
                    className="p-2 rounded-md bg-red-500/20 text-red-400 hover:bg-red-500/30"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>

              {/* Mobile view */}
              <div className="md:hidden p-4 space-y-2 text-sm text-neutral-300">
                <p><span className="text-neutral-400">Code:</span> {s.subject_code}</p>
                <p><span className="text-neutral-400">Title:</span> {s.subject_title}</p>
                <p><span className="text-neutral-400">Course:</span> {s.course}</p>
                <p><span className="text-neutral-400">Year:</span> {s.year_level || "—"}</p>
                <p><span className="text-neutral-400">Semester:</span> {s.semester || "—"}</p>
                <div className="flex justify-end gap-2 pt-2">
                  <button className="px-3 py-1 rounded-md bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 text-xs">View</button>
                  <button className="px-3 py-1 rounded-md bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 text-xs">Edit</button>
                  <button
                    onClick={() => handleDelete(s._id)}
                    className="px-3 py-1 rounded-md bg-red-500/20 text-red-400 hover:bg-red-500/30 text-xs"
                  >Delete</button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-neutral-500 py-6 text-sm">No subjects found.</div>
        )}
      </div>

      {/* Add Subject Modal */}
      <AddSubjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubjectAdded={handleSubjectAdded}
      />
    </div>
  );
}
