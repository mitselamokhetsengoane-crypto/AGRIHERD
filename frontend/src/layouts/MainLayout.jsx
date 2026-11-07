import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/common/Sidebar';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';

const MainLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="app-shell bg-background">
      {/* Fixed Sidebar */}
      <div className="sidebar-fixed hidden md:block bg-white border-r border-gray-200">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setIsSidebarOpen(false)}></div>
          <div className="relative flex flex-col w-64 bg-white h-full z-50">
            <Sidebar closeMobile={() => setIsSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="main-content-wrapper">
        <div className="header-fixed bg-white border-b border-gray-200">
          <Navbar toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        </div>
        
        <main className="content-scrollable">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default MainLayout;