import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import StudentDashboard from "./components/dashboard/StudentDashboard";
import TeacherDashboard from "./components/dashboard/TeacherDashboard";
import Login from "./components/auth/Login";
import Register from "./components/auth/Register";
import ExperimentPage from "./pages/ExperimentPage";
import FreeSimulator from "./pages/FreeSimulator";
import ShareCircuit from "./pages/ShareCircuit";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/common/Navbar";
import AdminDashboard from './components/dashboard/AdminDashboard';

// Protected Route Component
const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (role && user.role !== role) return <Navigate to="/" />;
  return children;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Navbar />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Standalone Simulator Route */}
          <Route path="/experiment/simulator/simulation" element={
            <ProtectedRoute role="student">
              <FreeSimulator />
            </ProtectedRoute>
          } />

          {/* Public read-only shared circuit */}
          <Route path="/share/circuit/:shareId" element={<ShareCircuit />} />

          <Route path="/teacher-dashboard" element={
            <ProtectedRoute role="teacher">
              <TeacherDashboard />
            </ProtectedRoute>
          } />

          <Route path="/admin-dashboard" element={
            <ProtectedRoute role="admin">
              <AdminDashboard />
            </ProtectedRoute>
          } />

          <Route path="/student-dashboard" element={
            <ProtectedRoute role="student">
              <StudentDashboard />
            </ProtectedRoute>
          } />

          <Route path="/experiment/:id" element={
            <ProtectedRoute role="student">
              <ExperimentPage />
            </ProtectedRoute>
          } />

          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
