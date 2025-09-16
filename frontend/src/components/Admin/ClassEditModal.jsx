import { FaEdit, FaCalendarAlt } from "react-icons/fa";

const ClassEditModal = ({ editClass, setEditClass, handleEdit }) => {
  if (!editClass) return null; // ✅ don't render if no class selected

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-neutral-900 w-full max-w-5xl rounded-2xl shadow-2xl border border-neutral-700 p-8 relative">
        {/* Header */}
        <h3 className="text-2xl font-bold text-yellow-400 mb-6 flex items-center gap-2 border-b border-neutral-700 pb-3">
          <FaEdit className="text-yellow-400" /> Edit Class
        </h3>

        {/* Section + Semester */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-neutral-400 text-sm mb-1">Section</label>
            <input
              type="text"
              value={editClass.section || ""}
              onChange={(e) =>
                setEditClass({ ...editClass, section: e.target.value })
              }
              className="w-full px-4 py-2 rounded-lg bg-neutral-800 border border-neutral-700 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 text-white transition"
            />
          </div>

          <div>
            <label className="block text-neutral-400 text-sm mb-1">Semester</label>
            <input
              type="text"
              value={editClass.semester || ""}
              onChange={(e) =>
                setEditClass({ ...editClass, semester: e.target.value })
              }
              className="w-full px-4 py-2 rounded-lg bg-neutral-800 border border-neutral-700 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 text-white transition"
            />
          </div>
        </div>

        {/* Schedule Blocks */}
        <div>
          <h4 className="text-sm text-neutral-300 font-semibold mb-3 flex items-center gap-2">
            <FaCalendarAlt className="text-yellow-400" /> Schedule Blocks
          </h4>

          {(Array.isArray(editClass.schedule_blocks) &&
          editClass.schedule_blocks.length > 0
            ? editClass.schedule_blocks
            : [{ days: ["", "", ""], start: "", end: "" }]
          ).map((block, idx) => (
            <div
              key={idx}
              className="mb-4 p-4 border border-neutral-700 rounded-xl bg-neutral-800 shadow-sm"
            >
              {/* Days + Time in one row */}
              <div className="grid grid-cols-5 gap-3 items-end">
                {["Day 1", "Day 2", "Day 3"].map((label, i) => (
                  <div key={i}>
                    <label className="block text-neutral-400 text-xs mb-1">
                      {label}
                    </label>
                    <select
                      value={block.days?.[i] || ""}
                      onChange={(e) => {
                        const newBlocks = [...(editClass.schedule_blocks || [])];
                        const newDays = [...(block.days || ["", "", ""])];
                        newDays[i] = e.target.value;
                        newBlocks[idx] = { ...block, days: newDays };
                        setEditClass({
                          ...editClass,
                          schedule_blocks: newBlocks,
                        });
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-neutral-700 border border-neutral-600 text-white focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition"
                    >
                      <option value="">Select Day</option>
                      <option value="Mon">Mon</option>
                      <option value="Tue">Tue</option>
                      <option value="Wed">Wed</option>
                      <option value="Thu">Thu</option>
                      <option value="Fri">Fri</option>
                      <option value="Sat">Sat</option>
                      <option value="Sun">Sun</option>
                    </select>
                  </div>
                ))}

                {/* Start Time */}
                <div>
                  <label className="block text-neutral-400 text-xs mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={block.start || ""}
                    onChange={(e) => {
                      const newBlocks = [...(editClass.schedule_blocks || [])];
                      newBlocks[idx] = { ...block, start: e.target.value };
                      setEditClass({ ...editClass, schedule_blocks: newBlocks });
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-neutral-700 border border-neutral-600 text-white focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition"
                  />
                </div>

                {/* End Time */}
                <div>
                  <label className="block text-neutral-400 text-xs mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={block.end || ""}
                    onChange={(e) => {
                      const newBlocks = [...(editClass.schedule_blocks || [])];
                      newBlocks[idx] = { ...block, end: e.target.value };
                      setEditClass({ ...editClass, schedule_blocks: newBlocks });
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-neutral-700 border border-neutral-600 text-white focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition"
                  />
                </div>
              </div>
            </div>
          ))}

          {/* Add Schedule Block Button */}
          <button
            onClick={() =>
              setEditClass({
                ...editClass,
                schedule_blocks: [
                  ...(editClass.schedule_blocks || []),
                  { days: ["", "", ""], start: "", end: "" },
                ],
              })
            }
            className="flex items-center gap-2 px-4 py-2 mt-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm text-white font-semibold shadow transition"
          >
            <FaCalendarAlt /> Add Schedule Block
          </button>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-8 border-t border-neutral-700 pt-4">
          <button
            onClick={() => setEditClass(null)}
            className="px-5 py-2 bg-neutral-700 hover:bg-neutral-600 rounded-lg text-sm text-white transition"
          >
            Cancel
          </button>
          <button
            onClick={handleEdit}
            className="px-5 py-2 bg-yellow-500 hover:bg-yellow-600 rounded-lg text-sm text-white font-semibold shadow"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClassEditModal;
