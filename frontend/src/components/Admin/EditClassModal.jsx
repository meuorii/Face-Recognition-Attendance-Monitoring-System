import { createPortal } from "react-dom";
import { FaEdit, FaCalendarAlt, FaTimes } from "react-icons/fa";

const EditClassModal = ({ isOpen, editClass, setEditClass, onClose, onSave }) => {
  if (!isOpen || !editClass) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-gradient-to-br from-neutral-900/80 to-neutral-950/90 
                      w-full max-w-5xl rounded-2xl shadow-2xl border border-white/10 
                      p-8 relative animate-scaleIn backdrop-blur-xl">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-3">
          <h3 className="text-2xl font-extrabold flex items-center gap-2">
            <FaEdit className="text-yellow-400" />
            <span className="bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">
                Edit Class
            </span>
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-neutral-800/60 hover:bg-rose-600/60 
                       text-neutral-400 hover:text-white transition"
          >
            <FaTimes />
          </button>
        </div>

        {/* Section + Semester */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
          <FormField
            label="Section"
            type="text"
            value={editClass.section || ""}
            onChange={(val) => setEditClass({ ...editClass, section: val })}
          />
          <FormField
            label="Semester"
            type="text"
            value={editClass.semester || ""}
            onChange={(val) => setEditClass({ ...editClass, semester: val })}
          />
        </div>

        {/* Schedule Blocks */}
        <div>
          <h4 className="text-sm text-neutral-300 font-semibold mb-3 flex items-center gap-2">
            <FaCalendarAlt className="text-yellow-400" /> Schedule Blocks
          </h4>

          {(Array.isArray(editClass.schedule_blocks) && editClass.schedule_blocks.length > 0
            ? editClass.schedule_blocks
            : [{ days: ["", "", ""], start: "", end: "" }]
          ).map((block, idx) => (
            <div
              key={idx}
              className="mb-4 p-4 border border-neutral-700 rounded-xl bg-neutral-800/50 shadow-sm"
            >
              <div className="grid grid-cols-5 gap-3 items-end">
                {["Day 1", "Day 2", "Day 3"].map((label, i) => (
                  <div key={i}>
                    <label className="block text-neutral-400 text-xs mb-1">{label}</label>
                    <select
                      value={block.days?.[i] || ""}
                      onChange={(e) => {
                        const newBlocks = [...(editClass.schedule_blocks || [])];
                        const newDays = [...(block.days || ["", "", ""])];
                        newDays[i] = e.target.value;
                        newBlocks[idx] = { ...block, days: newDays };
                        setEditClass({ ...editClass, schedule_blocks: newBlocks });
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-neutral-700 border border-neutral-600 
                                 text-white focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition"
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
                <FormField
                  label="Start Time"
                  type="time"
                  value={block.start || ""}
                  onChange={(val) => {
                    const newBlocks = [...(editClass.schedule_blocks || [])];
                    newBlocks[idx] = { ...block, start: val };
                    setEditClass({ ...editClass, schedule_blocks: newBlocks });
                  }}
                />

                {/* End Time */}
                <FormField
                  label="End Time"
                  type="time"
                  value={block.end || ""}
                  onChange={(val) => {
                    const newBlocks = [...(editClass.schedule_blocks || [])];
                    newBlocks[idx] = { ...block, end: val };
                    setEditClass({ ...editClass, schedule_blocks: newBlocks });
                  }}
                />
              </div>
            </div>
          ))}

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
            className="flex items-center gap-2 px-4 py-2 mt-2 
                       bg-gradient-to-r from-emerald-500 to-green-600 
                       hover:from-emerald-600 hover:to-green-700
                       rounded-lg text-sm text-white font-semibold shadow transition"
          >
            <FaCalendarAlt /> Add Schedule Block
          </button>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-8 border-t border-neutral-700 pt-4">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-neutral-700 hover:bg-neutral-600 rounded-lg text-sm text-white transition"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="px-5 py-2 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 
                       rounded-lg text-sm text-white font-semibold shadow transition"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

/* ✅ Reusable FormField for inputs */
function FormField({ label, type = "text", value, onChange }) {
  return (
    <div>
      <label className="block text-neutral-400 text-sm mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2 rounded-lg bg-neutral-800 border border-neutral-700 
                   focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 text-white transition"
      />
    </div>
  );
}

export default EditClassModal;
