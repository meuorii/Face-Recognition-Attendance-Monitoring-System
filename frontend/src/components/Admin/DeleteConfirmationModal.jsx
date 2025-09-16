import React from "react";

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, student }) => {
  if (!isOpen || !student) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-neutral-900 w-full max-w-sm rounded-xl shadow-xl border border-neutral-700 p-6 relative animate-fadeIn">
        {/* Header */}
        <h2 className="text-xl font-bold text-red-400 mb-4 text-center">
          Delete Student
        </h2>

        {/* Message */}
        <p className="text-neutral-300 text-sm text-center">
          Are you sure you want to delete{" "}
          <span className="font-semibold text-white">
            {student.first_name} {student.last_name}
          </span>{" "}
          (ID: {student.student_id})? This action cannot be undone.
        </p>

        {/* Buttons */}
        <div className="flex justify-center gap-4 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-neutral-700 text-neutral-300 hover:bg-neutral-600 transition text-sm"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition text-sm font-semibold"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;
