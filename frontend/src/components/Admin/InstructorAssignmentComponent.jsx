import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  FaChalkboardTeacher,
  FaEnvelope,
  FaUserPlus,
  FaSearch,
} from "react-icons/fa";

import AssignInstructorModal from "./AssignInstructorModal";

const InstructorAssignmentComponent = () => {
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInstructor, setSelectedInstructor] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchInstructors();
  }, []);

  const fetchInstructors = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/instructors", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setInstructors(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error("❌ Failed to load instructors");
    } finally {
      setLoading(false);
    }
  };

  const filteredInstructors = instructors.filter(
    (inst) =>
      inst.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inst.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inst.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-neutral-900 p-8 rounded-2xl shadow-lg border border-neutral-700 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
        <h2 className="text-white text-3xl font-bold tracking-tight flex items-center gap-2">
          <FaChalkboardTeacher className="text-green-500" />
          Instructor Assignment
        </h2>

        {/* Search */}
        <div className="flex items-center bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 w-full sm:w-80">
          <FaSearch className="text-neutral-500 mr-2" />
          <input
            type="text"
            placeholder="Search instructors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent outline-none text-sm text-white w-full"
          />
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <p className="text-neutral-400">Loading instructors...</p>
      ) : filteredInstructors.length > 0 ? (
        <div className="grid sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredInstructors.map((inst, idx) => (
            <div
              key={idx}
              className="bg-neutral-800 rounded-xl p-6 border border-neutral-700 hover:border-green-400 hover:shadow-lg hover:shadow-green-500/10 transition transform hover:-translate-y-1 flex flex-col"
            >
              {/* Name */}
              <h3 className="text-xl font-bold text-white mb-2">
                {inst.first_name} {inst.last_name}
              </h3>

              {/* Email */}
              <p className="flex items-center gap-2 text-neutral-400 text-sm mb-6 truncate">
                <FaEnvelope className="text-green-400" />
                {inst.email}
              </p>

              {/* Assign Button */}
              <button
                onClick={() => setSelectedInstructor(inst)}
                className="mt-auto flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white text-sm font-medium transition"
              >
                <FaUserPlus /> Assign to Class
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-neutral-400 text-sm mt-4 text-center">
          No instructors found.
        </p>
      )}

      {/* Assign Instructor Modal */}
      {selectedInstructor && (
        <AssignInstructorModal
          instructor={selectedInstructor}
          onClose={() => setSelectedInstructor(null)}
          onAssigned={fetchInstructors} // refresh after assigning
        />
      )}
    </div>
  );
};

export default InstructorAssignmentComponent;
