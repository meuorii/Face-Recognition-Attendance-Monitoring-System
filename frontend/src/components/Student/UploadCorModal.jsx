// UploadCorModal.jsx
import { createPortal } from "react-dom";
import { useState } from "react";
import axios from "axios";
import { FaFileUpload, FaFilePdf } from "react-icons/fa";
import { toast } from "react-toastify";

const UploadCorModal = ({ isOpen, onClose, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  if (!isOpen) return null;

  const handleUpload = async () => {
    if (!file) {
      toast.warning("Please select a PDF or image file.");
      return;
    }

    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("cor_file", file);

    try {
      setUploading(true);
      await axios.post("http://localhost:5000/api/student/upload-cor", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("✅ COR uploaded successfully");
      onClose();
      onSuccess?.();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "❌ Failed to upload COR");
    } finally {
      setUploading(false);
      setFile(null);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div
        className="w-full max-w-md rounded-2xl shadow-2xl border border-emerald-500/20 
                   p-6 relative animate-fadeIn bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900"
      >
       <h3
            className="text-2xl font-extrabold mb-8 text-center flex items-center justify-center gap-3 
                        text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-green-500 to-emerald-600
                        drop-shadow-md tracking-wide relative"
            >
            {/* Icon container */}
            <span className="flex items-center justify-center w-10 h-10 rounded-full 
                            bg-gradient-to-br from-emerald-500/20 to-green-600/20 
                            border border-emerald-400/30 text-emerald-400 
                            animate-pulse-slow shadow-md">
                <FaFilePdf className="text-lg" />
            </span>
            
            {/* Title */}
            <span className="transition-all duration-300 group-hover:scale-105">
                Upload COR
            </span>
            </h3>

        <label
            className="group w-full flex flex-col items-center justify-center px-6 py-10 
                        border-2 border-dashed rounded-xl cursor-pointer 
                        bg-white/5 border-white/20
                        transition-all duration-300 ease-in-out
                        hover:border-emerald-400 hover:bg-emerald-400/5 
                        hover:shadow-lg hover:shadow-emerald-500/20"
            >
            <input
                type="file"
                accept=".pdf,image/*"
                onChange={(e) => setFile(e.target.files[0])}
                className="hidden"
            />

            {/* Upload Icon */}
            <div className="flex items-center justify-center w-16 h-16 rounded-full 
                            bg-gradient-to-r from-emerald-500/20 to-green-600/20 
                            border border-emerald-400/30
                            text-emerald-400 mb-3
                            transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                <FaFileUpload className="text-3xl" />
            </div>

            {/* Label Text */}
            <p className="text-gray-300 text-sm font-medium transition-colors duration-300 group-hover:text-emerald-400">
                {file ? file.name : "Drag & drop or click to upload"}
            </p>

            {/* Subtle helper text */}
            {!file && (
                <p className="text-xs text-gray-500 mt-1 group-hover:text-emerald-300 transition">
                Supports PDF files
                </p>
            )}
            </label>


        <div className="flex justify-end gap-3 mt-6">
            {/* Cancel Button */}
            <button
                onClick={onClose}
                disabled={uploading}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white
                        bg-white/10 border border-white/20
                        backdrop-blur-sm shadow-md
                        transition-all duration-300
                        hover:bg-white/20 hover:scale-105 hover:shadow-lg
                        disabled:opacity-50"
            >
                Cancel
            </button>

            {/* Upload Button */}
            <button
                onClick={handleUpload}
                disabled={uploading}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white
                        bg-gradient-to-r from-green-500/80 to-emerald-600/80
                        border border-emerald-400/30
                        shadow-md backdrop-blur-sm
                        transition-all duration-300
                        hover:from-green-500 hover:to-emerald-600
                        hover:scale-105 hover:shadow-emerald-500/30
                        disabled:opacity-50"
            >
                {uploading ? "Uploading..." : "Upload"}
            </button>
            </div>
      </div>
    </div>,
    document.body // 👈 renders at root for full coverage
  );
};

export default UploadCorModal;
