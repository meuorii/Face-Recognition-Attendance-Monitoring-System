import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import {
  FaChalkboardTeacher,
  FaUsers,
  FaBook,
  FaCalendarAlt,
  FaEye,
  FaEdit,
  FaTrash,
  FaCheckCircle,
  FaClock,
  FaTimesCircle,
} from "react-icons/fa";

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
    <div className="bg-neutral-900 p-8 rounded-2xl shadow-lg border border-neutral-700 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-white text-3xl font-bold tracking-tight flex items-center gap-2">
          <FaChalkboardTeacher className="text-green-500" />
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
              className="bg-neutral-800 rounded-xl p-6 border border-neutral-700 hover:border-green-400 hover:shadow-lg hover:shadow-green-500/10 transition transform hover:-translate-y-1 flex flex-col justify-between"
            >
              {/* Title */}
              <h3 className="mb-4">
                <span className="flex items-center gap-2">
                  <FaBook className="text-green-400 text-lg" />
                  <span className="text-green-400 font-semibold text-sm tracking-wide">
                    {cls.subject_code}
                  </span>
                </span>
                <span className="block text-white text-xl font-bold mt-1 leading-snug">
                  {cls.subject_title}
                </span>
              </h3>

              {/* Info */}
              <div className="text-sm text-neutral-400 space-y-2 mb-4">
                <p className="flex items-center gap-2">
                  <FaChalkboardTeacher className="text-green-400" />
                  <span className="text-white font-medium">
                    {cls.instructor_first_name || "N/A"} {cls.instructor_last_name || ""}
                  </span>
                </p>
                <p className="flex items-center gap-2">
                  🎓 <span>{cls.course} | {cls.section}</span>
                </p>
                <p className="flex items-center gap-2">
                  📅 <span>{cls.semester} | {cls.year_level}</span>
                </p>
              </div>

              {/* Attendance Rate */}
              <div className="mb-4 text-sm">
                <span className="text-neutral-400">Attendance Rate: </span>
                <span className="text-green-400 font-bold">{cls.attendance_rate ?? 0}%</span>
              </div>

              {/* Schedule */}
              <div className="mb-4">
                <h4 className="text-sm text-neutral-300 font-semibold mb-2 flex items-center gap-1">
                  <FaCalendarAlt className="text-green-400" /> Schedule
                </h4>
                <ul className="flex flex-wrap gap-2 text-xs">
                  {Array.isArray(cls.schedule_blocks) && cls.schedule_blocks.length > 0 ? (
                    cls.schedule_blocks.map((block, i) => (
                      <li
                        key={i}
                        className="px-3 py-1 rounded-lg bg-neutral-700 border border-neutral-600 text-white flex items-center gap-2"
                      >
                        <span className="font-medium text-green-400">
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
              <div className="mt-auto pt-4 border-t border-neutral-700 space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setSelectedClass(cls)}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm font-medium transition"
                  >
                    <FaEye /> View
                  </button>
                  <button
                    onClick={() => setEditClass(cls)}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-yellow-500 hover:bg-yellow-600 rounded-lg text-white text-sm font-medium transition"
                  >
                    <FaEdit /> Edit
                  </button>
                  <button
                    onClick={() => setDeleteClass(cls)}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white text-sm font-medium transition"
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

     {/* Students Modal */}
      {selectedClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-neutral-900 w-full max-w-2xl rounded-2xl shadow-xl border border-neutral-800 p-8 relative">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <FaUsers className="text-green-400" />
                Students in <span className="text-green-400">{selectedClass.subject_code}</span>
              </h3>
              <button
                onClick={() => setSelectedClass(null)}
                className="text-neutral-400 hover:text-white transition-colors text-lg"
              >
                ✕
              </button>
            </div>

            {/* Attendance Rate */}
            <div className="mb-8">
            <div className="flex items-center gap-2 text-lg">
              <span className="text-sm text-neutral-400 font-medium">Attendance Rate:</span>
              <span className="text-xl text-green-400 font-bold">
                {selectedClass.attendance_rate ?? 0}%
              </span>
            </div>
          </div>

            {/* Student List */}
            {selectedClass.students && selectedClass.students.length > 0 ? (
              <div className="max-h-96 overflow-y-auto pr-2 custom-scroll">
                <ul className="divide-y divide-neutral-800">
                  {selectedClass.students.map((st, idx) => (
                    <li
                      key={idx}
                      className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-neutral-800/70 transition"
                    >
                      <div>
                        <p className="text-white font-medium">{st.first_name} {st.last_name}</p>
                        <p className="text-xs text-neutral-500">{st.email || "No email"}</p>
                      </div>
                      <span className="text-sm font-semibold text-green-400 bg-green-500/10 px-3 py-1 rounded-lg border border-green-600/30">
                        {st.student_id}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="italic text-neutral-500 text-center py-12">
                No students enrolled yet
              </p>
            )}
          </div>
        </div>
      )}



      {/* Edit Modal */}
      {editClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-neutral-900 w-full max-w-5xl rounded-2xl shadow-2xl border border-neutral-700 p-8 relative">
            <h3 className="text-2xl font-bold text-yellow-400 mb-6 flex items-center gap-2 border-b border-neutral-700 pb-3">
              <FaEdit className="text-yellow-400" /> Edit Class
            </h3>

            {/* Section + Semester */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-neutral-400 text-sm mb-1">Section</label>
                <input
                  type="text"
                  value={editClass.section || ""}
                  onChange={(e) =>
                    setEditClass({ ...editClass, section: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-lg bg-neutral-800 border border-neutral-700 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 text-white transition"
                />
              </div>

              <div>
                <label className="block text-neutral-400 text-sm mb-1">Semester</label>
                <input
                  type="text"
                  value={editClass.semester || ""}
                  onChange={(e) =>
                    setEditClass({ ...editClass, semester: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-lg bg-neutral-800 border border-neutral-700 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 text-white transition"
                />
              </div>
            </div>

            {/* Schedule Blocks */}
            <div>
              <h4 className="text-sm text-neutral-300 font-semibold mb-3 flex items-center gap-2">
                <FaCalendarAlt className="text-yellow-400" /> Schedule Blocks
              </h4>

              {(Array.isArray(editClass.schedule_blocks) && editClass.schedule_blocks.length > 0
                ? editClass.schedule_blocks
                : [{ days: ["", "", ""], start: "", end: "" }]).map((block, idx) => (
                <div
                  key={idx}
                  className="mb-4 p-4 border border-neutral-700 rounded-xl bg-neutral-800 shadow-sm"
                >
                  <div className="grid grid-cols-5 gap-3 items-end">
                    {["Day 1", "Day 2", "Day 3"].map((label, i) => (
                      <div key={i}>
                        <label className="block text-neutral-400 text-xs mb-1">{label}</label>
                        <select
                          value={block.days?.[i] || ""}
                          onChange={(e) => {
                            const newBlocks = [...(editClass.schedule_blocks || [])];
                            const newDays = [...(block.days || ["", "", ""])];
                            newDays[i] = e.target.value;
                            newBlocks[idx] = { ...block, days: newDays };
                            setEditClass({
                              ...editClass,
                              schedule_blocks: newBlocks,
                            });
                          }}
                          className="w-full px-3 py-2 rounded-lg bg-neutral-700 border border-neutral-600 text-white focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition"
                        >
                          <option value="">Select Day</option>
                          <option value="Mon">Mon</option>
                          <option value="Tue">Tue</option>
                          <option value="Wed">Wed</option>
                          <option value="Thu">Thu</option>
                          <option value="Fri">Fri</option>
                          <option value="Sat">Sat</option>
                          <option value="Sun">Sun</option>
                        </select>
                      </div>
                    ))}

                    <div>
                      <label className="block text-neutral-400 text-xs mb-1">Start Time</label>
                      <input
                        type="time"
                        value={block.start || ""}
                        onChange={(e) => {
                          const newBlocks = [...(editClass.schedule_blocks || [])];
                          newBlocks[idx] = { ...block, start: e.target.value };
                          setEditClass({ ...editClass, schedule_blocks: newBlocks });
                        }}
                        className="w-full px-3 py-2 rounded-lg bg-neutral-700 border border-neutral-600 text-white focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-neutral-400 text-xs mb-1">End Time</label>
                      <input
                        type="time"
                        value={block.end || ""}
                        onChange={(e) => {
                          const newBlocks = [...(editClass.schedule_blocks || [])];
                          newBlocks[idx] = { ...block, end: e.target.value };
                          setEditClass({ ...editClass, schedule_blocks: newBlocks });
                        }}
                        className="w-full px-3 py-2 rounded-lg bg-neutral-700 border border-neutral-600 text-white focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button
                onClick={() =>
                  setEditClass({
                    ...editClass,
                    schedule_blocks: [
                      ...(editClass.schedule_blocks || []),
                      { days: ["", "", ""], start: "", end: "" },
                    ],
                  })
                }
                className="flex items-center gap-2 px-4 py-2 mt-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm text-white font-semibold shadow transition"
              >
                <FaCalendarAlt /> Add Schedule Block
              </button>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 mt-8 border-t border-neutral-700 pt-4">
              <button
                onClick={() => setEditClass(null)}
                className="px-5 py-2 bg-neutral-700 hover:bg-neutral-600 rounded-lg text-sm text-white transition"
              >
                Cancel
              </button>
              <button
                onClick={handleEdit}
                className="px-5 py-2 bg-yellow-500 hover:bg-yellow-600 rounded-lg text-sm text-white font-semibold shadow"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-neutral-900 w-full max-w-md rounded-2xl shadow-2xl border border-neutral-700 p-8 relative">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-red-500 flex items-center gap-2">
                <FaTrash className="text-red-500 text-lg" />
                Delete Class
              </h3>
              <button
                onClick={() => setDeleteClass(null)}
                className="text-neutral-400 hover:text-white transition"
              >
                ✕
              </button>
            </div>

            <div className="text-center">
              <p className="text-neutral-300 mb-6 leading-relaxed">
                Are you sure you want to permanently delete
                <br />
                <span className="font-bold text-white">{deleteClass.subject_code}</span>{" "}
                –{" "}
                <span className="text-red-400 font-semibold">
                  {deleteClass.subject_title}
                </span>
                ?
              </p>
              <p className="text-sm text-neutral-500 mb-8">
                This action cannot be undone.
              </p>
            </div>

            <div className="flex justify-center gap-4">
              <button
                onClick={() => setDeleteClass(null)}
                className="px-5 py-2 bg-neutral-700 hover:bg-neutral-600 rounded-lg text-sm text-white font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm text-white font-semibold shadow"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassManagementComponent;
