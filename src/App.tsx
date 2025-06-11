import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import TeacherProtectedRoute from './components/TeacherProtectedRoute';
import DashboardLayout from './components/DashboardLayout';
import TeacherDashboardLayout from './components/TeacherDashboardLayout';
import Login from './pages/Login';
import TeacherLogin from './pages/TeacherLogin';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Attendance from './pages/Attendance';
import Assignments from './pages/Assignments';
import GPAPredictor from './pages/GPAPredictor';
import EnhancedGPAPredictor from './pages/EnhancedGPAPredictor';
import Events from './pages/Events';
import Communities from './pages/Communities';
import Messages from './pages/Messages';
import LearnCenter from './pages/LearnCenter';
import AIHub from './pages/AIHub';

// Teacher pages
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import TeacherAttendance from './pages/teacher/TeacherAttendance';
import TeacherAssignments from './pages/teacher/TeacherAssignments';
import TeacherMarks from './pages/teacher/TeacherMarks';
import TeacherReports from './pages/teacher/TeacherReports';
import TeacherMessages from './pages/teacher/TeacherMessages';
import TeacherClasses from './pages/teacher/TeacherClasses';
import TeacherStudents from './pages/teacher/TeacherStudents';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/teacher-login" element={<TeacherLogin />} />
              <Route path="/register" element={<Register />} />
              
              {/* Student routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="ai-hub" element={<AIHub />} />
                <Route path="communities" element={<Communities />} />
                <Route path="events" element={<Events />} />
                <Route path="attendance" element={<Attendance />} />
                <Route path="assignments" element={<Assignments />} />
                <Route path="gpa-predictor" element={<EnhancedGPAPredictor />} />
                <Route path="messages" element={<Messages />} />
                <Route path="learncenter" element={<LearnCenter />} />
              </Route>

              {/* Teacher routes */}
              <Route
                path="/teacher-dashboard"
                element={
                  <TeacherProtectedRoute>
                    <TeacherDashboardLayout />
                  </TeacherProtectedRoute>
                }
              >
                <Route index element={<TeacherDashboard />} />
                <Route path="classes" element={<TeacherClasses />} />
                <Route path="students" element={<TeacherStudents />} />
                <Route path="attendance" element={<TeacherAttendance />} />
                <Route path="assignments" element={<TeacherAssignments />} />
                <Route path="marks" element={<TeacherMarks />} />
                <Route path="reports" element={<TeacherReports />} />
                <Route path="messages" element={<TeacherMessages />} />
              </Route>

              {/* Default redirect */}
              <Route path="/" element={<Navigate to="/dashboard\" replace />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;