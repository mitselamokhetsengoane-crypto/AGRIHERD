import { useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import AppIcon from './AppIcon';
import { LogOut, X } from 'lucide-react';

const Sidebar = ({ closeMobile }) => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/app/dashboard', icon: 'dashboard' },
    { name: 'Crops', path: '/app/crops', icon: 'crops' },
    { name: 'Livestock', path: '/app/livestock', icon: 'livestock' },
    { name: 'Inventory', path: '/app/inventory', icon: 'inventory' },
    { name: 'Finance', path: '/app/finance', icon: 'finance' },
    { name: 'Tasks', path: '/app/tasks', icon: 'tasks' },
    { name: 'Disease Scanner', path: '/app/disease-scanner', icon: 'scanner' },
    { name: 'Marketplace', path: '/app/marketplace', icon: 'marketplace' },
    { name: 'My Listings', path: '/app/marketplace/listings', icon: 'store' },
    { name: 'Orders Received', path: '/app/marketplace/orders', icon: 'cart' },
    { name: 'Notifications', path: '/app/notifications', icon: 'notification' },
    { name: 'Profile', path: '/app/profile', icon: 'profile' },
  ];

  return (
    <aside className="flex flex-col h-full bg-white border-r border-gray-100 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-2.5">
          <img
            src="/logo.jpeg"
            alt="AgriHerd"
            className="h-9 w-9 rounded-xl object-cover shadow-sm ring-1 ring-primary/10"
          />
          <div>
            <span className="text-lg font-bold tracking-tight text-primary">AgriHerd</span>
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-subtext">
              Farmer Portal
            </span>
          </div>
        </div>
        {closeMobile && (
          <button
            type="button"
            onClick={closeMobile}
            aria-label="Close menu"
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Farm / User Info Pill */}
      {user?.farm_name && (
        <div className="mx-4 mt-3 rounded-lg bg-emerald-50/70 p-2.5 border border-emerald-100/60 shrink-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800">
            Active Farm
          </p>
          <p className="text-xs font-bold text-primary truncate">{user.farm_name}</p>
        </div>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            end={item.path === '/app/dashboard'}
            onClick={closeMobile}
            className={({ isActive }) =>
              `group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                isActive
                  ? 'bg-primary text-white shadow-sm shadow-primary/20'
                  : 'text-maintext hover:bg-gray-50 hover:text-primary'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <AppIcon
                  name={item.icon}
                  className={`h-4 w-4 shrink-0 transition-colors ${
                    isActive ? 'text-white' : 'text-subtext group-hover:text-primary'
                  }`}
                  strokeWidth={isActive ? 2.2 : 1.75}
                />
                <span className="truncate">{item.name}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer / User & Logout */}
      <div className="p-3 border-t border-gray-100 shrink-0 space-y-1">
        <NavLink
          to="/app/profile"
          onClick={closeMobile}
          className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary font-bold text-xs">
            {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'F'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-maintext truncate">
              {user?.full_name || 'Farmer'}
            </p>
            <p className="text-[11px] text-subtext truncate">{user?.email || 'farmer@agriherd.com'}</p>
          </div>
        </NavLink>

        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-2.5 px-3 py-2 text-xs font-semibold text-error hover:bg-red-50 rounded-xl transition"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
