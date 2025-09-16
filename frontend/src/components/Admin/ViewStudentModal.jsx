import React from "react";

const ViewStudentModal = ({ isOpen, onClose, student }) => {
  if (!isOpen || !student) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      {/* Modal Container */}
      <div className="bg-neutral-900 w-full max-w-lg rounded-2xl shadow-2xl border border-neutral-700 p-8 relative animate-fadeIn">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-white transition"
        >
          ✕
        </button>

        {/* Header */}
        <h2 className="text-2xl font-bold text-green-400 mb-6 text-center tracking-wide">
          Student Information
        </h2>

        {/* Content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Student ID */}
          <div className="bg-neutral-800/60 rounded-lg p-4 border border-neutral-700">
            <p className="text-xs text-neutral-400">Student ID</p>
            <p className="font-mono text-lg text-white">{student.student_id}</p>
          </div>

          {/* Course */}
          <div className="bg-neutral-800/60 rounded-lg p-4 border border-neutral-700">
            <p className="text-xs text-neutral-400">Course</p>
            <p className="text-green-300 font-semibold">{student.course}</p>
          </div>

          {/* First Name */}
          <div className="bg-neutral-800/60 rounded-lg p-4 border border-neutral-700">
            <p className="text-xs text-neutral-400">First Name</p>
            <p className="text-white font-medium">{student.first_name}</p>
          </div>

          {/* Middle Name */}
          <div className="bg-neutral-800/60 rounded-lg p-4 border border-neutral-700">
            <p className="text-xs text-neutral-400">Middle Name</p>
            <p className="text-white font-medium">
              {student.middle_name || "—"}
            </p>
          </div>

          {/* Last Name */}
          <div className="bg-neutral-800/60 rounded-lg p-4 border border-neutral-700 sm:col-span-2">
            <p className="text-xs text-neutral-400">Last Name</p>
            <p className="text-white font-medium">{student.last_name}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewStudentModal;
