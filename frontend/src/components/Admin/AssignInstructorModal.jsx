import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { FaUserPlus, FaBook, FaTimes } from "react-icons/fa";
import { createPortal } from "react-dom";

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
      prev.includes(classId)
        ? prev.filter((id) => id !== classId)
        : [...prev, classId]
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

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70 backdrop-blur-lg animate-fadeIn">
      <div className="w-full max-w-2xl rounded-2xl shadow-2xl border border-white/10 
                      bg-gradient-to-br from-neutral-900/70 to-neutral-950/80 
                      backdrop-blur-xl overflow-hidden animate-scaleIn flex flex-col">
        
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between 
                        bg-gradient-to-r from-neutral-900 to-neutral-950 backdrop-blur-md">
          <h3 className="text-xl sm:text-2xl font-extrabold flex items-center gap-2">
            <FaUserPlus className="text-emerald-400" />
            <span className="bg-gradient-to-r from-emerald-400 to-green-500 bg-clip-text text-transparent">
              Assign Instructor
            </span>
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-neutral-800/60 hover:bg-rose-600 
                       text-neutral-400 hover:text-white transition"
          >
            <FaTimes />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex-1 overflow-y-auto custom-scroll">
          <p className="text-neutral-300 mb-6 text-sm sm:text-base">
            Assign{" "}
            <span className="font-semibold text-white">
              {instructor.first_name} {instructor.last_name}
            </span>{" "}
            to one or more classes:
          </p>

          {/* Classes List */}
          <div className="max-h-72 overflow-y-auto pr-1 grid gap-3">
            {classes.length > 0 ? (
              classes.map((cls, i) => (
                <label
                  key={cls._id}
                  className={`flex items-start gap-4 p-4 rounded-xl cursor-pointer border transition-all duration-300 
                    ${
                      selectedClasses.includes(cls._id)
                        ? "bg-gradient-to-r from-emerald-500/20 to-green-600/20 border-emerald-400 shadow-md shadow-emerald-500/20 scale-[1.0]"
                        : "bg-neutral-800/50 border-neutral-700 hover:bg-neutral-700/70"
                    } animate-fadeInUp`}
                  style={{ animationDelay: `${i * 70}ms` }}
                >
                  <input
                    type="checkbox"
                    checked={selectedClasses.includes(cls._id)}
                    onChange={() => toggleClassSelection(cls._id)}
                    className="h-5 w-5 rounded border border-emerald-500/40 accent-emerald-500
                               checked:ring-2 checked:ring-emerald-400/60 checked:shadow-[0_0_8px_#10b981]"
                  />
                  <div className="flex flex-col">
                    <span className="text-white font-semibold flex items-center gap-2">
                      <FaBook
                        className={`${
                          selectedClasses.includes(cls._id)
                            ? "text-emerald-400 drop-shadow-[0_0_6px_rgba(16,185,129,0.6)]"
                            : "text-neutral-400"
                        }`}
                      />
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
        <div className="p-5 border-t border-white/10 bg-neutral-900/50 backdrop-blur-md flex flex-col sm:flex-row justify-end gap-3">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 rounded-lg 
                      bg-gradient-to-r from-neutral-700 to-neutral-800 
                      text-neutral-300 text-sm font-medium
                      hover:from-neutral-600 hover:to-neutral-700 hover:text-white
                      hover:shadow-md hover:shadow-neutral-400/10
                      transform hover:scale-105 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            className="w-full sm:w-auto px-6 py-2 rounded-lg 
                      bg-gradient-to-r from-emerald-400 to-green-500
                      text-white text-sm font-semibold shadow-lg
                      hover:from-emerald-500 hover:to-green-600
                      hover:shadow-[0_0_12px_rgba(16,185,129,0.5)]
                      transform hover:scale-105 transition-all"
          >
            Assign Classes
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AssignInstructorModal;
