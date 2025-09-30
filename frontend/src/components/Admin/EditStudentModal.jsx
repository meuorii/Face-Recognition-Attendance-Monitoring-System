import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { FaUserEdit, FaTimes } from "react-icons/fa";

const EditStudentModal = ({ isOpen, onClose, student, onStudentUpdated }) => {
  const [formData, setFormData] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    course: "",
  });

  // Load student data into form
  useEffect(() => {
    if (student) {
      setFormData({
        first_name: student.first_name || "",
        middle_name: student.middle_name || "",
        last_name: student.last_name || "",
        course: student.course || "",
      });
    }
  }, [student]);

  if (!isOpen || !student) return null;

  // Handle input change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(
        `http://localhost:5000/api/admin/students/${student.student_id}`,
        formData
      );
      toast.success("✅ Student updated successfully!");
      onStudentUpdated({ ...student, ...formData });
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("❌ Failed to update student.");
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fadeIn px-4">
      <div
        className="bg-neutral-900/95 w-full max-w-2xl rounded-2xl shadow-2xl border border-white/10 
                   flex flex-col animate-scaleIn max-h-[95vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 
                        border-b border-white/10 bg-neutral-900 backdrop-blur sticky top-0 z-10">
          <div className="flex items-center gap-2 sm:gap-3">
            <FaUserEdit className="text-emerald-400 text-xl sm:text-2xl" />
            <h2 className="text-lg sm:text-xl font-extrabold bg-gradient-to-r from-emerald-400 to-green-600 bg-clip-text text-transparent">
              Edit Student
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-neutral-800/60 hover:bg-red-500/30 
                       text-neutral-400 hover:text-white transition"
          >
            <FaTimes />
          </button>
        </div>

        {/* Body */}
        <form
          onSubmit={handleSubmit}
          className="px-4 sm:px-6 py-4 sm:py-6 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 
                     flex-1 overflow-y-auto"
        >
          {/* First Name */}
          <FormField
            label="First Name"
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
            required
          />

          {/* Middle Name */}
          <FormField
            label="Middle Name"
            name="middle_name"
            value={formData.middle_name}
            onChange={handleChange}
          />

          {/* Last Name */}
          <FormField
            label="Last Name"
            name="last_name"
            value={formData.last_name}
            onChange={handleChange}
            required
          />

          {/* Course */}
          <div className="flex flex-col">
            <label className="mb-1 text-xs text-neutral-400 uppercase tracking-wide">
              Course
            </label>
            <select
              name="course"
              value={formData.course}
              onChange={handleChange}
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg 
                         bg-neutral-800 border border-white/10 text-white 
                         focus:ring-2 focus:ring-emerald-500 focus:border-transparent 
                         focus:bg-gradient-to-r focus:from-neutral-800 focus:to-neutral-900 
                         text-sm transition"
              required
            >
              <option value="">Select a course</option>
              <option value="BSINFOTECH">BSINFOTECH</option>
              <option value="BSCS">BSCS</option>
            </select>
          </div>
        </form>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-white/10 bg-neutral-900/80 
                        flex justify-end gap-2 sm:gap-3 sticky bottom-0 z-10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 sm:px-5 py-2 rounded-lg 
                      bg-gradient-to-r from-neutral-700 to-neutral-800 
                      text-neutral-300 text-sm font-medium
                      hover:from-neutral-600 hover:to-neutral-700 hover:text-white
                      hover:shadow-md hover:shadow-neutral-500/20
                      transform hover:scale-105
                      transition-all duration-300 ease-out"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="px-4 sm:px-5 py-2 rounded-lg 
                      bg-gradient-to-r from-emerald-500 to-green-600 
                      text-white text-sm font-semibold shadow-md
                      hover:from-emerald-600 hover:to-green-700
                      hover:shadow-lg hover:shadow-emerald-500/30
                      transform hover:scale-105
                      transition-all duration-300 ease-out"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

/* ✅ Reusable Input Field with responsive sizing */
function FormField({ label, name, value, onChange, required = false }) {
  return (
    <div className="flex flex-col group transition-all duration-300">
      <label
        className="mb-1 sm:mb-2 text-xs font-semibold uppercase tracking-wide 
                   bg-gradient-to-r from-emerald-400 to-green-500 bg-clip-text text-transparent"
      >
        {label}
      </label>
      <input
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg 
                   bg-neutral-800/70 border border-white/10 text-white text-sm font-medium
                   placeholder-neutral-500 shadow-sm backdrop-blur-md
                   transition-all duration-300
                   group-hover:border-emerald-500/40 group-hover:shadow-emerald-500/10
                   focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/60 focus:ring-offset-1 focus:ring-offset-neutral-900
                   focus:scale-[1.01] focus:shadow-lg focus:shadow-emerald-500/20"
        placeholder={`Enter ${label}`}
      />
    </div>
  );
}

export default EditStudentModal;
