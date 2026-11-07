import { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const AdminProtectedRoute = () => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div className="h-screen flex items-center justify-center text-primary font-bold">Loading...</div>;

  // If not logged in, or not an admin, redirect to login or farm dashboard
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/app/dashboard" replace />;

  return <Outlet />;
};

export default AdminProtectedRoute;