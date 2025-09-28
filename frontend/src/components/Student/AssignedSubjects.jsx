import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSubjectsByStudent } from "../../services/api";
import { toast } from "react-toastify";
import {
  FaBookOpen,
  FaCalendarAlt,
  FaGraduationCap,
  FaFileUpload,
  FaUserTie,
} from "react-icons/fa";
import UploadCorModal from "../../components/Student/UploadCorModal";

const AssignedSubjects = () => {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  // ✅ Deduplicate schedules
  const dedupeSchedules = (blocks) => {
    const seen = new Set();
    return blocks.filter((b) => {
      const key = `${JSON.stringify(b.days)}-${b.start}-${b.end}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  return (
    <div className="bg-white/5 backdrop-blur-lg p-8 mt-12 rounded-2xl shadow-xl border border-white/10 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-600">
          Assigned Subjects
        </h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 
                     hover:from-green-600 hover:to-emerald-700 text-white 
                     rounded-lg text-sm font-semibold shadow-md 
                     transition transform hover:-translate-y-0.5"
        >
          <FaFileUpload className="inline mr-2" />
          Upload COR
        </button>
      </div>

      {/* Subjects List */}
      {subjects.length > 0 ? (
        <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((s, idx) => (
            <div
              key={idx}
              className="group relative bg-white/5 backdrop-blur-md rounded-2xl p-6 
                         border border-white/10 shadow-lg 
                         transition-all duration-300 hover:scale-[1.02] 
                         hover:shadow-emerald-500/20 hover:border-emerald-400"
            >
              {/* Glow accent on hover */}
              <div className="absolute inset-0 rounded-2xl opacity-0 
                              group-hover:opacity-100 transition duration-300 
                              bg-gradient-to-br from-emerald-500/10 to-transparent blur-xl" />

              {/* Subject Title */}
              <h3 className="text-xl font-semibold mb-4 text-white relative z-10">
                <span className="bg-gradient-to-r from-emerald-400 to-green-600 bg-clip-text text-transparent">
                  {s.subject_code}
                </span>{" "}
                – {s.subject_title}
              </h3>

              {/* Schedule */}
              <ul className="text-sm text-gray-300 space-y-2 mb-4 relative z-10">
                {Array.isArray(s.schedule_blocks) && s.schedule_blocks.length > 0 ? (
                  s.schedule_blocks.map((block, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2 border border-white/10"
                    >
                      <FaCalendarAlt className="text-emerald-400" />
                      <span className="font-medium text-emerald-400">
                        {Array.isArray(block.days)
                          ? block.days.join(", ")
                          : block.days}
                      </span>
                      {block.start && block.end && (
                        <span className="text-gray-400 text-sm">
                          | {block.start} – {block.end}
                        </span>
                      )}
                    </li>
                  ))
                ) : (
                  <li className="italic text-gray-500">No schedule info</li>
                )}
              </ul>

              {/* Info Section */}
              <div className="text-sm text-gray-400 space-y-2 relative z-10">
                <p className="flex items-center gap-2">
                  <FaGraduationCap className="text-emerald-400" />
                  <span className="font-medium text-white">{s.course}</span> |{" "}
                  <span className="font-medium text-white">{s.section}</span>
                </p>
                <p className="flex items-center gap-2">
                  📅 <span className="text-gray-300">{s.semester} | {s.year_level}</span>
                </p>
                <p className="flex items-center gap-2">
                  <FaUserTie className="text-emerald-400" />
                  <span className="font-medium text-white">
                    {s.instructor_first_name} {s.instructor_last_name}
                  </span>
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-400">
          <FaBookOpen className="mx-auto mb-4 text-5xl text-emerald-500" />
          <p className="text-lg">No subjects assigned yet.</p>
          <p className="text-sm">Upload your COR to auto-assign subjects.</p>
        </div>
      )}

      {/* Upload COR Modal */}
      {isModalOpen && (
        <UploadCorModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={fetchAssignedSubjects}
        />
      )}
    </div>
  );
};

export default AssignedSubjects;
