// src/pages/InstructorDashboard.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AOS from "aos";
import "aos/dist/aos.css";

import Navbar from "../components/Instructor/Navbar";
import Sidebar from "../components/Instructor/Sidebar";
import Subjects from "../components/Instructor/Subjects";
import AssignedStudentsTable from "../components/Instructor/AssignedStudentsTable";
import AttendanceReports from "../components/Instructor/AttendanceReports";
import SubjectCreatorModal from "../components/Instructor/SubjectCreatorModal";
import AttendanceSession from "../components/Instructor/AttendanceSession";
import { toast } from "react-toastify";

const InstructorDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("subject");
  const [instructor, setInstructor] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [activeSubjectId, setActiveSubjectId] = useState(null);
  const [subjectData, setSubjectData] = useState({
    subject_code: "",
    subject_title: "",
    course: "",
    section: "",
    schedule_blocks: [{ day: "", start: "", end: "" }],
  });

  useEffect(() => {
    AOS.init({ duration: 600 });

    const token = localStorage.getItem("token");
    const userType = localStorage.getItem("userType");
    const storedData = JSON.parse(localStorage.getItem("userData"));

    if (!token || userType !== "instructor" || !storedData) {
      navigate("/instructor/login", { replace: true });
    } else {
      setInstructor(storedData);
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("userData");
    localStorage.removeItem("token");
    localStorage.removeItem("userType");
    navigate("/instructor/login");
  };

  const handleSubjectChange = (type, indexOrField, key, value) => {
    if (type === "field") {
      setSubjectData({ ...subjectData, [indexOrField]: key });
    } else if (type === "block") {
      const updated = [...subjectData.schedule_blocks];
      updated[indexOrField][key] = value;
      setSubjectData({ ...subjectData, schedule_blocks: updated });
    } else if (type === "addBlock") {
      setSubjectData({
        ...subjectData,
        schedule_blocks: [
          ...subjectData.schedule_blocks,
          { day: "", start: "", end: "" },
        ],
      });
    }
  };

  const handleCreateSubject = async () => {
    try {
      const { createSubject } = await import("../services/api");
      const { subject_code, subject_title, course, section, schedule_blocks } =
        subjectData;

      const formattedBlocks = schedule_blocks.map((block) => ({
        day: block.day,
        time: `${block.start} - ${block.end}`,
      }));

      await createSubject({
        subject_code,
        subject_title,
        course,
        section,
        instructor_id: instructor.instructor_id, // ✅ safe since storedData is loaded
        schedule_blocks: formattedBlocks,
      });

      toast.success("Subject created!");
      setShowModal(false);
      setSubjectData({
        subject_code: "",
        subject_title: "",
        course: "",
        section: "",
        schedule_blocks: [{ day: "", start: "", end: "" }],
      });
    } catch {
      toast.error("Failed to create subject.");
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "subject":
        return (
          <Subjects
            onActivateSession={(id) => {
              setActiveSubjectId(id);
              setActiveTab("session");
            }}
          />
        );
      case "assigned":
        return <AssignedStudentsTable />;
      case "attendance":
        return <AttendanceReports />;
      case "session":
        return (
          <AttendanceSession
            subjectId={activeSubjectId}
            instructorId={instructor?.instructor_id}
          />
        );
      default:
        return <Subjects openModal={() => setShowModal(true)} />;
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-900 text-white">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        handleLogout={handleLogout}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      <main className="flex-1 p-6 md:ml-0">
        <Navbar
          instructor={instructor}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />
        <div data-aos="fade-up" className="mt-6">
          {renderContent()}
        </div>
      </main>

      <SubjectCreatorModal
        show={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleCreateSubject}
        subjectData={subjectData}
        onChange={handleSubjectChange}
      />
    </div>
  );
};

export default InstructorDashboard;
