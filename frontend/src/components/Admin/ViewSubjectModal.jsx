import { createPortal } from "react-dom";
import { FaTimes, FaBookOpen, FaGraduationCap, FaLayerGroup } from "react-icons/fa";

export default function ViewSubjectModal({ isOpen, onClose, subject }) {
  if (!isOpen || !subject) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/70 backdrop-blur-lg flex items-center justify-center z-50 animate-fadeIn px-4 sm:px-6">
      <div
        className="bg-gradient-to-br from-neutral-900/80 to-neutral-950/90 
                   text-white rounded-2xl shadow-2xl w-full 
                   max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl 
                   border border-white/10 relative overflow-hidden animate-scaleIn"
      >
        {/* Header */}
        <div className="flex justify-between items-center px-4 sm:px-6 py-3 sm:py-4 border-b border-white/10 bg-neutral-900/40 backdrop-blur-sm">
          <h3
            className="text-lg sm:text-xl md:text-2xl font-extrabold flex items-center gap-2"
          >
            <FaBookOpen className="text-emerald-400" />
            <span className="bg-gradient-to-r from-emerald-400 to-green-500 bg-clip-text text-transparent">
              Subject Details
            </span>
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-neutral-800/50 hover:bg-rose-600/60 
                       text-neutral-400 hover:text-white transition"
          >
            <FaTimes />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Code & Course */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <InfoCard label="Code" value={subject.subject_code} />
            <InfoCard label="Course" value={subject.course} />
          </div>

          {/* Title */}
          <InfoCard label="Title" value={subject.subject_title} full />

          {/* Year & Semester */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <InfoCard
              label="Year Level"
              value={subject.year_level || "—"}
              icon={<FaGraduationCap className="text-emerald-400" />}
            />
            <InfoCard
              label="Semester"
              value={subject.semester || "—"}
              icon={<FaLayerGroup className="text-emerald-400" />}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-white/10 bg-neutral-900/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 sm:px-6 py-2 rounded-lg font-semibold text-white 
                       bg-gradient-to-r from-emerald-400 to-green-600
                       hover:from-emerald-500 hover:to-green-700
                       shadow-md hover:shadow-emerald-500/30 
                       transform hover:scale-105 transition-all text-sm sm:text-base"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ✅ Reusable InfoCard */
function InfoCard({ label, value, icon, full = false }) {
  return (
    <div
      className={`bg-neutral-800/50 p-3 sm:p-4 rounded-xl border border-white/10 
                  backdrop-blur-md shadow-sm 
                  hover:shadow-emerald-500/20 hover:scale-[1.02] 
                  transition-all duration-300 ${full ? "col-span-1 sm:col-span-2" : ""}`}
    >
      <p className="text-xs uppercase tracking-wide text-neutral-400">{label}</p>
      <p className="mt-2 font-bold text-base sm:text-lg flex items-center gap-2 text-white break-words">
        {icon} {value}
      </p>
    </div>
  );
}
