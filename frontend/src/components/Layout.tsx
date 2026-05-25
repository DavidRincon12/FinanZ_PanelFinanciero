import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import NotificationsOverlay from './NotificationsOverlay';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, title = "Dashboard" }) => {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar 
          title={title} 
          onToggleNotifications={() => setIsNotificationsOpen(true)} 
        />
        <main className="p-10">
          {children}
        </main>
      </div>
      <NotificationsOverlay 
        isOpen={isNotificationsOpen} 
        onClose={() => setIsNotificationsOpen(false)} 
      />
    </div>
  );
};

export default Layout;
