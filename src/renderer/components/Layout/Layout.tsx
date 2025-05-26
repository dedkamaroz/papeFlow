import React from 'react';
import { Menu, ChevronLeft, ChevronRight } from 'lucide-react';
import Sidebar from './Sidebar';
import Toolbar from './Toolbar';
import { useAppStore } from '@renderer/stores/appStore';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { sidebarOpen, setSidebarOpen } = useAppStore();
  
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <div 
        className={`${
          sidebarOpen ? 'w-64' : 'w-0'
        } transition-all duration-300 ease-in-out bg-white shadow-lg relative`}
      >
        {sidebarOpen && <Sidebar />}
        
        {/* Sidebar toggle button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute -right-3 top-20 bg-white rounded-full p-1 shadow-md hover:shadow-lg transition-shadow z-10"
        >
          {sidebarOpen ? (
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-600" />
          )}
        </button>
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <Toolbar />
        
        {/* Content area */}
        <main className="flex-1 relative overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;