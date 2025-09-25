import React from "react";
import { FaTimes, FaTrash, FaExclamationCircle } from "react-icons/fa";

export default function DeleteSubjectConfirmationModal({ isOpen, onClose, onConfirm, subject }) {
  if (!isOpen || !subject) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-neutral-900 text-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-neutral-700 animate-fadeIn">
        {/* Header with Icon */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-neutral-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center bg-red-600/20 text-red-400 rounded-full">
              <FaExclamationCircle size={18} />
            </div>
            <h3 className="text-xl font-bold text-red-400">Delete Subject</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition"
          >
            <FaTimes />
          </button>
        </div>

        {/* Warning Message */}
        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-neutral-300 leading-relaxed">
            Are you sure you want to delete this subject?{" "}
            <span className="text-red-400 font-semibold">This action cannot be undone.</span>
          </p>

          {/* Subject Card */}
            <div className="bg-neutral-800/70 border border-neutral-700 rounded-xl p-5 grid grid-cols-2 gap-y-4 gap-x-6 text-sm hover:border-green-500/40 transition">
            <div>
                <p className="text-[11px] uppercase text-neutral-400 tracking-wide">Code</p>
                <p className="text-base font-semibold text-white">{subject.subject_code}</p>
            </div>
            <div>
                <p className="text-[11px] uppercase text-neutral-400 tracking-wide">Course</p>
                <p className="text-base font-semibold text-white">{subject.course}</p>
            </div>

            <div className="col-span-2">
                <p className="text-[11px] uppercase text-neutral-400 tracking-wide">Title</p>
                <p className="text-base font-semibold text-red-400">
                {subject.subject_title}
                </p>
            </div>

            <div>
                <p className="text-[11px] uppercase text-neutral-400 tracking-wide">Year Level</p>
                <p className="text-base font-semibold text-white">{subject.year_level || "—"}</p>
            </div>
            <div>
                <p className="text-[11px] uppercase text-neutral-400 tracking-wide">Semester</p>
                <p className="text-base font-semibold text-white">{subject.semester || "—"}</p>
            </div>
            </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-neutral-700">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-neutral-800 border border-neutral-700 text-sm font-medium hover:bg-neutral-700 transition"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(subject._id)}
            className="flex items-center gap-2 px-5 py-2 rounded-full bg-red-600 hover:bg-red-700 text-sm font-semibold shadow-lg shadow-red-600/20 hover:shadow-red-500/40 transition"
          >
            <FaTrash /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}
