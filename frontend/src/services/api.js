import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
  timeout: 15000,
});

// ==============================
// 🔹 Face Recognition
// ==============================
export const studentFaceLogin = (payload) =>
  API.post("/face/login", payload);

export const registerFaceAuto = (payload) =>
  API.post("/face/register-auto", payload);

export const registerFaceFrame = (payload) =>
  API.post("/face/register-frame", payload);

export const attendanceSession = (payload) =>
  API.post("/face/attendance-session", payload);

export const detectBlink = (payload) =>
  API.post("/blink/blink-detect", payload);

// ==============================
// 🔹 Attendance Control
// ==============================
export const activateAttendance = async (classId) => {
  const token = localStorage.getItem("token");
  const res = await API.post(
    "/attendance/start-session",
    { class_id: classId },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
};

export const stopAttendance = async (classId) => {
  const token = localStorage.getItem("token");
  const res = await API.post(
    "/attendance/stop-session",
    { class_id: classId },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
};

export const getActiveAttendanceSession = async () => {
  const token = localStorage.getItem("token");
  const res = await API.get("/attendance/active-session", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const getAttendanceLogs = async (classId) => {
  try {
    const token = localStorage.getItem("token");
    const res = await API.get(`/attendance/logs/${classId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  } catch (err) {
    console.error("❌ Failed to fetch attendance logs:", err);
    throw err;
  }
};

export const markAttendance = (payload) =>
  API.post("/attendance/mark", payload);

// ==============================
// 🔹 Authentication
// ==============================
export const studentRegister = (data) =>
  API.post("/auth/register", data);

export const studentLogin = (data) =>
  API.post("/auth/login", data);

export const instructorRegister = (data) =>
  API.post("/instructor/register", data);

export const instructorLogin = (data) =>
  API.post("/instructor/login", data);

// ==============================
// 🔹 Instructor Subject Management
// ==============================
export const getClassesByInstructor = async (instructorId) => {
  const token = localStorage.getItem("token");
  const res = await API.get(`/instructor/${instructorId}/classes`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const getAssignedStudents = async (classId) => {
  const token = localStorage.getItem("token");
  const res = await API.get(
    `/instructor/class/${classId}/assigned-students`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
};

export const getAttendanceReportByClass = async (id, from, to) => {
  const token = localStorage.getItem("token");
  const params = new URLSearchParams();
  if (from) params.append("from", from);
  if (to) params.append("to", to);

  const res = await API.get(
    `/instructor/class/${id}/attendance-report?${params}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  // 🔹 Return records array directly
  return res.data.records || [];
};

export const getAttendanceReportAll = async (from, to) => {
  const token = localStorage.getItem("token");
  const params = new URLSearchParams();
  if (from) params.append("from", from);
  if (to) params.append("to", to);

  const res = await API.get(
    `/instructor/attendance-report/all?${params}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  return res.data || [];
};

// ==============================
// 🔹 Student Dashboard
// ==============================
export const getSubjectsByStudent = async (id) => {
  const token = localStorage.getItem("token");
  const res = await API.get(`/student/${id}/assigned-subjects`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const getAttendanceLogsByStudent = async (id) => {
  const token = localStorage.getItem("token");
  const res = await API.get(`/student/${id}/attendance-logs`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export default API;
