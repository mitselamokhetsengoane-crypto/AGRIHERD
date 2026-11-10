import { useState, useContext, useEffect } from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Footer from '../components/common/Footer';
import AppIcon from '../components/common/AppIcon';
import NotificationBell from '../components/common/NotificationBell';
import marketplaceService from '../services/marketplaceService';

const BuyerLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [cartCount, setCartCount] = useState(0);

  const handleLogout = () => { logout(); navigate('/login'); };

  useEffect(() => {
    let active = true;
    const loadCartCount = async () => {
      try {
        const cart = await marketplaceService.getCart();
        if (active) setCartCount(cart.item_count || 0);
      } catch (error) {
        console.error('Could not load cart count.', error);
      }
    };
    const handleCartChange = (event) => {
      setCartCount(event.detail?.itemCount || 0);
    };

    loadCartCount();
    window.addEventListener('marketplace-cart-updated', handleCartChange);
    return () => {
      active = false;
      window.removeEventListener('marketplace-cart-updated', handleCartChange);
    };
  }, []);

  // FIXED: All paths now correctly point to the /buyer/ prefix
  const navItems = [
    { name: 'Dashboard', path: '/buyer/dashboard', icon: 'dashboard' },
    { name: 'Marketplace', path: '/buyer/marketplace', icon: 'marketplace' },
    { name: 'My Cart', path: '/buyer/marketplace/cart', icon: 'cart' },
    { name: 'My Orders', path: '/buyer/marketplace/orders', icon: 'tasks' },
    { name: 'Notifications', path: '/buyer/notifications', icon: 'notification' },
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
                  `flex items-center gap-3 px-4 py-3 rounded-md transition-colors text-sm font-medium ${
                    isActive ? 'bg-primary text-white' : 'text-maintext hover:bg-background'
                  }`
                }>
                <AppIcon name={item.icon} className="h-5 w-5 shrink-0" />
                {item.name}
                {item.name === 'My Cart' && (
                  <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-xs">
                    {cartCount}
                  </span>
                )}
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
                    `flex items-center gap-3 px-4 py-3 rounded-md transition-colors text-sm font-medium ${
                      isActive ? 'bg-primary text-white' : 'text-maintext hover:bg-background'
                    }`
                  }>
                  <AppIcon name={item.icon} className="h-5 w-5 shrink-0" />
                  {item.name}
                  {item.name === 'My Cart' && (
                    <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-xs">
                      {cartCount}
                    </span>
                  )}
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
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden mr-4 text-subtext hover:text-primary" aria-label="Open navigation menu">
              <AppIcon name="menu" className="h-6 w-6" />
            </button>
            <img src="/logo.jpeg" alt="AgriHerd" className="h-10 w-8 rounded-full object-cover mr-2" />
            <h1 className="text-xl font-bold text-primary">Buyer Dashboard</h1>
          </div>
          <div className="flex items-center space-x-4">
            <NotificationBell to="/buyer/notifications" />
            <Link to="/buyer/profile" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm">
                {user?.full_name?.charAt(0) || <AppIcon name="profile" className="h-4 w-4" />}
              </div>
              <span className="hidden md:block text-sm font-medium text-maintext">{user?.full_name || 'Buyer'}</span>
            </Link>
            <button type="button" onClick={handleLogout} className="inline-flex items-center gap-2 text-error text-sm font-medium hover:underline">
              <AppIcon name="logout" className="h-4 w-4" /> Logout
            </button>
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