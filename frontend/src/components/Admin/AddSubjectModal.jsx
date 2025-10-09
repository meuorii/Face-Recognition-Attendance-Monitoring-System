import { useState } from "react";
import { FaTimes } from "react-icons/fa";
import axios from "axios";
import { toast } from "react-toastify";
import { FaCheckCircle } from "react-icons/fa";

const COURSES = ["BSCS", "BSINFOTECH"];
const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
const SEMESTERS = ["1st Sem", "2nd Sem", "Summer"];

export default function AddSubjectModal({ isOpen, onClose, onSubjectAdded }) {
  const [formData, setFormData] = useState({
    subject_code: "",
    subject_title: "",
    course: "",
    year_level: "",
    semester: "",
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.subject_code || !formData.subject_title || !formData.course || !formData.year_level || !formData.semester) {
      toast.warning("Please fill in all fields.");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post("http://localhost:5000/api/admin/subjects", formData);
      toast.success("✅ Subject created successfully");
      onSubjectAdded(res.data); // update parent list
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "❌ Failed to create subject");
    } finally {
      setLoading(false);
    }
  };

  return (
   <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
  <div className="relative w-full max-w-lg bg-gradient-to-br from-neutral-900/95 via-neutral-950/95 to-black/95 
                  rounded-2xl border border-neutral-700/80 shadow-2xl shadow-emerald-500/10 
                  p-6 animate-fadeIn scale-100 sm:scale-100 md:scale-105 transition-transform duration-300">

    {/* ✖ Close Button */}
    <button
      onClick={onClose}
      className="absolute top-3 right-3 text-neutral-400 hover:text-white hover:scale-110 transition-transform"
    >
      <FaTimes size={18} />
    </button>

    {/* 🌿 Header */}
    <h2 className="text-3xl font-extrabold bg-gradient-to-r from-emerald-400 via-green-500 to-emerald-600 
                  bg-clip-text text-transparent text-center tracking-wide drop-shadow-lg mb-6">
      Add New Subject
    </h2>

    {/* 📋 Form */}
    <form onSubmit={handleSubmit} className="space-y-4 text-sm">
      {/* Subject Code */}
      <div className="group">
        <label className="block text-neutral-400 font-medium mb-1 transition-colors group-hover:text-emerald-400">
          Subject Code
        </label>
        <input
          type="text"
          name="subject_code"
          value={formData.subject_code}
          onChange={handleChange}
          placeholder="Ex: CS101"
          required
          className="w-full px-4 py-2.5 rounded-lg 
                    bg-gradient-to-br from-neutral-800/90 to-neutral-900/90
                    border border-neutral-700 text-white placeholder-neutral-500 
                    focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 
                    hover:border-emerald-400/60 hover:shadow-[0_0_10px_rgba(16,185,129,0.2)]
                    transition-all duration-300"
        />
      </div>

      {/* Subject Title */}
      <div className="group">
        <label className="block text-neutral-400 font-medium mb-1 transition-colors group-hover:text-emerald-400">
          Subject Title
        </label>
        <input
          type="text"
          name="subject_title"
          value={formData.subject_title}
          onChange={handleChange}
          placeholder="Ex: Introduction to Programming"
          required
          className="w-full px-4 py-2.5 rounded-lg 
                    bg-gradient-to-br from-neutral-800/90 to-neutral-900/90
                    border border-neutral-700 text-white placeholder-neutral-500 
                    focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 
                    hover:border-emerald-400/60 hover:shadow-[0_0_10px_rgba(16,185,129,0.2)]
                    transition-all duration-300"
        />
      </div>

      {/* Course & Year */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="group">
          <label className="block text-neutral-400 font-medium mb-1 transition-colors group-hover:text-emerald-400">
            Course
          </label>
          <select
            name="course"
            value={formData.course}
            onChange={handleChange}
            required
            className="w-full px-4 py-2.5 rounded-lg 
                      bg-gradient-to-br from-neutral-800/90 to-neutral-900/90
                      border border-neutral-700 text-white 
                      focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500
                      hover:border-emerald-400/60 hover:shadow-[0_0_10px_rgba(16,185,129,0.2)]
                      transition-all duration-300"
          >
            <option value="">Select Course</option>
            {COURSES.map((c) => (
              <option key={c} value={c} className="bg-neutral-900">
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="group">
          <label className="block text-neutral-400 font-medium mb-1 transition-colors group-hover:text-emerald-400">
            Year Level
          </label>
          <select
            name="year_level"
            value={formData.year_level}
            onChange={handleChange}
            required
            className="w-full px-4 py-2.5 rounded-lg 
                      bg-gradient-to-br from-neutral-800/90 to-neutral-900/90
                      border border-neutral-700 text-white 
                      focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500
                      hover:border-emerald-400/60 hover:shadow-[0_0_10px_rgba(16,185,129,0.2)]
                      transition-all duration-300"
          >
            <option value="">Select Year</option>
            {YEARS.map((y) => (
              <option key={y} value={y} className="bg-neutral-900">
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Semester */}
      <div className="group">
        <label className="block text-neutral-400 font-medium mb-1 transition-colors group-hover:text-emerald-400">
          Semester
        </label>
        <select
          name="semester"
          value={formData.semester}
          onChange={handleChange}
          required
          className="w-full px-4 py-2.5 rounded-lg 
                    bg-gradient-to-br from-neutral-800/90 to-neutral-900/90
                    border border-neutral-700 text-white 
                    focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500
                    hover:border-emerald-400/60 hover:shadow-[0_0_10px_rgba(16,185,129,0.2)]
                    transition-all duration-300"
        >
          <option value="">Select Semester</option>
          {SEMESTERS.map((s) => (
            <option key={s} value={s} className="bg-neutral-900">
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* 🌈 Submit Button */}
      <div className="flex justify-center pt-4">
        <button
          type="submit"
          disabled={loading}
          className="relative inline-flex items-center justify-center px-8 py-2.5 
                    font-semibold rounded-lg text-white text-sm overflow-hidden
                    bg-gradient-to-r from-emerald-500 via-green-600 to-emerald-700
                    shadow-lg shadow-emerald-500/30
                    transition-all duration-500 ease-out
                    hover:scale-105 hover:shadow-[0_0_20px_rgba(52,211,153,0.5)]
                    hover:from-green-500 hover:via-emerald-600 hover:to-green-700
                    active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed
                    group"
        >
          {/* ✨ Animated overlay glow */}
          <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <span className="absolute inset-0 bg-gradient-to-r from-emerald-400/30 via-green-300/20 to-transparent blur-lg animate-pulse"></span>
          </span>

          {/* 🌿 Button content */}
          {loading ? (
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              <span className="tracking-wide">Saving...</span>
            </div>
          ) : (
            <span className="relative z-10 flex items-center gap-2 tracking-wide">
              <FaCheckCircle className="text-white/90 text-base transition-transform duration-300 group-hover:rotate-12" />
              Save Subject
            </span>
          )}
        </button>
      </div>
    </form>
  </div>
</div>
  );
}
