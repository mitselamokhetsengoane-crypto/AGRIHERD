import { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import AccessDenied from './AccessDenied';

const AdminProtectedRoute = () => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div className="h-screen flex items-center justify-center text-primary font-bold">Loading...</div>;

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') {
    return <AccessDenied reason="Administrator access is required for this area." />;
  }

  return <Outlet />;
};

export default AdminProtectedRoute;