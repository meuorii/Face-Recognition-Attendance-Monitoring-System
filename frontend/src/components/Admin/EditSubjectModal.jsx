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
    onSave(form); // Pass updated subject back
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-gradient-to-br from-neutral-900/80 to-neutral-950/90 
                      text-white rounded-2xl shadow-2xl w-full max-w-2xl 
                      border border-white/10 relative flex flex-col animate-scaleIn">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 
                        bg-neutral-900/40 backdrop-blur-md border-b border-white/10">
          <h3 className="text-lg md:text-xl font-extrabold flex items-center gap-2">
            <FaBook className="text-emerald-400" />
            <span className="bg-gradient-to-r from-emerald-400 to-green-500 bg-clip-text text-transparent">
              Edit Subject
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

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 space-y-6 max-h-[70vh] custom-scroll"
        >
          {/* General Info */}
          <div className="bg-neutral-800/50 rounded-xl p-5 border border-white/10 space-y-4 shadow-sm">
            <h4 className="text-emerald-400 font-semibold mb-2 flex items-center gap-2">
              <FaLayerGroup /> General Info
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField
                label="Subject Code"
                value={form.subject_code}
                onChange={(e) => handleChange("subject_code", e.target.value)}
              />
              <InputField
                label="Subject Title"
                value={form.subject_title}
                onChange={(e) => handleChange("subject_title", e.target.value)}
              />
            </div>
          </div>

          {/* Classification */}
          <div className="bg-neutral-800/50 rounded-xl p-5 border border-white/10 space-y-4 shadow-sm">
            <h4 className="text-emerald-400 font-semibold mb-2 flex items-center gap-2">
              <FaGraduationCap /> Classification
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SelectField
                label="Course"
                value={form.course}
                onChange={(e) => handleChange("course", e.target.value)}
                options={["BSCS", "BSINFOTECH"]}
              />
              <SelectField
                label="Year Level"
                value={form.year_level}
                onChange={(e) => handleChange("year_level", e.target.value)}
                options={["1st Year", "2nd Year", "3rd Year", "4th Year"]}
              />
            </div>

            <SelectField
              label="Semester"
              value={form.semester}
              onChange={(e) => handleChange("semester", e.target.value)}
              options={["1st Sem", "2nd Sem", "Summer"]}
            />
          </div>

          {/* Footer */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2 rounded-lg 
                         bg-neutral-700 text-neutral-300 text-sm font-medium
                         hover:bg-neutral-600 hover:text-white
                         transition-all duration-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2 
                         rounded-lg font-semibold text-sm text-white
                         bg-gradient-to-r from-emerald-400 to-green-600
                         hover:from-emerald-500 hover:to-green-700
                         shadow-md hover:shadow-emerald-500/30
                         transform hover:scale-105 transition-all"
            >
              <FaSave /> Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ✅ Reusable Input Field */
function InputField({ label, value, onChange }) {
  return (
    <div>
      <label className="text-xs uppercase text-neutral-400 mb-1 block">{label}</label>
      <input
        type="text"
        value={value}
        onChange={onChange}
        className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-sm 
                   focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
      />
    </div>
  );
}

/* ✅ Reusable Select Field */
function SelectField({ label, value, onChange, options }) {
  return (
    <div>
      <label className="text-xs uppercase text-neutral-400 mb-1 block">{label}</label>
      <select
        value={value}
        onChange={onChange}
        className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-sm 
                   focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
      >
        <option value="">Select {label}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}
