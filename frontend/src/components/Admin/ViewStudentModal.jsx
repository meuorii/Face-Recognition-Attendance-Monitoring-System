import React from "react";
import { createPortal } from "react-dom";
import { FaIdBadge, FaTimes } from "react-icons/fa";

const ViewStudentModal = ({ isOpen, onClose, student }) => {
  if (!isOpen || !student) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fadeIn px-4">
      {/* Modal Container */}
      <div className="bg-neutral-900/80 w-full max-w-2xl rounded-2xl shadow-2xl border border-white/10 
                      p-6 sm:p-8 relative transform transition-all scale-95 hover:scale-100 duration-300 
                      max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-2 rounded-full bg-neutral-800/60 
                     hover:bg-red-500/30 text-neutral-400 hover:text-white transition"
        >
          <FaTimes />
        </button>

        {/* Header */}
        <div className="flex items-center justify-center gap-3 mb-6 text-center">
          <FaIdBadge className="text-emerald-400 text-3xl sm:text-4xl drop-shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
          <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold 
                         bg-gradient-to-r from-emerald-400 to-green-600 
                         bg-clip-text text-transparent tracking-wide">
            Student Information
          </h2>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoCard label="Student ID" value={student.student_id} mono />
          <InfoCard label="Course" value={student.course} highlight="emerald" />
          <InfoCard label="First Name" value={student.first_name} />
          <InfoCard label="Middle Name" value={student.middle_name || "—"} />
          <InfoCard label="Last Name" value={student.last_name} fullWidth />
        </div>
      </div>
    </div>,
    document.body
  );
};

/* ✅ Enhanced Reusable InfoCard */
function InfoCard({ label, value, mono = false, highlight = null, fullWidth = false }) {
  const highlightClasses =
    highlight === "emerald"
      ? "bg-gradient-to-r from-emerald-400 to-green-500 bg-clip-text text-transparent font-bold"
      : "text-white font-semibold";

  return (
    <div
      className={`rounded-xl p-4 sm:p-5 border border-white/10 
        bg-gradient-to-br from-neutral-800/70 to-neutral-900/70 
        backdrop-blur-md shadow-md
        hover:shadow-emerald-500/20 hover:scale-[1.02]
        transition-all duration-300 ease-out
        ${fullWidth ? "sm:col-span-2" : ""}`}
    >
      <p className="text-xs sm:text-sm text-neutral-400 uppercase tracking-wide mb-1">
        {label}
      </p>
      <p
        className={`text-base sm:text-lg md:text-xl mt-1 
          ${mono ? "font-mono text-emerald-400" : highlightClasses}`}
      >
        {value}
      </p>
    </div>
  );
}

export default ViewStudentModal;
