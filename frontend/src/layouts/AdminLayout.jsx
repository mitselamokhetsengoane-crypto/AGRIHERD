import { useContext, useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import Footer from '../components/common/Footer';
import BackButton from '../components/common/BackButton';
import { AuthContext } from '../context/AuthContext';

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSignOut = () => { logout(); navigate('/login', { replace: true }); };

  const adminLinks = [
    { name: 'Platform Dashboard', path: '/admin/dashboard' },
    { name: 'User Management', path: '/admin/users' },
    { name: 'Farm Management', path: '/admin/farms' },
    { name: 'Marketplace Monitor', path: '/admin/marketplace' },
    { name: 'Categories', path: '/admin/categories' },
    { name: 'Roles & Permissions', path: '/admin/roles' },
    { name: 'Data Classification', path: '/admin/classification' },
    { name: 'Audit Logs', path: '/admin/audit-logs' },
    { name: 'Security Settings', path: '/admin/settings' },
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
                `block px-4 py-2 rounded-md transition-colors ${
                  isActive ? 'bg-secondary text-gray-900 font-semibold' : 'text-gray-300 hover:bg-gray-800'
                }`}>
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
          <span className="text-xs text-red-600 font-bold px-3 py-1 bg-red-50 border border-red-100 rounded-full uppercase tracking-wider">Restricted Access</span>
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
                    `block rounded-md px-4 py-2 transition-colors ${
                      isActive ? 'bg-secondary font-semibold text-gray-900' : 'text-gray-300 hover:bg-gray-800'
                    }`}>
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