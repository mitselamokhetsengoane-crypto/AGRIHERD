import { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

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
        <button 
          onClick={toggleSidebar}
          className="md:hidden mr-4 text-subtext hover:text-primary focus:outline-none"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
        </button>
        <img src="/logo.jpeg" alt="AgriHerd" className="h-10 w-8 object-contain mr-2" />
        <h1 className="text-xl font-bold text-primary">Farm Dashboard</h1>
      </div>
      
      <div className="flex items-center space-x-6">
        <Link to="/notifications" className="text-subtext hover:text-primary transition relative">
          Notifications
        </Link>
        <Link to="/profile" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm">
            {user?.full_name?.charAt(0) || 'U'}
          </div>
          <span className="hidden md:block text-sm font-medium text-maintext">{user?.full_name || 'User'}</span>
        </Link>
        <button 
          onClick={handleLogout}
          className="text-error text-sm font-medium hover:underline"
        >
          Logout
        </button>
      </div>
    </header>
  );
};

export default Navbar;