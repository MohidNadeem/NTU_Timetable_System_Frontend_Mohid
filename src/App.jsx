import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import LoginPage from './pages/LoginPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import LecturerDashboard from './pages/LecturerDashboard';
import TimetablingTeamDashboard from './pages/TimetablingTeamDashboard';
import TimetablePage from './pages/TimetablePage';
import LecturerRequestsPage from './pages/LecturerRequestsPage';
import MyConstraintRequestsPage from './pages/MyConstraintRequestsPage';
import TimetablingTeamRequestsPage from './pages/TimetablingTeamRequestsPage';

// sending "/" to the right place based on auth state, so it's never a dead-end route
function HomeRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.mustChangePassword) return <Navigate to="/change-password" replace />;
  return <Navigate to={user.role === 'LECTURER' ? '/lecturer' : '/timetabling-team'} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/change-password" element={<ChangePasswordPage />} />

          {/* wrapping lecturer routes in ProtectedRoute so a timetabling-team login gets bounced out */}
          <Route
            path="/lecturer"
            element={
              <ProtectedRoute allowedRole="LECTURER">
                <LecturerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/lecturer/timetable"
            element={
              <ProtectedRoute allowedRole="LECTURER">
                <TimetablePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/lecturer/requests"
            element={
              <ProtectedRoute allowedRole="LECTURER">
                <LecturerRequestsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/lecturer/requests/history"
            element={
              <ProtectedRoute allowedRole="LECTURER">
                <MyConstraintRequestsPage />
              </ProtectedRoute>
            }
          />

          {/* same idea, mirrored for the timetabling-team side */}
          <Route
            path="/timetabling-team"
            element={
              <ProtectedRoute allowedRole="TIMETABLING_TEAM">
                <TimetablingTeamDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/timetabling-team/timetable"
            element={
              <ProtectedRoute allowedRole="TIMETABLING_TEAM">
                <TimetablePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/timetabling-team/requests"
            element={
              <ProtectedRoute allowedRole="TIMETABLING_TEAM">
                <TimetablingTeamRequestsPage />
              </ProtectedRoute>
            }
          />

          {/* catching unknown paths so they resolve via HomeRedirect instead of a blank page */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}