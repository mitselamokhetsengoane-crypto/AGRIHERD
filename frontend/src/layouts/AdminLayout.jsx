import { useContext, useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import Footer from '../components/common/Footer';
import BackButton from '../components/common/BackButton';
import AppIcon from '../components/common/AppIcon';
import NotificationBell from '../components/common/NotificationBell';
import { AuthContext } from '../context/AuthContext';
import { Menu, LogOut, ShieldCheck, Activity, X } from 'lucide-react';

const adminRouteTitles = {
  '/admin/dashboard': 'Platform Overview',
  '/admin/users': 'User Management & Approvals',
  '/admin/farms': 'Farm Registry Management',
  '/admin/marketplace': 'Marketplace Transactions & Monitoring',
  '/admin/categories': 'Product Categories Management',
  '/admin/ai': 'AI Diagnostic Model Management',
  '/admin/blockchain': 'Blockchain Verification & Audit',
  '/admin/roles': 'Roles & Permissions Control',
  '/admin/classification': 'Data Classification & Governance',
  '/admin/audit-logs': 'System Security Audit Logs',
  '/admin/settings': 'Platform Security Settings',
  '/admin/profile': 'Administrator Profile',
};

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const adminLinks = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: 'dashboard' },
    { name: 'User Management', path: '/admin/users', icon: 'users' },
    { name: 'Farm Management', path: '/admin/farms', icon: 'farms' },
    { name: 'Marketplace Monitoring', path: '/admin/marketplace', icon: 'marketplace' },
    { name: 'Categories', path: '/admin/categories', icon: 'categories' },
    { name: 'AI Management', path: '/admin/ai', icon: 'ai' },
    { name: 'Blockchain', path: '/admin/blockchain', icon: 'blockchain' },
    { name: 'Roles & Permissions', path: '/admin/roles', icon: 'roles' },
    { name: 'Data Classification', path: '/admin/classification', icon: 'classification' },
    { name: 'Audit Logs', path: '/admin/audit-logs', icon: 'audit' },
    { name: 'System Settings', path: '/admin/settings', icon: 'settings' },
    { name: 'Profile', path: '/admin/profile', icon: 'profile' },
  ];

  const currentTitle = adminRouteTitles[location.pathname] || 'Platform Administration';

  const renderNav = (isMobile = false) => (
    <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
      <div className="px-3 pb-2 pt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
        Enterprise Administration
      </div>
      {adminLinks.map((link) => (
        <NavLink
          key={link.name}
          to={link.path}
          end={link.path === '/admin/dashboard'}
          onClick={() => isMobile && setIsSidebarOpen(false)}
          className={({ isActive }) =>
            `group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
              isActive
                ? 'bg-primary text-white shadow-sm shadow-primary/30'
                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <AppIcon
                name={link.icon}
                className={`h-4 w-4 shrink-0 transition-colors ${
                  isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
                }`}
                strokeWidth={isActive ? 2.2 : 1.75}
              />
              <span className="truncate">{link.name}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className="app-shell bg-background">
      {/* Desktop Fixed Dark Navy Sidebar */}
      <aside className="sidebar-fixed hidden md:flex flex-col bg-navy text-white border-r border-slate-800 z-30 select-none">
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo.jpeg"
              alt="AgriHerd"
              className="h-9 w-9 rounded-xl object-cover shadow-sm ring-1 ring-white/10"
            />
            <div>
              <span className="text-lg font-bold tracking-tight text-white">AgriHerd</span>
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
                Enterprise Admin
              </span>
            </div>
          </div>
        </div>

        {renderNav(false)}

        <div className="p-3 border-t border-slate-800 shrink-0 space-y-1">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-800/40 border border-slate-700/50">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 font-bold text-xs">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">
                {user?.full_name || 'Administrator'}
              </p>
              <p className="text-[10px] text-emerald-400 font-medium">SUPER ADMIN</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/10 rounded-xl transition"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden animate-fadeIn">
          <button
            type="button"
            aria-label="Close"
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsSidebarOpen(false)}
          />
          <aside className="relative z-50 flex h-full w-72 max-w-[80vw] flex-col bg-navy text-white shadow-2xl">
            <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <img
                  src="/logo.jpeg"
                  alt="AgriHerd"
                  className="h-9 w-9 rounded-xl object-cover shadow-sm ring-1 ring-white/10"
                />
                <span className="text-lg font-bold tracking-tight text-white">AgriHerd Admin</span>
              </div>
              <button
                type="button"
                onClick={() => setIsSidebarOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {renderNav(true)}

            <div className="p-3 border-t border-slate-800 shrink-0">
              <button
                type="button"
                onClick={handleSignOut}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/10 rounded-xl transition"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="main-content-wrapper">
        <header className="header-fixed flex items-center justify-between px-4 sm:px-6 bg-white border-b border-gray-100 z-20">
          <div className="flex items-center gap-3">
            <BackButton fallbackPath="/admin/dashboard" compact />
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open navigation menu"
              className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
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
            {/* System Status Pill */}
            <div className="hidden lg:flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
              </span>
              <span>Systems Online</span>
            </div>

            <NotificationBell to="/admin/audit-logs" />

            <div className="h-4 w-px bg-gray-200 hidden sm:block" />

            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-navy text-white font-bold text-xs">
                {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="hidden sm:block text-left">
                <span className="block text-xs font-bold text-maintext leading-tight">
                  {user?.full_name || 'Admin'}
                </span>
                <span className="block text-[10px] font-semibold text-primary uppercase leading-tight">
                  Platform Admin
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSignOut}
              title="Sign Out"
              aria-label="Sign Out"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-rose-50 hover:text-error transition"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        <main className="content-scrollable">
          <div className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
          <Footer isAdmin={true} />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
