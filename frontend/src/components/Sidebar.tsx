import React from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, ArrowLeftRight, PiggyBank, Target, LogOut, Wallet, Tag, Settings, CreditCard } from 'lucide-react';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  to: string;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, to }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link 
      to={to}
      className={`
        flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer mb-2 group
        ${isActive 
          ? 'bg-[#4D5DFB] text-white shadow-lg shadow-indigo-200' 
          : 'text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#1E293B]'}
      `}
    >
      <span className={isActive ? 'text-white' : 'text-[#94A3B8] group-hover:text-[#4D5DFB] transition-colors'}>{icon}</span>
      <span className="font-medium text-[15px]">{label}</span>
    </Link>
  );
};

const Sidebar: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="w-[280px] bg-white h-screen border-r border-[#E2E8F0] flex flex-col p-6 sticky top-0">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-10 px-2">
        <div className="w-10 h-10 bg-[#4D5DFB] rounded-xl flex items-center justify-center text-white">
          <Wallet size={24} />
        </div>
        <span className="text-2xl font-bold text-[#1E293B]">FinanZ</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1">
        <NavItem icon={<LayoutDashboard size={20} />} label="Panel principal" to="/dashboard" />
        <NavItem icon={<ArrowLeftRight size={20} />} label="Transacciones" to="/transactions" />
        <NavItem icon={<Tag size={20} />} label="Categorías" to="/categories" />
        <NavItem icon={<PiggyBank size={20} />} label="Presupuesto" to="/budgets" />
        <NavItem icon={<Target size={20} />} label="Metas" to="/goals" />
        <NavItem icon={<CreditCard size={20} />} label="Suscripciones" to="/subscriptions" />
        <NavItem icon={<Settings size={20} />} label="Ajustes" to="/profile" />
      </nav>

      {/* Footer Info / Logout */}
      <div className="mt-auto px-2 border-t border-[#F1F5F9] pt-6">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-[#64748B] hover:bg-red-50 hover:text-red-600 group"
        >
          <LogOut size={20} className="group-hover:text-red-600 transition-colors" />
          <span className="font-medium text-[15px]">Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
