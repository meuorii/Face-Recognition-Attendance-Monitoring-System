import { createPortal } from "react-dom";
import { FaTrash, FaTimes } from "react-icons/fa";

const DeleteClassModal = ({ isOpen, deleteClass, onClose, onConfirm }) => {
  if (!isOpen || !deleteClass) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md animate-fadeIn">
      <div className="bg-gradient-to-br from-neutral-900/90 to-neutral-950/90 
                      w-full max-w-md rounded-2xl shadow-2xl border border-white/10 
                      p-8 relative animate-scaleIn">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-3">
          <h3 className="text-xl font-extrabold flex items-center gap-2 
                         bg-gradient-to-r from-red-400 to-rose-600 bg-clip-text text-transparent">
            <FaTrash className="text-red-500" /> Delete Class
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-neutral-800/60 hover:bg-rose-600/60 
                       text-neutral-400 hover:text-white transition"
          >
            <FaTimes />
          </button>
        </div>

        {/* Body */}
        <div className="text-center">
          <p className="text-neutral-300 mb-6 leading-relaxed">
            Are you sure you want to permanently delete
            <br />
            <span className="font-bold text-white">{deleteClass.subject_code}</span>{" "}
            –{" "}
            <span className="text-red-400 font-semibold">
              {deleteClass.subject_title}
            </span>
            ?
          </p>
          <p className="text-sm text-neutral-500 mb-8">
            ⚠ This action cannot be undone.
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-center gap-4">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg 
                       bg-neutral-700 hover:bg-neutral-600 
                       text-sm text-white font-medium transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2 rounded-lg 
                       bg-gradient-to-r from-red-500 to-rose-600 
                       hover:from-red-600 hover:to-rose-700
                       text-sm text-white font-semibold shadow-md
                       transform hover:scale-105 transition"
          >
            Delete
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default DeleteClassModal;
