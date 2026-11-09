import { NavLink } from 'react-router-dom';

const Sidebar = ({ closeMobile }) => {
  const navItems = [
    { name: 'Dashboard', path: '/app/dashboard' },
    { name: 'Livestock', path: '/app/livestock' },
    { name: 'Crops', path: '/app/crops' },
    { name: 'Tasks', path: '/app/tasks' },
    { name: 'Inventory', path: '/app/inventory' },
    { name: 'Finance', path: '/app/finance' },
    { name: 'My Listings', path: '/app/marketplace/listings' },
    { name: 'Orders Received', path: '/app/marketplace/orders' },
    { name: 'Browse Marketplace', path: '/marketplace' },
    { name: 'Disease Scanner', path: '/app/disease-scanner' },
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
              `block px-4 py-3 rounded-md transition-colors text-sm font-medium ${
                isActive ? 'bg-primary text-white' : 'text-maintext hover:bg-background'
              }`
            }
          >
            {item.name}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;