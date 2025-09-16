import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";

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
      toast.success("Student updated successfully!");
      onStudentUpdated({ ...student, ...formData }); // update parent state
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update student.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-neutral-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-neutral-700 p-8 relative animate-fadeIn">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-white transition"
        >
          ✕
        </button>

        {/* Header */}
        <h2 className="text-2xl font-bold text-green-400 mb-6 text-center tracking-wide">
          Edit Student Information
        </h2>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {/* First Name */}
          <div className="flex flex-col">
            <label className="mb-1 text-sm text-neutral-400">First Name</label>
            <input
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white focus:ring-2 focus:ring-green-500 focus:outline-none text-sm"
              required
            />
          </div>

          {/* Middle Name */}
          <div className="flex flex-col">
            <label className="mb-1 text-sm text-neutral-400">Middle Name</label>
            <input
              type="text"
              name="middle_name"
              value={formData.middle_name}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white focus:ring-2 focus:ring-green-500 focus:outline-none text-sm"
            />
          </div>

          {/* Last Name */}
          <div className="flex flex-col">
            <label className="mb-1 text-sm text-neutral-400">Last Name</label>
            <input
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white focus:ring-2 focus:ring-green-500 focus:outline-none text-sm"
              required
            />
          </div>

          {/* Course */}
          <div className="flex flex-col">
            <label className="mb-1 text-sm text-neutral-400">Course</label>
            <select
              name="course"
              value={formData.course}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white focus:ring-2 focus:ring-green-500 focus:outline-none text-sm"
              required
            >
              <option value="">Select a course</option>
              <option value="BSINFOTECH">BSINFOTECH</option>
              <option value="BSCS">BSCS</option>
            </select>
          </div>

          {/* Buttons */}
          <div className="md:col-span-2 flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-lg bg-neutral-700 text-neutral-300 hover:bg-neutral-600 transition text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-sm font-semibold shadow-md transition"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditStudentModal;
