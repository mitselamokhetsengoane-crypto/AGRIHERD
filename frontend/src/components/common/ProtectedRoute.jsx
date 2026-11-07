import { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>;
  
  if (!user) return <Navigate to="/login" replace />;

  // If a specific role is required and the user doesn't match, send them to their correct home
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    return <Navigate to="/app/dashboard" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;