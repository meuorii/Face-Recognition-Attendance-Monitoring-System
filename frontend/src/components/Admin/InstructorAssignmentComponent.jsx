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
    <div className="bg-neutral-950 
                    backdrop-blur-xl shadow-2xl 
                    rounded-2xl p-8 space-y-8 max-w-7xl mx-auto animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h2 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
          <FaChalkboardTeacher className="text-emerald-400" />
          <span className="bg-gradient-to-r from-emerald-400 to-green-500 bg-clip-text text-transparent">
            Instructor Assignment
          </span>
        </h2>

        {/* Search */}
        <div className="flex items-center w-full sm:w-80 px-3 py-2 rounded-lg 
                        bg-neutral-800/70 border border-white/10 shadow-inner">
          <FaSearch className="text-neutral-500 mr-2" />
          <input
            type="text"
            placeholder="Search instructors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent outline-none text-sm text-white w-full placeholder-neutral-500"
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
              className="group relative flex flex-col rounded-2xl p-6 
                        bg-gradient-to-br from-neutral-900/70 to-neutral-950/70 
                        backdrop-blur-xl border border-white/10 shadow-md
                        hover:shadow-emerald-500/30 transition-all duration-500
                        transform hover:scale-[1.03] hover:-translate-y-[4px]"
            >
              {/* Glow Accent Line (top) */}
              <div className="absolute top-0 left-0 w-full h-1 
                              bg-gradient-to-r from-emerald-400 via-green-500 to-emerald-600 
                              opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-t-2xl"></div>

              {/* Name */}
              <h3 className="text-xl font-extrabold text-white mb-2 
                            bg-gradient-to-r from-white to-neutral-300 bg-clip-text text-transparent
                            group-hover:from-emerald-300 group-hover:to-green-400 transition-all duration-500">
                {inst.first_name} {inst.last_name}
              </h3>

              {/* Email */}
              <p className="flex items-center gap-2 text-neutral-400 text-sm mb-6 truncate">
                <FaEnvelope className="text-emerald-400 group-hover:scale-110 transition-transform duration-300" />
                {inst.email}
              </p>

              {/* Assign Button */}
              <button
                onClick={() => setSelectedInstructor(inst)}
                className="mt-auto flex items-center justify-center gap-2 px-5 py-2.5 
                          rounded-lg bg-gradient-to-r from-emerald-400 to-green-500
                          text-white text-sm font-semibold shadow-md
                          hover:from-emerald-500 to-green-600
                          hover:shadow-lg hover:shadow-emerald-500/40
                          transform hover:scale-105 transition-all duration-300"
              >
                <FaUserPlus className="text-sm" /> Assign to Class
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
