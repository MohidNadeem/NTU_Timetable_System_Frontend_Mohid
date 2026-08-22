import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { roleHomePath } from '../api/constraintOptions';

export default function ProtectedRoute({ children, allowedRole }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.mustChangePassword) {
    return <Navigate to="/change-password" replace />;
  }

  if (allowedRole && user.role !== allowedRole) {
    // Logged in, but wrong role for this route - send them to their own home.
    return <Navigate to={roleHomePath(user.role)} replace />;
  }

  return children;
}
