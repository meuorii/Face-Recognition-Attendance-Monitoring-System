import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import UserSelect from "./pages/UserSelect";
import BlinkTester from "./pages/BlinkTester";
import StudentFaceLogin from "./components/Auth/StudentFaceLoginComponent";
import StudentRegister from "./pages/StudentRegister";
import StudentDashboard from "./pages/StudentDashboard";
import InstructorLogin from "./pages/InstructorLogin";
import InstructorRegister from "./pages/InstructorRegister";
import InstructorDashboard from "./pages/InstructorDashboard"; // ✅ Import dashboard
import AdminLogin from "./pages/AdminLogin";
import AdminRegister from "./pages/AdminRegister";
import AdminDashboard from "./pages/AdminDashboard";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  return (
    <Router>
      <>
        <Routes>
          {/* ✅ Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/select" element={<UserSelect />} />
          <Route path="/test-blink" element={<BlinkTester />} />


          {/* ✅ Student Routes */}
          <Route path="/student/login" element={<StudentFaceLogin />} />
          <Route path="/student/register" element={<StudentRegister />} />
          <Route path="/student/dashboard" element={<StudentDashboard />} />

          {/* ✅ Instructor Routes */}
          <Route path="/instructor/login" element={<InstructorLogin />} />
          <Route path="/instructor/register" element={<InstructorRegister />} />
          <Route path="/instructor/dashboard" element={<InstructorDashboard />} />

          {/* ✅ Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/register" element={<AdminRegister />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Routes>

        {/* ✅ Global toast notifications */}
        <ToastContainer
          position="top-center"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          pauseOnHover
          draggable
          theme="dark"
        />
      </>
    </Router>
  );
}

export default App;
