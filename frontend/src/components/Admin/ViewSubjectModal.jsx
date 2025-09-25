import { FaTimes, FaBookOpen, FaGraduationCap, FaLayerGroup } from "react-icons/fa";

export default function ViewSubjectModal({ isOpen, onClose, subject }) {
  if (!isOpen || !subject) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50">
      <div className="bg-neutral-900 text-white rounded-2xl shadow-2xl w-full max-w-lg border border-neutral-700 relative animate-fadeIn">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-neutral-700">
          <h3 className="text-xl font-bold text-green-400 flex items-center gap-2">
            <FaBookOpen className="text-green-400" /> Subject Details
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition"
          >
            <FaTimes />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Code & Course */}
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-neutral-800/50 p-4 rounded-lg border border-neutral-700">
              <p className="text-xs uppercase text-neutral-400">Code</p>
              <p className="mt-1 font-semibold text-lg">{subject.subject_code}</p>
            </div>
            <div className="bg-neutral-800/50 p-4 rounded-lg border border-neutral-700">
              <p className="text-xs uppercase text-neutral-400">Course</p>
              <p className="mt-1 font-semibold text-lg">{subject.course}</p>
            </div>
          </div>

          {/* Title */}
          <div className="bg-neutral-800/50 p-4 rounded-lg border border-neutral-700">
            <p className="text-xs uppercase text-neutral-400">Title</p>
            <p className="mt-1 font-semibold text-lg">{subject.subject_title}</p>
          </div>

          {/* Year & Semester */}
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-neutral-800/50 p-4 rounded-lg border border-neutral-700">
              <p className="text-xs uppercase text-neutral-400">Year Level</p>
              <p className="mt-1 font-semibold text-lg flex items-center gap-2">
                <FaGraduationCap className="text-green-400" />
                {subject.year_level || "—"}
              </p>
            </div>
            <div className="bg-neutral-800/50 p-4 rounded-lg border border-neutral-700">
              <p className="text-xs uppercase text-neutral-400">Semester</p>
              <p className="mt-1 font-semibold text-lg flex items-center gap-2">
                <FaLayerGroup className="text-green-400" />
                {subject.semester || "—"}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition shadow-md"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
