import React from 'react';
import { Link } from 'react-router-dom';
import { Bell, User } from 'lucide-react';

interface TopbarProps {
  title: string;
  onToggleNotifications: () => void;
  unreadCount?: number;
}

const Topbar: React.FC<TopbarProps> = ({ title, onToggleNotifications, unreadCount = 0 }) => {
  return (
    <header className="h-[80px] bg-white border-b border-[#E2E8F0] flex items-center justify-between px-10 sticky top-0 z-10">
      <h1 className="text-xl font-semibold text-[#1E293B]">{title}</h1>
      
      <div className="flex items-center gap-6">
        {/* Notifications */}
        <div 
          onClick={onToggleNotifications}
          className="relative cursor-pointer p-2 hover:bg-[#F8FAFC] rounded-lg transition-colors group"
        >
          <Bell size={22} className="text-[#64748B] group-hover:text-[#4D5DFB] transition-colors" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-[18px] h-[18px] bg-[#EF4444] text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
              {unreadCount}
            </span>
          )}
        </div>

        {/* User Profile */}
        <Link to="/profile" className="flex items-center gap-3 cursor-pointer p-1 hover:bg-[#F8FAFC] rounded-lg transition-colors group">
          <div className="w-10 h-10 bg-[#4D5DFB] rounded-full flex items-center justify-center text-white ring-4 ring-[#E0E7FF] group-hover:ring-[#C7D2FE] transition-all">
            <User size={22} />
          </div>
        </Link>
      </div>
    </header>
  );
};

export default Topbar;
