import { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import BackButton from './BackButton';
import AppIcon from './AppIcon';
import NotificationBell from './NotificationBell';

const Navbar = ({ toggleSidebar }) => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white shadow-sm h-16 flex items-center justify-between px-4 md:px-6 z-10">
      <div className="flex items-center">
        <BackButton fallbackPath="/app/dashboard" className="mr-3" compact />
        <button 
          onClick={toggleSidebar}
          className="md:hidden mr-4 text-subtext hover:text-primary focus:outline-none"
          aria-label="Open navigation menu"
        >
          <AppIcon name="menu" className="h-6 w-6" />
        </button>
        <img src="/logo.jpeg" alt="AgriHerd" className="h-10 w-8 rounded-full object-cover mr-2" />
        <h1 className="text-xl font-bold text-primary">Farm Dashboard</h1>
      </div>
      
      <div className="flex items-center space-x-6">
        <NotificationBell />
        <Link to="/profile" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm">
            {user?.full_name?.charAt(0) || <AppIcon name="profile" className="h-4 w-4" />}
          </div>
          <span className="hidden md:block text-sm font-medium text-maintext">{user?.full_name || 'User'}</span>
        </Link>
        <button 
          onClick={handleLogout}
          className="inline-flex items-center gap-2 text-error text-sm font-medium hover:underline"
        >
          <AppIcon name="logout" className="h-4 w-4" />
          Logout
        </button>
      </div>
    </header>
  );
};

export default Navbar;