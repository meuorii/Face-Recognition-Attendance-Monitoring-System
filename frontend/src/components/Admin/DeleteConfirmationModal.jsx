import React from "react";
import { createPortal } from "react-dom";
import { FaExclamationTriangle, FaTimes } from "react-icons/fa";

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, student }) => {
  if (!isOpen || !student) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md animate-fadeIn px-4">
      {/* Modal Container */}
      <div
        className="bg-neutral-900/95 w-full max-w-md rounded-2xl shadow-2xl border border-white/10 
                   overflow-hidden animate-scaleIn max-h-[95vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 
                        border-b border-white/10 bg-neutral-900/80 sticky top-0 z-10">
          <div className="flex items-center gap-2 sm:gap-3">
            <FaExclamationTriangle className="text-red-500 text-xl sm:text-2xl drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
            <h2 className="text-lg sm:text-xl font-extrabold bg-gradient-to-r from-red-400 to-rose-600 bg-clip-text text-transparent">
              Delete Student
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-neutral-800 hover:bg-red-500 text-neutral-400 hover:text-white transition"
          >
            <FaTimes />
          </button>
        </div>

        {/* Message */}
        <div className="px-4 sm:px-6 py-5 sm:py-6 text-center space-y-3 overflow-y-auto">
          <p className="text-neutral-300 text-sm sm:text-base">
            Are you sure you want to permanently delete
          </p>
          <p className="font-semibold text-white text-lg sm:text-xl">
            {student.first_name} {student.last_name}
          </p>
          <p className="text-xs sm:text-sm text-neutral-400">
            Student ID:{" "}
            <span className="text-neutral-200 font-mono">
              {student.student_id}
            </span>
          </p>
          <p className="text-red-400 text-xs sm:text-sm mt-2">
            ⚠ This action cannot be undone.
          </p>
        </div>

        {/* Buttons */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-white/10 bg-neutral-900/80 
                        flex flex-col sm:flex-row justify-center gap-3 sticky bottom-0 z-10">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 sm:px-5 py-2 rounded-lg 
                      bg-gradient-to-r from-neutral-700 to-neutral-800 
                      text-neutral-300 text-sm font-medium shadow-sm
                      transition-all duration-300 ease-in-out
                      hover:from-neutral-600 hover:to-neutral-700 hover:text-white
                      hover:shadow-[0_0_10px_rgba(255,255,255,0.1)]
                      transform hover:scale-105 hover:-translate-y-[2px]"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            className="w-full sm:w-auto px-4 sm:px-5 py-2 rounded-lg 
                      bg-gradient-to-r from-red-500 to-rose-600 
                      text-white text-sm font-semibold shadow-md
                      transition-all duration-300 ease-in-out
                      hover:from-red-600 hover:to-rose-700
                      hover:shadow-[0_0_15px_rgba(239,68,68,0.5)]
                      transform hover:scale-105 hover:-translate-y-[2px]"
          >
            Delete
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default DeleteConfirmationModal;
