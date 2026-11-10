import { useState, useContext } from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Footer from '../components/common/Footer';

const BuyerLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  // FIXED: All paths now correctly point to the /buyer/ prefix
  const navItems = [
    { name: 'Dashboard', path: '/buyer/dashboard' },
    { name: 'Marketplace', path: '/buyer/marketplace' },
    { name: 'My Cart', path: '/buyer/marketplace/cart' },
    { name: 'My Orders', path: '/buyer/marketplace/orders' },
  ];

  return (
    <div className="app-shell bg-background">
      <div className="sidebar-fixed hidden md:block bg-white border-r border-gray-200">
        <aside className="w-64 bg-white shadow-md flex flex-col h-full">
          <div className="h-16 flex items-center justify-center gap-2 border-b border-gray-100">
            <img src="/logo.jpeg" alt="AgriHerd" className="h-12 w-10 rounded-full object-cover" />
            <h2 className="text-2xl font-bold text-primary tracking-wide">AgriHerd</h2>
          </div>
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <NavLink key={item.name} to={item.path}
                className={({ isActive }) =>
                  `block px-4 py-3 rounded-md transition-colors text-sm font-medium ${
                    isActive ? 'bg-primary text-white' : 'text-maintext hover:bg-background'
                  }`
                }>
                {item.name}
              </NavLink>
            ))}
          </nav>
          <div className="p-4 border-t border-gray-100">
            <button type="button" onClick={handleLogout} className="text-sm text-error hover:underline">Logout</button>
          </div>
        </aside>
      </div>

      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setIsSidebarOpen(false)}></div>
          <div className="relative flex flex-col w-64 bg-white h-full z-50">
            <div className="h-16 flex items-center justify-center gap-2 border-b border-gray-100">
              <img src="/logo.jpeg" alt="AgriHerd" className="h-12 w-10 rounded-full object-cover" />
              <h2 className="text-2xl font-bold text-primary tracking-wide">AgriHerd</h2>
            </div>
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {navItems.map((item) => (
                <NavLink key={item.name} to={item.path} onClick={() => setIsSidebarOpen(false)}
                  className={({ isActive }) =>
                    `block px-4 py-3 rounded-md transition-colors text-sm font-medium ${
                      isActive ? 'bg-primary text-white' : 'text-maintext hover:bg-background'
                    }`
                  }>
                  {item.name}
                </NavLink>
              ))}
            </nav>
            <div className="p-4 border-t border-gray-100">
              <button type="button" onClick={handleLogout} className="text-sm text-error hover:underline">Logout</button>
            </div>
          </div>
        </div>
      )}

      <div className="main-content-wrapper">
        <header className="header-fixed bg-white shadow-sm h-16 flex items-center justify-between px-4 md:px-6 z-10">
          <div className="flex items-center">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden mr-4 text-subtext hover:text-primary">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </button>
            <img src="/logo.jpeg" alt="AgriHerd" className="h-10 w-8 rounded-full object-cover mr-2" />
            <h1 className="text-xl font-bold text-primary">Buyer Dashboard</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Link to="/buyer/profile" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm">
                {user?.full_name?.charAt(0) || 'B'}
              </div>
              <span className="hidden md:block text-sm font-medium text-maintext">{user?.full_name || 'Buyer'}</span>
            </Link>
            <button type="button" onClick={handleLogout} className="text-error text-sm font-medium hover:underline">Logout</button>
          </div>
        </header>
        <main className="content-scrollable">
          <div className="max-w-7xl mx-auto"><Outlet /></div>
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default BuyerLayout;