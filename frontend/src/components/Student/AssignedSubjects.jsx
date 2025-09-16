import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSubjectsByStudent } from "../../services/api";
import { toast } from "react-toastify";
import axios from "axios";
import {
  FaBookOpen,
  FaCalendarAlt,
  FaGraduationCap,
  FaFileUpload,
  FaUserTie,
} from "react-icons/fa";

const AssignedSubjects = () => {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // ✅ Load subjects on mount
  useEffect(() => {
    fetchAssignedSubjects();
  }, []);

  const fetchAssignedSubjects = async () => {
    const stored = localStorage.getItem("userData");
    const token = localStorage.getItem("token");

    if (!stored || !token) {
      toast.error("Student not logged in.");
      navigate("/student/login");
      return;
    }

    let student = null;
    try {
      student = JSON.parse(stored);
    } catch {
      toast.error("Invalid session data. Please log in again.");
      localStorage.removeItem("userData");
      navigate("/student/login");
      return;
    }

    const studentId = student?.student_id;
    if (!studentId) {
      toast.error("Invalid student data.");
      navigate("/student/login");
      return;
    }

    try {
      const data = await getSubjectsByStudent(studentId, token);

      const normalized = (data || []).map((s) => ({
        ...s,
        schedule_blocks: Array.isArray(s.schedule_blocks)
          ? dedupeSchedules(s.schedule_blocks)
          : [],
        instructor_first_name: s.instructor_first_name || "N/A",
        instructor_last_name: s.instructor_last_name || "N/A",
      }));

      setSubjects(normalized);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load assigned subjects.");
    }
  };

  // ✅ Fix deduplication (use correct keys: days/start/end)
  const dedupeSchedules = (blocks) => {
    const seen = new Set();
    return blocks.filter((b) => {
      const key = `${JSON.stringify(b.days)}-${b.start}-${b.end}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  // ✅ Handle COR upload
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
      const res = await axios.post(
        "http://localhost:5000/api/student/upload-cor",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const { assigned_subjects = [], section } = res.data;
      toast.success("✅ COR uploaded successfully");

      if (assigned_subjects.length > 0) {
        setSubjects((prev) => {
          const existing = new Map(prev.map((s) => [s.subject_code, s]));

          assigned_subjects.forEach((s) => {
            if (existing.has(s.subject_code)) {
              const old = existing.get(s.subject_code);
              existing.set(s.subject_code, {
                ...old,
                ...s,
                section: s.section || old.section || section,
                instructor_first_name:
                  s.instructor_first_name || old.instructor_first_name || "N/A",
                instructor_last_name:
                  s.instructor_last_name || old.instructor_last_name || "N/A",
                schedule_blocks: dedupeSchedules([
                  ...(old.schedule_blocks || []),
                  ...(s.schedule_blocks || []),
                ]),
              });
            } else {
              existing.set(s.subject_code, {
                ...s,
                section: s.section || section,
                instructor_first_name: s.instructor_first_name || "N/A",
                instructor_last_name: s.instructor_last_name || "N/A",
                schedule_blocks: dedupeSchedules(s.schedule_blocks || []),
              });
            }
          });

          return Array.from(existing.values());
        });
      } else {
        await fetchAssignedSubjects();
      }

      setIsModalOpen(false);
      setFile(null);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "❌ Failed to upload COR");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-neutral-900 p-8 rounded-2xl shadow-lg border border-neutral-700 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-white text-3xl font-bold tracking-tight flex items-center gap-2">
          Assigned Subjects
        </h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg text-sm font-semibold shadow-md transition"
        >
          <FaFileUpload className="inline mr-2" />
          Upload COR
        </button>
      </div>

      {/* Subjects List */}
      {subjects.length > 0 ? (
        <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {subjects.map((s, idx) => (
            <div
              key={idx}
              className="bg-neutral-800 rounded-xl p-6 border border-neutral-700 hover:border-green-400 hover:shadow-green-500/20 shadow-md transition transform hover:-translate-y-1"
            >
              <h3 className="text-white text-lg font-semibold mb-3">
                {s.subject_code} - {s.subject_title}
              </h3>

              <ul className="text-sm text-neutral-300 space-y-1 mb-3">
                {Array.isArray(s.schedule_blocks) &&
                s.schedule_blocks.length > 0 ? (
                  s.schedule_blocks.map((block, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <FaCalendarAlt className="text-green-400" />
                      <span className="font-medium text-green-400">
                        {Array.isArray(block.days)
                          ? block.days.join(", ")
                          : block.days}
                      </span>
                      {block.start && block.end && (
                        <span>| {block.start} - {block.end}</span>
                      )}
                    </li>
                  ))
                ) : (
                  <li className="italic text-gray-500">No schedule info</li>
                )}
              </ul>

              <div className="text-sm text-neutral-400 space-y-1">
                <p className="flex items-center gap-2">
                  <FaGraduationCap className="text-green-400" />
                  <span className="font-medium text-white">{s.course}</span> |{" "}
                  <span className="font-medium text-white">{s.section}</span>
                </p>
                <p>
                  📅 {s.semester} | {s.year_level}
                </p>
                <p className="flex items-center gap-2">
                  <FaUserTie className="text-green-400" />
                  <span className="font-medium text-white">
                    {s.instructor_first_name} {s.instructor_last_name}
                  </span>
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-neutral-400">
          <FaBookOpen className="mx-auto mb-4 text-5xl text-green-500" />
          <p className="text-lg">No subjects assigned yet.</p>
          <p className="text-sm">Upload your COR to auto-assign subjects.</p>
        </div>
      )}

      {/* Upload COR Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-neutral-900 w-full max-w-md rounded-2xl shadow-2xl border border-neutral-700 p-6 relative animate-fadeIn">
            <h3 className="text-xl font-bold text-green-400 mb-6 text-center flex items-center justify-center gap-2">
              <FaFileUpload /> Upload COR
            </h3>

            <label className="w-full flex flex-col items-center justify-center px-4 py-6 border-2 border-dashed border-neutral-600 rounded-lg cursor-pointer hover:border-green-500 transition">
              <input
                type="file"
                accept=".pdf,image/*"
                onChange={(e) => setFile(e.target.files[0])}
                className="hidden"
              />
              <FaFileUpload className="text-4xl text-green-400 mb-2" />
              <p className="text-neutral-300 text-sm">
                {file ? file.name : "Drag & drop or click to upload"}
              </p>
            </label>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setIsModalOpen(false)}
                disabled={uploading}
                className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 rounded-lg text-sm text-white disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-lg text-sm text-white font-semibold shadow-md disabled:opacity-50"
              >
                {uploading ? "Uploading..." : "Upload"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignedSubjects;
