import { createPortal } from "react-dom";
import { FaUsers, FaTimes } from "react-icons/fa";

const StudentsModal = ({ isOpen, onClose, selectedClass }) => {
  if (!isOpen || !selectedClass) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fadeIn px-4">
      <div
        className="bg-gradient-to-br from-neutral-900/80 to-neutral-950/90 backdrop-blur-xl 
                   w-full max-w-sm sm:max-w-lg md:max-w-2xl rounded-2xl shadow-2xl 
                   border border-white/10 p-4 sm:p-6 md:p-8 relative animate-scaleIn"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6 border-b border-white/10 pb-2 sm:pb-3">
          <h3
            className="text-lg sm:text-xl md:text-2xl font-extrabold flex items-center gap-2 
                       bg-gradient-to-r from-emerald-400 to-green-500 bg-clip-text text-transparent"
          >
            <FaUsers className="text-emerald-400 text-base sm:text-lg" />
            Students in {selectedClass.subject_code}
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-neutral-800/60 hover:bg-rose-600/60 
                       text-neutral-400 hover:text-white transition"
          >
            <FaTimes className="text-base sm:text-lg" />
          </button>
        </div>

        {/* Attendance Rate */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 text-base sm:text-lg">
            <span className="text-sm text-neutral-400 font-medium">Attendance Rate:</span>
            <span
              className="text-lg sm:text-xl font-bold 
                         bg-gradient-to-r from-emerald-400 to-green-500 
                         bg-clip-text text-transparent"
            >
              {selectedClass.attendance_rate ?? 0}%
            </span>
          </div>
        </div>

        {/* Student List */}
        {selectedClass.students && selectedClass.students.length > 0 ? (
          <div className="max-h-72 sm:max-h-96 overflow-y-auto pr-1 sm:pr-2 custom-scroll">
            <ul className="divide-y divide-neutral-800">
              {selectedClass.students.map((st, idx) => (
                <li
                  key={idx}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between 
                             gap-2 sm:gap-0 py-3 px-3 sm:px-4 rounded-lg 
                             hover:bg-gradient-to-r hover:from-emerald-500/10 hover:to-green-600/10 
                             transition-all duration-200"
                >
                  <div className="text-center sm:text-left">
                    <p className="text-white font-medium text-sm sm:text-base">
                      {st.first_name} {st.last_name}
                    </p>
                    <p className="text-xs text-neutral-500 break-words">{st.email || "No email"}</p>
                  </div>
                  <span
                    className="text-xs sm:text-sm font-semibold text-emerald-400 
                               bg-emerald-500/10 px-3 py-1 rounded-lg 
                               border border-emerald-400/30 shadow-sm text-center"
                  >
                    {st.student_id}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="italic text-neutral-500 text-center py-12 text-sm sm:text-base">
            No students enrolled yet
          </p>
        )}
      </div>
    </div>,
    document.body
  );
};

export default StudentsModal;
