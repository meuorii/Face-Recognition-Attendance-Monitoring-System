import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import {
  FaChalkboardTeacher,
  FaBook,
  FaCalendarAlt,
  FaEye,
  FaEdit,
  FaTrash,
} from "react-icons/fa";
import StudentsModal from "./StudentsModal";
import EditClassModal from "./EditClassModal";
import DeleteClassModal from "./DeleteClassModal";

const ClassManagementComponent = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState(null);
  const [editClass, setEditClass] = useState(null);
  const [deleteClass, setDeleteClass] = useState(null);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/classes", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setClasses(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error("❌ Failed to load classes");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `http://localhost:5000/api/classes/${deleteClass._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("✅ Class deleted");
      setDeleteClass(null);
      fetchClasses();
    } catch (err) {
      console.error(err);
      toast.error("❌ Failed to delete class");
    }
  };

  const handleEdit = async () => {
    try {
      const token = localStorage.getItem("token");

      const cleanedScheduleBlocks = (editClass.schedule_blocks || [])
        .map((block) => ({
          ...block,
          days: (block.days || []).filter((d) => d && d.trim() !== ""),
        }))
        .filter(
          (block) =>
            (block.days && block.days.length > 0) ||
            block.start ||
            block.end
        );

      await axios.put(
        `http://localhost:5000/api/classes/${editClass._id}`,
        {
          section: editClass.section,
          semester: editClass.semester,
          schedule_blocks:
            cleanedScheduleBlocks.length > 0 ? cleanedScheduleBlocks : [],
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("✅ Class updated");
      setEditClass(null);
      fetchClasses();
    } catch (err) {
      console.error(err);
      toast.error("❌ Failed to update class");
    }
  };

  return (
    <div className="bg-neutral-950 backdrop-blur-md p-8 rounded-2xl shadow-xl max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-extrabold flex items-center gap-2 bg-gradient-to-r from-emerald-400 to-green-600 bg-clip-text text-transparent">
          <FaChalkboardTeacher className="text-emerald-400" />
          Class Management
        </h2>
      </div>

      {/* Loading State */}
      {loading ? (
        <p className="text-neutral-400">Loading classes...</p>
      ) : classes.length > 0 ? (
        <div className="grid sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {classes.map((cls, idx) => (
            <div
              key={idx}
              className="group rounded-2xl p-6 border border-white/10 
                         bg-gradient-to-br from-neutral-800/70 to-neutral-900/80
                         shadow-md hover:shadow-emerald-500/20 
                         transition-all duration-300 transform hover:scale-[1.02] flex flex-col"
            >
              {/* Title */}
              <h3 className="mb-4">
                <span className="flex items-center gap-2">
                  <FaBook className="text-emerald-400 text-lg" />
                  <span className="bg-gradient-to-r from-emerald-400 to-green-500 bg-clip-text text-transparent font-semibold text-sm tracking-wide">
                    {cls.subject_code}
                  </span>
                </span>
                <span className="block text-white text-xl font-bold mt-1 leading-snug group-hover:text-emerald-300 transition">
                  {cls.subject_title}
                </span>
              </h3>

              {/* Info */}
              <div className="text-sm text-neutral-400 space-y-2 mb-4">
                <p className="flex items-center gap-2">
                  <FaChalkboardTeacher className="text-emerald-400" />
                  <span className="text-white font-medium">
                    {cls.instructor_first_name || "N/A"} {cls.instructor_last_name || ""}
                  </span>
                </p>
                <p>🎓 {cls.course} | {cls.section}</p>
                <p>📅 {cls.semester} | {cls.year_level}</p>
              </div>

              {/* Attendance Rate */}
              <div className="mb-4 text-sm">
                <span className="text-neutral-400">Attendance Rate: </span>
                <span className="bg-gradient-to-r from-emerald-400 to-green-500 bg-clip-text text-transparent font-bold">
                  {cls.attendance_rate ?? 0}%
                </span>
              </div>

              {/* Schedule */}
              <div className="mb-4">
                <h4 className="text-sm text-neutral-300 font-semibold mb-2 flex items-center gap-1">
                  <FaCalendarAlt className="text-emerald-400" /> Schedule
                </h4>
                <ul className="flex flex-wrap gap-2 text-xs">
                  {Array.isArray(cls.schedule_blocks) && cls.schedule_blocks.length > 0 ? (
                    cls.schedule_blocks.map((block, i) => (
                      <li
                        key={i}
                        className="px-3 py-1 rounded-lg bg-gradient-to-r from-emerald-600/30 to-green-600/20 
                                   border border-emerald-400/30 text-white flex items-center gap-2 shadow-sm"
                      >
                        <span className="font-medium text-emerald-400">
                          {block.days.filter(Boolean).join(", ")}
                        </span>
                        <span className="text-neutral-300">
                          {block.start} - {block.end}
                        </span>
                      </li>
                    ))
                  ) : (
                    <li className="italic text-gray-500">No schedule set</li>
                  )}
                </ul>
              </div>

              {/* Actions */}
              <div className="mt-auto pt-4 border-t border-white/10 space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setSelectedClass(cls)}
                    className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg 
                               bg-gradient-to-r from-blue-500 to-blue-600 
                               text-white text-sm font-medium shadow-md
                               hover:shadow-blue-500/30 transform hover:scale-105 transition"
                  >
                    <FaEye /> View
                  </button>
                  <button
                    onClick={() => setEditClass(cls)}
                    className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg 
                               bg-gradient-to-r from-yellow-400 to-amber-500 
                               text-white text-sm font-medium shadow-md
                               hover:shadow-yellow-400/30 transform hover:scale-105 transition"
                  >
                    <FaEdit /> Edit
                  </button>
                  <button
                    onClick={() => setDeleteClass(cls)}
                    className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg 
                               bg-gradient-to-r from-red-500 to-rose-600 
                               text-white text-sm font-medium shadow-md
                               hover:shadow-red-500/30 transform hover:scale-105 transition"
                  >
                    <FaTrash /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-neutral-400 text-sm mt-4 text-center">
          No classes created yet.
        </p>
      )}
      
      {selectedClass && (
      <StudentsModal
        isOpen={!!selectedClass}
        onClose={() => setSelectedClass(null)}
        selectedClass={selectedClass}
      />
    )}
       
      {editClass && (
        <EditClassModal
          isOpen={!!editClass}
          editClass={editClass}
          setEditClass={setEditClass}
          onClose={() => setEditClass(null)}
          onSave={handleEdit} // your API save function
        />
      )}

      <DeleteClassModal
        isOpen={!!deleteClass}
        deleteClass={deleteClass}
        onClose={() => setDeleteClass(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default ClassManagementComponent;
