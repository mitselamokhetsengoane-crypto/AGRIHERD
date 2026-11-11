import { useState, useContext, useEffect } from 'react';
import { Outlet, NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Footer from '../components/common/Footer';
import AppIcon from '../components/common/AppIcon';
import NotificationBell from '../components/common/NotificationBell';
import BackButton from '../components/common/BackButton';
import marketplaceService from '../services/marketplaceService';
import { Menu, LogOut, ShoppingCart, UserRound, X } from 'lucide-react';

const buyerRouteTitles = {
  '/buyer/dashboard': 'Buyer Portal',
  '/buyer/marketplace': 'Browse Agricultural Marketplace',
  '/buyer/marketplace/cart': 'My Shopping Cart',
  '/buyer/marketplace/checkout': 'Checkout & Payment',
  '/buyer/marketplace/orders': 'My Purchase Orders',
  '/buyer/notifications': 'Notifications',
  '/buyer/profile': 'Buyer Profile',
};

const BuyerLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [cartCount, setCartCount] = useState(0);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

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

  const navItems = [
    { name: 'Dashboard', path: '/buyer/dashboard', icon: 'dashboard' },
    { name: 'Marketplace', path: '/buyer/marketplace', icon: 'marketplace' },
    { name: 'My Orders', path: '/buyer/marketplace/orders', icon: 'tasks' },
    { name: 'Shopping Cart', path: '/buyer/marketplace/cart', icon: 'cart', badge: cartCount },
    { name: 'Notifications', path: '/buyer/notifications', icon: 'notification' },
    { name: 'Profile', path: '/buyer/profile', icon: 'profile' },
  ];

  const currentTitle = buyerRouteTitles[location.pathname] || 'Marketplace Buyer';

  const renderNavLinks = (isMobile = false) => (
    <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
      {navItems.map((item) => (
        <NavLink
          key={item.name}
          to={item.path}
          end={item.path === '/buyer/dashboard'}
          onClick={() => isMobile && setIsSidebarOpen(false)}
          className={({ isActive }) =>
            `group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
              isActive
                ? 'bg-secondary text-white shadow-sm shadow-secondary/20'
                : 'text-maintext hover:bg-gray-50 hover:text-secondary'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <div className="flex items-center gap-3 truncate">
                <AppIcon
                  name={item.icon}
                  className={`h-4 w-4 shrink-0 transition-colors ${
                    isActive ? 'text-white' : 'text-subtext group-hover:text-secondary'
                  }`}
                  strokeWidth={isActive ? 2.2 : 1.75}
                />
                <span className="truncate">{item.name}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className={`ml-2 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                    isActive ? 'bg-white text-secondary' : 'bg-secondary-light text-secondary'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className="app-shell bg-background">
      {/* Desktop Fixed Sidebar */}
      <div className="sidebar-fixed hidden md:block bg-white border-r border-gray-100">
        <aside className="flex flex-col h-full bg-white select-none">
          <div className="h-16 flex items-center justify-between px-5 border-b border-gray-100 shrink-0">
            <div className="flex items-center gap-2.5">
              <img
                src="/logo.jpeg"
                alt="AgriHerd"
                className="h-9 w-9 rounded-xl object-cover shadow-sm ring-1 ring-secondary/10"
              />
              <div>
                <span className="text-lg font-bold tracking-tight text-secondary">AgriHerd</span>
                <span className="block text-[10px] font-semibold uppercase tracking-wider text-subtext">
                  Buyer Portal
                </span>
              </div>
            </div>
          </div>

          {renderNavLinks(false)}

          <div className="p-3 border-t border-gray-100 shrink-0 space-y-1">
            <NavLink
              to="/buyer/profile"
              className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-secondary font-bold text-xs">
                {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'B'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-maintext truncate">
                  {user?.full_name || 'Buyer'}
                </p>
                <p className="text-[11px] text-subtext truncate">{user?.email || 'buyer@agriherd.com'}</p>
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
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden animate-fadeIn">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsSidebarOpen(false)}
          />
          <aside className="relative flex flex-col w-72 max-w-[80vw] bg-white h-full z-50 shadow-2xl">
            <div className="h-16 flex items-center justify-between px-5 border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <img
                  src="/logo.jpeg"
                  alt="AgriHerd"
                  className="h-9 w-9 rounded-xl object-cover shadow-sm ring-1 ring-secondary/10"
                />
                <span className="text-lg font-bold tracking-tight text-secondary">AgriHerd</span>
              </div>
              <button
                type="button"
                onClick={() => setIsSidebarOpen(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {renderNavLinks(true)}

            <div className="p-3 border-t border-gray-100 shrink-0">
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
        </div>
      )}

      {/* Main Content Area */}
      <div className="main-content-wrapper">
        <header className="header-fixed flex items-center justify-between px-4 sm:px-6 bg-white border-b border-gray-100 z-20">
          <div className="flex items-center gap-3">
            <BackButton fallbackPath="/buyer/dashboard" compact />
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 focus:outline-none"
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-base sm:text-lg font-bold text-maintext">
              {currentTitle}
            </h1>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              to="/buyer/marketplace/cart"
              className="relative inline-flex items-center justify-center rounded-lg p-2 text-subtext hover:bg-gray-50 hover:text-secondary transition"
              aria-label="Shopping Cart"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-secondary px-1 text-[10px] font-bold text-white">
                  {cartCount}
                </span>
              )}
            </Link>

            <NotificationBell to="/buyer/notifications" />

            <div className="h-4 w-px bg-gray-200 hidden sm:block" />

            <Link
              to="/buyer/profile"
              className="flex items-center gap-2 rounded-lg p-1 hover:bg-gray-50 transition"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary/10 text-secondary font-bold text-xs ring-2 ring-secondary/10">
                {user?.full_name ? user.full_name.charAt(0).toUpperCase() : <UserRound className="h-4 w-4" />}
              </div>
              <div className="hidden sm:block text-left">
                <span className="block text-xs font-bold text-maintext leading-tight">
                  {user?.full_name || 'Buyer'}
                </span>
                <span className="block text-[11px] text-subtext leading-tight">
                  BUYER
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

        <main className="content-scrollable">
          <div className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
};

export default BuyerLayout;
