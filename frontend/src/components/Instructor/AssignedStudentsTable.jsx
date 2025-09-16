// src/components/Instructor/AssignedStudentsTable.jsx
import { useEffect, useState } from "react";
import { getClassesByInstructor, getAssignedStudents } from "../../services/api";
import { toast } from "react-toastify";

const AssignedStudentsTable = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [students, setStudents] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);

  const instructor = JSON.parse(localStorage.getItem("instructor_data"));

  // ✅ Fetch classes when instructor logs in
  useEffect(() => {
    if (instructor?.instructor_id) {
      fetchClasses();
    }
  }, []);

  const fetchClasses = async () => {
    setLoadingClasses(true);
    try {
      const data = await getClassesByInstructor(instructor.instructor_id);
      setClasses(data);
    } catch (err) {
      console.error("Failed to load classes:", err);
      toast.error("Failed to load classes.");
    } finally {
      setLoadingClasses(false);
    }
  };

  const handleSelectClass = async (classId) => {
    setSelectedClass(classId);
    if (!classId) {
      setStudents([]);
      return;
    }

    setLoadingStudents(true);
    try {
      const data = await getAssignedStudents(classId);
      setStudents(data);
      console.log("✅ Assigned students:", data);
    } catch (err) {
      console.error("Failed to fetch assigned students:", err);
      toast.error("Failed to fetch assigned students.");
    } finally {
      setLoadingStudents(false);
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-xl shadow-md w-full">
      <h2 className="text-green-400 font-bold text-lg mb-4">Assigned Students</h2>

      {/* Class Dropdown */}
      <div className="mb-4">
        <select
          className="w-full sm:w-2/3 md:w-1/2 bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
          onChange={(e) => handleSelectClass(e.target.value)}
          value={selectedClass}
          disabled={loadingClasses}
        >
          <option value="">-- Select Class --</option>
          {classes.map((c) => (
            <option key={c._id} value={c._id}>
              {c.subject_code} - {c.subject_title}
            </option>
          ))}
        </select>
      </div>

      {/* Assigned Students Table */}
      <div className="overflow-x-auto">
        {loadingStudents ? (
          <p className="text-blue-400">Loading students...</p>
        ) : students.length > 0 ? (
          <table className="min-w-full text-sm text-left text-gray-300">
            <thead className="bg-gray-700 text-green-300">
              <tr>
                <th className="px-4 py-2">Student ID</th>
                <th>Full Name</th>
                <th>Course</th>
                <th>Section</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s, index) => (
                <tr key={index} className="border-b border-gray-700">
                  <td className="px-4 py-2">{s.student_id || "N/A"}</td>
                  <td>{`${s.first_name || ""} ${s.last_name || ""}`.trim()}</td>
                  <td>{s.course || "N/A"}</td>
                  <td>{s.section || "N/A"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          selectedClass && (
            <p className="text-gray-400">No students assigned to this class.</p>
          )
        )}
      </div>
    </div>
  );
};

export default AssignedStudentsTable;
