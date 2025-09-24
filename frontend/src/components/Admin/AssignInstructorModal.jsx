import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { FaUserPlus, FaBook } from "react-icons/fa";

const AssignInstructorModal = ({ instructor, onClose, onAssigned }) => {
  const [classes, setClasses] = useState([]);
  const [selectedClasses, setSelectedClasses] = useState([]);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/classes", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = res.data || [];
      setClasses(data);

      // ✅ Preselect already assigned classes
      const alreadyAssigned = data
        .filter((cls) => cls.instructor_id === instructor.instructor_id)
        .map((cls) => cls._id);
      setSelectedClasses(alreadyAssigned);
    } catch (err) {
      console.error(err);
      toast.error("❌ Failed to load classes");
    }
  };

  const toggleClassSelection = (classId) => {
    setSelectedClasses((prev) =>
      prev.includes(classId) ? prev.filter((id) => id !== classId) : [...prev, classId]
    );
  };

  const handleAssign = async () => {
    if (selectedClasses.length === 0) {
      toast.warning("⚠️ Please select at least one class");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      await Promise.all(
        selectedClasses.map((classId) =>
          axios.put(
            `http://localhost:5000/api/classes/${classId}/assign-instructor`,
            {
              instructor_id: instructor.instructor_id,
              instructor_first_name: instructor.first_name,
              instructor_last_name: instructor.last_name,
              email: instructor.email,
            },
            { headers: { Authorization: `Bearer ${token}` } }
          )
        )
      );

      toast.success(
        `✅ ${instructor.first_name} ${instructor.last_name} assigned to ${selectedClasses.length} class(es)`
      );

      if (onAssigned) onAssigned();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("❌ Failed to assign instructor");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md">
      <div className="bg-neutral-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-neutral-800 overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="p-6 border-b border-neutral-800 flex items-center justify-between">
          <h3 className="text-2xl font-bold text-green-400 flex items-center gap-2">
            <FaUserPlus /> Assign Instructor
          </h3>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-neutral-300 mb-6">
            Assign{" "}
            <span className="font-semibold text-white">
              {instructor.first_name} {instructor.last_name}
            </span>{" "}
            to one or more classes:
          </p>

          {/* Classes List */}
          <div className="max-h-72 overflow-y-auto pr-1 grid gap-3">
            {classes.length > 0 ? (
              classes.map((cls) => (
                <label
                  key={cls._id}
                  className={`flex items-start gap-4 p-4 rounded-xl cursor-pointer border transition group ${
                    selectedClasses.includes(cls._id)
                      ? "bg-green-800/20 border-green-500"
                      : "bg-neutral-800 border-neutral-700 hover:bg-neutral-700/60"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedClasses.includes(cls._id)}
                    onChange={() => toggleClassSelection(cls._id)}
                    className="h-5 w-5 accent-green-500 mt-1 rounded"
                  />
                  <div className="flex flex-col">
                    <span className="text-white font-semibold flex items-center gap-2">
                      <FaBook className="text-green-400" />
                      {cls.subject_code} – {cls.subject_title}
                    </span>
                    <span className="text-xs text-neutral-400">
                      {cls.course} | Year {cls.year_level} | {cls.semester}
                    </span>
                  </div>
                </label>
              ))
            ) : (
              <p className="text-neutral-500 italic text-sm text-center">
                No classes available
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-neutral-800 flex justify-end gap-3 bg-neutral-950">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-neutral-700 hover:bg-neutral-600 rounded-lg text-sm text-white font-medium transition"
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm text-white font-semibold shadow-lg transition-transform hover:scale-105"
          >
            Assign Classes
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignInstructorModal;
