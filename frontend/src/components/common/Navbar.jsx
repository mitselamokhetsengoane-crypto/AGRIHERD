import { useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import BackButton from './BackButton';
import NotificationBell from './NotificationBell';
import { Menu, LogOut, UserRound } from 'lucide-react';

const routeTitles = {
  '/app/dashboard': 'Farm Dashboard',
  '/app/crops': 'Crop Management',
  '/app/crops/add': 'Add New Crop',
  '/app/livestock': 'Livestock Management',
  '/app/livestock/add': 'Add Livestock Animal',
  '/app/inventory': 'Farm Inventory',
  '/app/inventory/add': 'Add Inventory Item',
  '/app/finance': 'Financial Management',
  '/app/finance/income': 'Farm Income',
  '/app/finance/expenses': 'Farm Expenses',
  '/app/finance/reports': 'Financial Reports',
  '/app/tasks': 'Tasks & Scheduling',
  '/app/tasks/add': 'Create Task',
  '/app/tasks/calendar': 'Task Calendar',
  '/app/disease-scanner': 'Crop Disease Scanner',
  '/app/marketplace': 'AgriHerd Marketplace',
  '/app/marketplace/listings': 'My Product Listings',
  '/app/marketplace/orders': 'Orders Received',
  '/app/notifications': 'Notifications',
  '/app/profile': 'Farmer Profile',
};

const Navbar = ({ toggleSidebar }) => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const currentTitle = routeTitles[location.pathname] || 'Farmer Portal';

  return (
    <header className="header-fixed flex items-center justify-between px-4 sm:px-6 bg-white border-b border-gray-100 z-20">
      <div className="flex items-center gap-3">
        <BackButton fallbackPath="/app/dashboard" compact />
        <button
          type="button"
          onClick={toggleSidebar}
          className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 focus:outline-none"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div>
          <h1 className="text-base sm:text-lg font-bold text-maintext">
            {currentTitle}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        <NotificationBell to="/app/notifications" />

        <div className="h-4 w-px bg-gray-200 hidden sm:block" />

        <Link
          to="/app/profile"
          className="flex items-center gap-2 rounded-lg p-1 hover:bg-gray-50 transition"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-light text-primary font-bold text-xs ring-2 ring-primary/10">
            {user?.full_name ? user.full_name.charAt(0).toUpperCase() : <UserRound className="h-4 w-4" />}
          </div>
          <div className="hidden sm:block text-left">
            <span className="block text-xs font-bold text-maintext leading-tight">
              {user?.full_name || 'Farmer'}
            </span>
            <span className="block text-[11px] text-subtext leading-tight">
              {user?.role ? user.role.toUpperCase() : 'FARMER'}
            </span>
          </div>
        </Link>

        <button
          type="button"
          onClick={handleLogout}
          aria-label="Sign out"
          title="Sign out"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-error transition"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
};

export default Navbar;
