import { useState } from "react";
import { FaTimes } from "react-icons/fa";
import axios from "axios";
import { toast } from "react-toastify";

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
      <div className="bg-neutral-900 w-full max-w-lg rounded-2xl shadow-2xl border border-neutral-700 p-6 relative animate-fadeIn">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-neutral-400 hover:text-white transition"
        >
          <FaTimes />
        </button>

        {/* Header */}
        <h2 className="text-2xl font-bold text-green-400 mb-6 text-center tracking-wide">
          Add New Subject
        </h2>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-neutral-400 mb-1">Subject Code</label>
            <input
              type="text"
              name="subject_code"
              value={formData.subject_code}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white focus:ring-2 focus:ring-green-500 text-sm"
              placeholder="Ex: CS101"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-neutral-400 mb-1">Subject Title</label>
            <input
              type="text"
              name="subject_title"
              value={formData.subject_title}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white focus:ring-2 focus:ring-green-500 text-sm"
              placeholder="Ex: Introduction to Programming"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-neutral-400 mb-1">Course</label>
              <select
                name="course"
                value={formData.course}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white focus:ring-2 focus:ring-green-500 text-sm"
                required
              >
                <option value="">Select Course</option>
                {COURSES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-neutral-400 mb-1">Year Level</label>
              <select
                name="year_level"
                value={formData.year_level}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white focus:ring-2 focus:ring-green-500 text-sm"
                required
              >
                <option value="">Select Year</option>
                {YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm text-neutral-400 mb-1">Semester</label>
            <select
              name="semester"
              value={formData.semester}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white focus:ring-2 focus:ring-green-500 text-sm"
              required
            >
              <option value="">Select Semester</option>
              {SEMESTERS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-center pt-4">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-semibold shadow-md transition disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Subject"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
