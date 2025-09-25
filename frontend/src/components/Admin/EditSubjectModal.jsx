import React, { useState, useEffect } from "react";
import { FaTimes, FaSave, FaBook, FaLayerGroup, FaGraduationCap } from "react-icons/fa";

export default function EditSubjectModal({ isOpen, onClose, subject, onSave }) {
  const [form, setForm] = useState({
    subject_code: "",
    subject_title: "",
    course: "",
    year_level: "",
    semester: "",
  });

  useEffect(() => {
    if (subject) {
      setForm({
        subject_code: subject.subject_code || "",
        subject_title: subject.subject_title || "",
        course: subject.course || "",
        year_level: subject.year_level || "",
        semester: subject.semester || "",
      });
    }
  }, [subject]);

  if (!isOpen || !subject) return null;

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form); // 🔹 Pass updated subject back
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50">
      <div className="bg-neutral-900 text-white rounded-2xl shadow-2xl w-full max-w-2xl border border-neutral-700 animate-fadeIn">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 bg-neutral-800 border-b border-neutral-700">
          <h3 className="text-lg md:text-xl font-bold flex items-center gap-2 text-green-400">
            <FaBook /> Edit Subject
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-black/20 transition"
          >
            <FaTimes />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* General Info */}
          <div className="bg-neutral-800/60 rounded-xl p-5 border border-neutral-700 space-y-4">
            <h4 className="text-green-400 font-semibold mb-2 flex items-center gap-2">
              <FaLayerGroup /> General Info
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs uppercase text-neutral-400 mb-1 block">
                  Subject Code
                </label>
                <input
                  type="text"
                  value={form.subject_code}
                  onChange={(e) => handleChange("subject_code", e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                />
              </div>
              <div>
                <label className="text-xs uppercase text-neutral-400 mb-1 block">
                  Subject Title
                </label>
                <input
                  type="text"
                  value={form.subject_title}
                  onChange={(e) => handleChange("subject_title", e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                />
              </div>
            </div>
          </div>

          {/* Classification */}
          <div className="bg-neutral-800/60 rounded-xl p-5 border border-neutral-700 space-y-4">
            <h4 className="text-green-400 font-semibold mb-2 flex items-center gap-2">
              <FaGraduationCap /> Classification
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs uppercase text-neutral-400 mb-1 block">
                  Course
                </label>
                <select
                  value={form.course}
                  onChange={(e) => handleChange("course", e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                >
                  <option value="">Select Course</option>
                  <option value="BSCS">BSCS</option>
                  <option value="BSINFOTECH">BSINFOTECH</option>
                </select>
              </div>
              <div>
                <label className="text-xs uppercase text-neutral-400 mb-1 block">
                  Year Level
                </label>
                <select
                  value={form.year_level}
                  onChange={(e) => handleChange("year_level", e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                >
                  <option value="">Select Year</option>
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs uppercase text-neutral-400 mb-1 block">
                Semester
              </label>
              <select
                value={form.semester}
                onChange={(e) => handleChange("semester", e.target.value)}
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition"
              >
                <option value="">Select Semester</option>
                <option value="1st Sem">1st Sem</option>
                <option value="2nd Sem">2nd Sem</option>
                <option value="Summer">Summer</option>
              </select>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t border-neutral-700">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-semibold shadow-lg shadow-green-600/20 hover:shadow-green-500/40 transition"
            >
              <FaSave /> Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
