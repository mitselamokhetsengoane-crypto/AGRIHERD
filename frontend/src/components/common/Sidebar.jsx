import { NavLink } from 'react-router-dom';
import AppIcon from './AppIcon';

const Sidebar = ({ closeMobile }) => {
  const navItems = [
    { name: 'Dashboard', path: '/app/dashboard', icon: 'dashboard' },
    { name: 'Livestock', path: '/app/livestock', icon: 'livestock' },
    { name: 'Crops', path: '/app/crops', icon: 'crops' },
    { name: 'Tasks', path: '/app/tasks', icon: 'tasks' },
    { name: 'Inventory', path: '/app/inventory', icon: 'inventory' },
    { name: 'Finance', path: '/app/finance', icon: 'finance' },
    { name: 'My Listings', path: '/app/marketplace/listings', icon: 'marketplace' },
    { name: 'Orders Received', path: '/app/marketplace/orders', icon: 'cart' },
    { name: 'Browse Marketplace', path: '/marketplace', icon: 'marketplace' },
    { name: 'Disease Scanner', path: '/app/disease-scanner', icon: 'scanner' },
    { name: 'Notifications', path: '/app/notifications', icon: 'notification' },
  ];

  return (
    <aside className="w-64 bg-white shadow-md flex flex-col h-full">
      <div className="h-16 flex items-center justify-center gap-2 border-b border-gray-100">
        <img src="/logo.jpeg" alt="AgriHerd" className="h-12 w-10 rounded-full object-cover" />
        <h2 className="text-2xl font-bold text-primary tracking-wide">AgriHerd</h2>
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            onClick={closeMobile}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-md transition-colors text-sm font-medium ${
                isActive ? 'bg-primary text-white' : 'text-maintext hover:bg-background'
              }`
            }
          >
              <AppIcon name={item.icon} className="h-5 w-5 shrink-0" />
              {item.name}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;