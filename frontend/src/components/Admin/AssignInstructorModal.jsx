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
      setClasses(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error("❌ Failed to load classes");
    }
  };

  const toggleClassSelection = (classId) => {
    if (selectedClasses.includes(classId)) {
      setSelectedClasses(selectedClasses.filter((id) => id !== classId));
    } else {
      setSelectedClasses([...selectedClasses, classId]);
    }
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
        `✅ Assigned ${instructor.first_name} ${instructor.last_name} to ${selectedClasses.length} class(es)`
      );

      if (onAssigned) onAssigned();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("❌ Failed to assign instructor");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-neutral-900 w-full max-w-lg rounded-2xl shadow-2xl border border-neutral-700 p-6 relative">
        {/* Header */}
        <h3 className="text-xl font-bold text-green-400 mb-4 flex items-center gap-2">
          <FaUserPlus /> Assign Instructor
        </h3>

        <p className="text-neutral-300 mb-6">
          Assign{" "}
          <span className="font-semibold text-white">
            {instructor.first_name} {instructor.last_name}
          </span>{" "}
          to one or more classes:
        </p>

        {/* Classes List */}
        <div className="max-h-64 overflow-y-auto space-y-2 mb-6 pr-1">
          {classes.length > 0 ? (
            classes.map((cls) => (
              <label
                key={cls._id}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition border ${
                  selectedClasses.includes(cls._id)
                    ? "bg-green-700/20 border-green-500"
                    : "bg-neutral-800 border-neutral-700 hover:bg-neutral-700/50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedClasses.includes(cls._id)}
                  onChange={() => toggleClassSelection(cls._id)}
                  className="form-checkbox h-4 w-4 text-green-500 rounded focus:ring-green-400"
                />
                <div className="flex flex-col">
                  <span className="text-white font-medium flex items-center gap-2">
                    <FaBook className="text-green-400" />
                    {cls.subject_code} – {cls.subject_title}
                  </span>
                  <span className="text-xs text-neutral-400">
                    {cls.course} | {cls.year_level} | {cls.semester}
                  </span>
                </div>
              </label>
            ))
          ) : (
            <p className="text-neutral-500 italic text-sm">
              No classes available
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 border-t border-neutral-700 pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 rounded-lg text-sm text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            className="px-5 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm text-white font-semibold shadow"
          >
            Assign
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignInstructorModal;
