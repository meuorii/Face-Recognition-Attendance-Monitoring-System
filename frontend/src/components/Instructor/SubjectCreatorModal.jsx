const SubjectCreatorModal = ({
  show,
  onClose,
  onSubmit,
  subjectData,
  onChange,
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-gray-900 p-8 rounded-2xl w-full max-w-2xl shadow-xl space-y-6">
        <h2 className="text-2xl font-semibold text-green-400 text-center">
          Create Subject
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input
            type="text"
            name="subject_code"
            value={subjectData.subject_code}
            onChange={(e) =>
              onChange("field", "subject_code", e.target.value)
            }
            placeholder="Subject Code (e.g., CS101)"
            className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400"
          />

          <input
            type="text"
            name="subject_title"
            value={subjectData.subject_title}
            onChange={(e) =>
              onChange("field", "subject_title", e.target.value)
            }
            placeholder="Subject Title (e.g., Intro to Programming)"
            className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400"
          />

          <input
            type="text"
            name="course"
            value={subjectData.course}
            onChange={(e) => onChange("field", "course", e.target.value)}
            placeholder="Course (e.g., BSINFOTECH)"
            className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400"
          />

          <input
            type="text"
            name="section"
            value={subjectData.section}
            onChange={(e) => onChange("field", "section", e.target.value)}
            placeholder="Year & Section (e.g., 3C)"
            className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400"
          />
        </div>

        {/* Schedule Blocks */}
        <div>
          <label className="text-white font-semibold block mb-2">
            Schedule Blocks
          </label>
          {subjectData.schedule_blocks.map((block, index) => (
            <div key={index} className="flex flex-col sm:flex-row gap-2 mb-2">
              <select
                value={block.day}
                onChange={(e) => onChange("block", index, "day", e.target.value)}
                className="bg-gray-800 text-white px-3 py-2 rounded w-full sm:w-1/3"
              >
                <option value="">Select Day</option>
                <option>Mon</option>
                <option>Tue</option>
                <option>Wed</option>
                <option>Thu</option>
                <option>Fri</option>
              </select>
              <input
                type="time"
                value={block.start}
                onChange={(e) =>
                  onChange("block", index, "start", e.target.value)
                }
                className="bg-gray-800 text-white px-3 py-2 rounded w-full sm:w-1/3"
              />
              <input
                type="time"
                value={block.end}
                onChange={(e) =>
                  onChange("block", index, "end", e.target.value)
                }
                className="bg-gray-800 text-white px-3 py-2 rounded w-full sm:w-1/3"
              />
            </div>
          ))}
          <button
            onClick={() => onChange("addBlock")}
            type="button"
            className="text-green-400 text-sm mt-1 hover:underline"
          >
            + Add Schedule Block
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="bg-gray-600 text-white px-5 py-2 rounded-lg hover:bg-gray-500 transition"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            className="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 transition font-semibold"
          >
            Save Subject
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubjectCreatorModal;
