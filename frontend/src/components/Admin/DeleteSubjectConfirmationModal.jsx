import React from "react";
import { FaTimes, FaTrash, FaExclamationTriangle } from "react-icons/fa";

export default function DeleteSubjectConfirmationModal({ isOpen, onClose, onConfirm, subject }) {
  if (!isOpen || !subject) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4 sm:px-6 animate-fadeIn">
      <div
        className="bg-gradient-to-br from-neutral-900/90 to-neutral-950/95 
                   text-white rounded-2xl shadow-2xl w-full 
                   max-w-sm sm:max-w-md md:max-w-lg 
                   border border-white/10 overflow-hidden animate-scaleIn"
      >
        {/* Header */}
        <div className="flex justify-between items-center px-4 sm:px-6 py-3 sm:py-4 border-b border-white/10 bg-neutral-900/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 flex items-center justify-center bg-red-600/20 text-red-400 rounded-full shadow-inner">
              <FaExclamationTriangle size={22} />
            </div>
            <h3 className="text-lg sm:text-xl font-extrabold bg-gradient-to-r from-red-400 to-rose-500 bg-clip-text text-transparent">
              Delete Subject
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-neutral-800/40 hover:bg-rose-600/60 
                       text-neutral-400 hover:text-white transition"
          >
            <FaTimes />
          </button>
        </div>

        {/* Warning */}
        <div className="px-4 sm:px-6 py-5 space-y-4">
          <p className="text-sm sm:text-base text-neutral-300 leading-relaxed">
            Are you sure you want to delete this subject?{" "}
            <span className="text-red-400 font-semibold">This action cannot be undone.</span>
          </p>

          {/* Subject Preview Card */}
          <div className="bg-neutral-800/60 border border-white/10 rounded-xl p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-sm hover:border-red-400/30 transition">
            <div>
              <p className="text-[11px] uppercase text-neutral-400 tracking-wide">Code</p>
              <p className="text-base font-semibold">{subject.subject_code}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase text-neutral-400 tracking-wide">Course</p>
              <p className="text-base font-semibold">{subject.course}</p>
            </div>

            <div className="sm:col-span-2">
              <p className="text-[11px] uppercase text-neutral-400 tracking-wide">Title</p>
              <p className="text-base sm:text-lg font-bold text-red-400">
                {subject.subject_title}
              </p>
            </div>

            <div>
              <p className="text-[11px] uppercase text-neutral-400 tracking-wide">Year Level</p>
              <p className="text-base font-semibold">{subject.year_level || "—"}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase text-neutral-400 tracking-wide">Semester</p>
              <p className="text-base font-semibold">{subject.semester || "—"}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 px-4 sm:px-6 py-4 border-t border-white/10 bg-neutral-900/50">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-neutral-800 border border-neutral-700 
                       text-sm font-medium text-neutral-300 hover:bg-neutral-700 transition"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(subject._id)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-full 
                       bg-gradient-to-r from-red-500 to-rose-600 
                       hover:from-red-600 hover:to-rose-700 
                       text-sm font-semibold shadow-lg shadow-red-600/20 hover:shadow-red-500/40 
                       transform hover:scale-105 transition-all"
          >
            <FaTrash /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}
