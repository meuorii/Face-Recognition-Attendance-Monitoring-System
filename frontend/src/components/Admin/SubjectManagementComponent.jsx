import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { FaPlus, FaEdit, FaTrash, FaEye, FaChalkboardTeacher, FaSearch } from "react-icons/fa";
import AddSubjectModal from "./AddSubjectModal";
import ViewSubjectModal from "./ViewSubjectModal";
import EditSubjectModal from "./EditSubjectModal";
import DeleteSubjectConfirmationModal from "./DeleteSubjectConfirmationModal";

export default function SubjectManagementComponent() {
  const [subjects, setSubjects] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState("");
  const [yearSemFilter, setYearSemFilter] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Modals state
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

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

  useEffect(() => {
  const modalOpen = isAddModalOpen || isViewModalOpen || isEditModalOpen || isDeleteModalOpen;

  if (modalOpen) {
    document.body.style.overflow = "hidden";  // 🚫 Disable scroll
  } else {
    document.body.style.overflow = "auto";    // ✅ Restore scroll
  }

  return () => {
    document.body.style.overflow = "auto"; // Cleanup
  };
}, [isAddModalOpen, isViewModalOpen, isEditModalOpen, isDeleteModalOpen]);

  // handle delete
  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/admin/subjects/${id}`);
      setSubjects((prev) => prev.filter((s) => s._id !== id));
      toast.success("Subject deleted successfully");
    } catch (err) {
      toast.error("Failed to delete subject");
      console.error(err);
    } finally {
      setIsDeleteModalOpen(false);
    }
  };

  // ✅ Add newly created subject to list immediately
  const handleSubjectAdded = (newSubject) => {
    setSubjects((prev) => [...prev, newSubject]);
    setFiltered((prev) => [...prev, newSubject]);
  };

  // ✅ Handle subject update from Edit modal
  const handleSubjectUpdated = (updated) => {
    setSubjects((prev) =>
      prev.map((s) => (s._id === updated._id ? updated : s))
    );
    setFiltered((prev) =>
      prev.map((s) => (s._id === updated._id ? updated : s))
    );
  };

  return (
    <div className="bg-neutral-950 text-white p-8 rounded-xl shadow-lg space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
        {/* Title */}
        <h2 className="text-3xl font-extrabold flex items-center gap-2 bg-gradient-to-r from-emerald-400 to-green-600 bg-clip-text text-transparent">
            <FaChalkboardTeacher className="text-emerald-400"/>
            Subject Management
        </h2>

        {/* Controls */}
        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <div className="flex items-center bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 w-full sm:w-60
                          focus-within:border-emerald-400 focus-within:ring-1 focus-within:ring-emerald-400 transition">
            <FaSearch className="text-neutral-500 mr-2 text-sm" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search code or title..."
              className="bg-transparent outline-none text-sm text-white w-full placeholder-neutral-500"
            />
          </div>

          {/* Course Filter */}
          <select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            className="px-4 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-sm text-white
                      focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400
                      transition"
          >
            <option value="">All Courses</option>
            <option value="BSCS">BSCS</option>
            <option value="BSINFOTECH">BSINFOTECH</option>
          </select>

          {/* Year + Semester Filter */}
          <select
            value={yearSemFilter}
            onChange={(e) => setYearSemFilter(e.target.value)}
            className="px-4 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-sm text-white
                      focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400
                      transition"
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

          {/* Add Subject Button */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2 rounded-lg 
                      bg-gradient-to-r from-emerald-400 to-green-600 text-white text-sm font-semibold 
                      shadow-md hover:shadow-lg hover:shadow-emerald-500/30
                      transform hover:scale-105 transition-all"
          >
            <FaPlus /> Add Subject
          </button>
        </div>
      </div>


      {/* Table */}
      <div className="rounded-xl border border-neutral-700 overflow-hidden shadow-xl bg-neutral-900/60 backdrop-blur-sm">
        {/* Header */}
        <div className="hidden md:grid grid-cols-6 bg-gradient-to-r from-emerald-500/10 to-green-600/10 
                        text-emerald-300 font-semibold text-sm uppercase tracking-wide border-b border-neutral-700">
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
              className="border-b border-neutral-800 hover:bg-neutral-800/40 transition-all duration-300 
                        group cursor-pointer"
            >
              {/* Desktop row */}
              <div className="hidden md:grid grid-cols-6 text-sm text-neutral-300">
                <div className="px-4 py-3 font-mono text-emerald-400">{s.subject_code}</div>
                <div className="px-4 py-3 font-medium text-white">{s.subject_title}</div>
                <div className="px-4 py-3">{s.course}</div>
                <div className="px-4 py-3">{s.year_level || "—"}</div>
                <div className="px-4 py-3">{s.semester || "—"}</div>
               <div className="px-4 py-3 flex gap-3 justify-center">
                {/* View */}
                <button
                  onClick={() => {
                    setSelectedSubject(s);
                    setIsViewModalOpen(true);
                  }}
                  className="p-2.5 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-600/10 
                            text-blue-400 hover:from-blue-500/20 hover:to-blue-600/20 
                            hover:text-blue-300 hover:shadow-md hover:shadow-blue-500/30 
                            transform hover:scale-110 transition-all duration-300 ease-out"
                  title="View"
                >
                  <FaEye className="text-sm" />
                </button>

                {/* Edit */}
                <button
                  onClick={() => {
                    setSelectedSubject(s);
                    setIsEditModalOpen(true);
                  }}
                  className="p-2.5 rounded-lg bg-gradient-to-br from-yellow-500/10 to-amber-500/10 
                            text-yellow-400 hover:from-yellow-500/20 hover:to-amber-500/20 
                            hover:text-yellow-300 hover:shadow-md hover:shadow-yellow-500/30 
                            transform hover:scale-110 transition-all duration-300 ease-out"
                  title="Edit"
                >
                  <FaEdit className="text-sm" />
                </button>

                {/* Delete */}
                <button
                  onClick={() => {
                    setSelectedSubject(s);
                    setIsDeleteModalOpen(true);
                  }}
                  className="p-2.5 rounded-lg bg-gradient-to-br from-red-500/10 to-rose-600/10 
                            text-red-400 hover:from-red-500/20 hover:to-rose-600/20 
                            hover:text-red-300 hover:shadow-md hover:shadow-red-500/30 
                            transform hover:scale-110 transition-all duration-300 ease-out"
                  title="Delete"
                >
                  <FaTrash className="text-sm" />
                </button>
              </div>
              </div>

              {/* Mobile card view */}
              <div className="md:hidden p-4 space-y-2 text-sm text-neutral-300 bg-neutral-900/40 rounded-lg m-2 shadow-sm">
                <p>
                  <span className="text-neutral-400">Code:</span>{" "}
                  <span className="font-mono text-emerald-400">{s.subject_code}</span>
                </p>
                <p>
                  <span className="text-neutral-400">Title:</span>{" "}
                  <span className="font-medium text-white">{s.subject_title}</span>
                </p>
                <p>
                  <span className="text-neutral-400">Course:</span> {s.course}
                </p>
                <p>
                  <span className="text-neutral-400">Year:</span>{" "}
                  {s.year_level || "—"}
                </p>
                <p>
                  <span className="text-neutral-400">Semester:</span>{" "}
                  {s.semester || "—"}
                </p>
                <div className="flex justify-end gap-2 pt-3">
                {/* View */}
                <button
                  onClick={() => {
                    setSelectedSubject(s);
                    setIsViewModalOpen(true);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg 
                            bg-blue-500/10 text-blue-400 text-xs font-medium 
                            hover:bg-blue-500/20 hover:text-blue-300 
                            transition-all duration-200 shadow-sm hover:shadow-blue-500/20"
                >
                  <FaEye className="text-xs" /> View
                </button>

                {/* Edit */}
                <button
                  onClick={() => {
                    setSelectedSubject(s);
                    setIsEditModalOpen(true);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg 
                            bg-yellow-500/10 text-yellow-400 text-xs font-medium 
                            hover:bg-yellow-500/20 hover:text-yellow-300 
                            transition-all duration-200 shadow-sm hover:shadow-yellow-500/20"
                >
                  <FaEdit className="text-xs" /> Edit
                </button>

                {/* Delete */}
                <button
                  onClick={() => {
                    setSelectedSubject(s);
                    setIsDeleteModalOpen(true);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg 
                            bg-red-500/10 text-red-400 text-xs font-medium 
                            hover:bg-red-500/20 hover:text-red-300 
                            transition-all duration-200 shadow-sm hover:shadow-red-500/20"
                >
                  <FaTrash className="text-xs" /> Delete
                </button>
              </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-neutral-500 py-6 text-sm italic">
            No subjects found.
          </div>
        )}
      </div>


      {/* Add Subject Modal */}
      <AddSubjectModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubjectAdded={handleSubjectAdded}
      />

      {/* View Modal */}
      <ViewSubjectModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        subject={selectedSubject}
      />

      {/* Edit Modal */}
      <EditSubjectModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        subject={selectedSubject}
        onSubjectUpdated={handleSubjectUpdated}
      />

      {/* Delete Confirmation Modal */}
      <DeleteSubjectConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        subject={selectedSubject}
        onConfirm={handleDelete}
      />
    </div>
  );
}
