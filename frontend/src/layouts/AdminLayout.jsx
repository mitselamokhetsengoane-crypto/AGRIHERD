import { useContext, useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import Footer from '../components/common/Footer';
import BackButton from '../components/common/BackButton';
import { AuthContext } from '../context/AuthContext';

const iconShapes = {
  dashboard: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
  farms: <><path d="m3 10 9-7 9 7" /><path d="M5 9v12h14V9M9 21v-7h6v7" /></>,
  marketplace: <><path d="M3 9h18l-1.5-6h-15z" /><path d="M5 9v12h14V9M9 21v-7h6v7" /></>,
  categories: <><rect x="3" y="3" width="8" height="8" rx="1" /><rect x="13" y="3" width="8" height="8" rx="1" /><rect x="3" y="13" width="8" height="8" rx="1" /><rect x="13" y="13" width="8" height="8" rx="1" /></>,
  roles: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" /><path d="m9 12 2 2 4-4" /></>,
  classification: <><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 12 9 5 9-5M3 16l9 5 9-5" /></>,
  audit: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M8 13h8M8 17h8" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.7a8 8 0 0 1-1.5.9l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.5-.9l-1.7.7-1.4-2.4 1.4-1.1a7 7 0 0 1 0-1.8L6.3 13l1.4-2.4 1.7.7a8 8 0 0 1 1.5-.9l.3-1.8H14l.3 1.8a8 8 0 0 1 1.5.9l1.7-.7 1.4 2.4-1.4 1.1a7 7 0 0 1-.1.9Z" /></>,
  ai: <><path d="M12 3v3M5.6 5.6l2.1 2.1M3 12h3M5.6 18.4l2.1-2.1M12 18v3M18.4 18.4l-2.1-2.1M18 12h3M18.4 5.6l-2.1 2.1" /><circle cx="12" cy="12" r="4" /></>,
  blockchain: <><path d="M10 13a5 5 0 0 0 7.1 0l3-3A5 5 0 0 0 13 2.9l-1.7 1.7" /><path d="M14 11a5 5 0 0 0-7.1 0l-3 3A5 5 0 0 0 11 21.1l1.7-1.7" /></>,
};

const AdminIcon = ({ name }) => (
  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 shrink-0">
    {iconShapes[name]}
  </svg>
);

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSignOut = () => { logout(); navigate('/login', { replace: true }); };

  const adminLinks = [
    { name: 'Platform Dashboard', path: '/admin/dashboard', icon: 'dashboard' },
    { name: 'User Management', path: '/admin/users', icon: 'users' },
    { name: 'Farm Management', path: '/admin/farms', icon: 'farms' },
    { name: 'Marketplace Monitor', path: '/admin/marketplace', icon: 'marketplace' },
    { name: 'Categories', path: '/admin/categories', icon: 'categories' },
    { name: 'AI Dashboard', path: '/admin/ai', icon: 'ai' },
    { name: 'Blockchain', path: '/admin/blockchain', icon: 'blockchain' },
    { name: 'Roles & Permissions', path: '/admin/roles', icon: 'roles' },
    { name: 'Data Classification', path: '/admin/classification', icon: 'classification' },
    { name: 'Audit Logs', path: '/admin/audit-logs', icon: 'audit' },
    { name: 'Security Settings', path: '/admin/settings', icon: 'settings' },
  ];

  return (
    <div className="app-shell bg-gray-50">
      <aside className="sidebar-fixed hidden md:flex flex-col bg-gray-900 text-white">
        <div className="h-16 flex items-center px-4 border-b border-gray-800">
          <img src="/logo.jpeg" alt="AgriHerd" className="h-12 w-10 rounded-full object-cover" />
          <h2 className="text-xl font-bold text-secondary">AgriHerd Admin</h2>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {adminLinks.map((link) => (
            <NavLink key={link.name} to={link.path} end={link.path === '/admin/dashboard'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2 rounded-md transition-colors ${
                  isActive ? 'bg-secondary text-gray-900 font-semibold' : 'text-gray-300 hover:bg-gray-800'
                }`}>
              <AdminIcon name={link.icon} />
              {link.name}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-800">
          <button type="button" onClick={handleSignOut} className="w-full text-left text-sm text-gray-300 hover:text-white transition">Sign Out</button>
        </div>
      </aside>

      <div className="main-content-wrapper">
        <header className="header-fixed bg-white shadow-sm flex items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-3">
            <BackButton fallbackPath="/admin/dashboard" compact />
            <button type="button" onClick={() => setIsSidebarOpen(true)} className="md:hidden rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100">Menu</button>
            <h1 className="text-lg font-semibold text-gray-800">Platform Administration</h1>
          </div>
          <span className="text-xs text-gray-500">Administrator session</span>
        </header>

        <main className="content-scrollable">
          <div className="max-w-6xl mx-auto"><Outlet /></div>
        </main>

        <Footer />
      </div>

      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <button type="button" aria-label="Close" className="fixed inset-0 bg-black/50" onClick={() => setIsSidebarOpen(false)} />
          <aside className="relative z-50 flex h-full w-64 flex-col bg-gray-900 text-white">
            <div className="flex h-16 items-center gap-2 border-b border-gray-800 px-4">
              <img src="/logo.jpeg" alt="AgriHerd" className="h-12 w-10 rounded-full object-cover" />
              <h2 className="text-xl font-bold text-secondary">AgriHerd Admin</h2>
            </div>
            <nav className="flex-1 space-y-2 overflow-y-auto p-4">
              {adminLinks.map((link) => (
                <NavLink key={link.name} to={link.path} end={link.path === '/admin/dashboard'} onClick={() => setIsSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-md px-4 py-2 transition-colors ${
                      isActive ? 'bg-secondary font-semibold text-gray-900' : 'text-gray-300 hover:bg-gray-800'
                    }`}>
                  <AdminIcon name={link.icon} />
                  {link.name}
                </NavLink>
              ))}
            </nav>
            <div className="border-t border-gray-800 p-4">
              <button type="button" onClick={handleSignOut} className="w-full text-left text-sm text-gray-300 hover:text-white">Sign Out</button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};

export default AdminLayout;