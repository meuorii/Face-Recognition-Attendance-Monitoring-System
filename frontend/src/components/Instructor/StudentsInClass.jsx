// src/components/Instructor/StudentsInClass.jsx
import { useEffect, useMemo, useState } from "react";
import { getClassesByInstructor, getAssignedStudents } from "../../services/api";
import { toast } from "react-toastify";
import { FaUserGraduate, FaSearch } from "react-icons/fa";

const StudentsInClass = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [students, setStudents] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [query, setQuery] = useState("");

  const instructor = JSON.parse(localStorage.getItem("userData") || "{}");

  useEffect(() => {
    if (instructor?.instructor_id) fetchClasses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchClasses = async () => {
    setLoadingClasses(true);
    try {
      const data = await getClassesByInstructor(instructor.instructor_id);
      setClasses(data || []);
      // Preselect first class if you like
      if (data?.length && !selectedClass) {
        setSelectedClass(data[0]._id);
        fetchStudents(data[0]._id);
      }
    } catch (err) {
      console.error("Failed to load classes:", err);
      toast.error("Failed to load classes.");
    } finally {
      setLoadingClasses(false);
    }
  };

  const fetchStudents = async (classId) => {
    if (!classId) return;
    setLoadingStudents(true);
    try {
      const data = await getAssignedStudents(classId);
      setStudents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch students:", err);
      toast.error("Failed to fetch students.");
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleSelectClass = (classId) => {
    setSelectedClass(classId);
    setQuery("");
    setStudents([]);
    if (classId) fetchStudents(classId);
  };

  const currentClass = useMemo(
    () => classes.find((c) => c._id === selectedClass),
    [classes, selectedClass]
  );

  const filtered = useMemo(() => {
    if (!query.trim()) return students;
    const q = query.toLowerCase();
    return students.filter((s) => {
      const id = (s.student_id || "").toLowerCase();
      const name = `${s.first_name || ""} ${s.last_name || ""}`.toLowerCase();
      const course = (s.course || "").toLowerCase();
      const section = (s.section || "").toLowerCase();
      return id.includes(q) || name.includes(q) || course.includes(q) || section.includes(q);
    });
  }, [students, query]);

  return (
    <div className="bg-neutral-900 p-6 md:p-8 rounded-2xl border border-neutral-700 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-neutral-800 border border-neutral-700">
            <FaUserGraduate className="text-green-400" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-green-400">
            Students in Class
          </h2>
        </div>

        {/* Count badge */}
        <span className="text-sm px-3 py-1 rounded-full border border-neutral-700 bg-neutral-800 text-gray-300">
          {filtered.length} {filtered.length === 1 ? "student" : "students"}
        </span>
      </div>

      {/* Class meta + controls */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <div className="md:col-span-2">
          <label className="block text-sm text-gray-400 mb-2">Select Class</label>
          <select
            className="w-full bg-neutral-800 border border-neutral-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
            onChange={(e) => handleSelectClass(e.target.value)}
            value={selectedClass}
            disabled={loadingClasses}
          >
            <option value="">— Choose a Class —</option>
            {classes.map((c) => (
              <option key={c._id} value={c._id}>
                {c.subject_code} — {c.subject_title}
              </option>
            ))}
          </select>
        </div>

        {/* Quick search */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">Search</label>
          <div className="flex items-center gap-2 bg-neutral-800 border border-neutral-700 rounded-lg px-3">
            <FaSearch className="text-neutral-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by ID, name, course, section"
              className="w-full bg-transparent outline-none text-white h-11 placeholder:text-neutral-500"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-neutral-700">
        {loadingStudents ? (
          <div className="px-4 py-6 text-green-400">Loading students…</div>
        ) : selectedClass && filtered.length > 0 ? (
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 bg-neutral-800 text-green-400 z-10">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Student ID</th>
                <th className="px-4 py-3 text-left font-semibold">Full Name</th>
                <th className="px-4 py-3 text-left font-semibold">Course</th>
                <th className="px-4 py-3 text-left font-semibold">Section</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => {
                const fullName = `${s.first_name || ""} ${s.last_name || ""}`.trim();
                return (
                  <tr
                    key={`${s.student_id || "row"}-${i}`}
                    className={`${
                      i % 2 ? "bg-neutral-900" : "bg-neutral-800/60"
                    } hover:bg-neutral-700/60 transition-colors`}
                  >
                    <td className="px-4 py-3 text-gray-200">{s.student_id || "—"}</td>
                    <td className="px-4 py-3 text-white font-medium">{fullName || "—"}</td>
                    <td className="px-4 py-3 text-gray-200">{s.course || "—"}</td>
                    <td className="px-4 py-3 text-gray-200">{s.section || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : selectedClass ? (
          <div className="px-6 py-10 text-center">
            <div className="text-3xl mb-2">🗂️</div>
            <p className="text-gray-300 font-medium">No students in this class yet</p>
          </div>
        ) : (
          <div className="px-6 py-10 text-center text-gray-400">
            Select a class to view the roster.
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentsInClass;
