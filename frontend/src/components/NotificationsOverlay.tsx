import React from 'react';
import { X, AlertTriangle, AlertCircle, Trash2, CheckCircle2 } from 'lucide-react';

interface NotificationItemProps {
  type: 'danger' | 'warning';
  title: string;
  message: string;
  spent: string;
  limit: string;
  date: string;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ type, title, message, spent, limit, date }) => {
  const isDanger = type === 'danger';
  return (
    <div className={`p-4 rounded-xl border mb-3 ${isDanger ? 'bg-red-50 border-red-100' : 'bg-orange-50 border-orange-100'} transition-all hover:shadow-md`}>
      <div className="flex gap-3 mb-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isDanger ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
          {isDanger ? <AlertCircle size={18} /> : <AlertTriangle size={18} />}
        </div>
        <div>
          <h4 className={`text-sm font-bold ${isDanger ? 'text-red-700' : 'text-orange-700'}`}>{title}</h4>
          <p className="text-xs text-[#64748B] mt-0.5">{message}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-2 mb-4 px-1">
        <span className={`text-xs font-bold ${isDanger ? 'text-red-600' : 'text-orange-600'}`}>${spent}</span>
        <span className="text-[10px] text-[#94A3B8] font-medium">(Límite ${limit})</span>
        <span className="text-[10px] text-[#94A3B8] ml-auto">{date}</span>
      </div>

      <div className="flex gap-2">
        <button className="flex-1 py-1.5 bg-white border border-[#E2E8F0] rounded-lg text-[10px] font-bold text-[#475569] flex items-center justify-center gap-1.5 hover:bg-gray-50 transition-colors">
          <CheckCircle2 size={12} className="text-emerald-500" /> Leído
        </button>
        <button className="flex-1 py-1.5 bg-white border border-[#E2E8F0] rounded-lg text-[10px] font-bold text-[#475569] flex items-center justify-center gap-1.5 hover:bg-gray-50 transition-colors">
          <Trash2 size={12} className="text-red-500" /> Eliminar
        </button>
      </div>
    </div>
  );
};

interface NotificationsOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationsOverlay: React.FC<NotificationsOverlayProps> = ({ isOpen, onClose }) => {
  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/10 backdrop-blur-[2px] z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
        onClick={onClose}
      />

      {/* Drawer */}
      <div className={`fixed top-0 right-0 h-screen w-full sm:w-[380px] bg-white shadow-[-10px_0_30px_rgba(0,0,0,0.05)] z-50 transform transition-transform duration-300 ease-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6 border-b border-[#F1F5F9] flex justify-between items-center bg-[#F8FAFC]">
          <div>
            <h2 className="text-lg font-bold text-[#1E293B]">Notificaciones</h2>
            <p className="text-xs text-[#64748B] font-medium mt-0.5">3 sin leer</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[#E2E8F0] rounded-lg transition-colors text-[#64748B]">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
          <NotificationItem 
            type="danger" 
            title="Límite Alcanzado: Compras" 
            message="Has alcanzado el límite de Compras este mes" 
            spent="525.000" 
            limit="500.000" 
            date="31/03/2026 4:26" 
          />
          <NotificationItem 
            type="warning" 
            title="Advertencia: Comida" 
            message="Estás por alcanzar el límite de Comida este mes" 
            spent="450.000" 
            limit="500.000" 
            date="31/03/2026 3:30" 
          />
          <NotificationItem 
            type="warning" 
            title="Advertencia: Transporte" 
            message="Estás por alcanzar el límite de Transporte este mes" 
            spent="120.000" 
            limit="150.000" 
            date="30/03/2026 10:30" 
          />
          <NotificationItem 
            type="danger" 
            title="Límite Alcanzado: Compras" 
            message="Has alcanzado el límite de Compras este mes" 
            spent="525.000" 
            limit="500.000" 
            date="31/03/2026 4:26" 
          />
        </div>

        <div className="p-4 border-t border-[#F1F5F9] bg-[#F8FAFC]">
          <button className="w-full py-3 bg-white border border-[#E2E8F0] text-[#EF4444] rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-red-50 transition-all active:scale-[0.98]">
            <Trash2 size={16} /> Limpiar toda la bandeja
          </button>
        </div>
      </div>
    </>
  );
};

export default NotificationsOverlay;
