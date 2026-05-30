import React from 'react';
import { X, AlertTriangle, AlertCircle, Trash2, CheckCircle2, Info } from 'lucide-react';
import type { AppNotification } from '../services/api';

interface NotificationItemProps {
  notification: AppNotification;
  onMarkRead: (id: number) => void;
  onDelete: (id: number) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onMarkRead, onDelete }) => {
  const { id, title, message, type, is_read, created_at } = notification;
  
  const isCritical = type === 'critical';
  const isWarning = type === 'warning';
  
  let bgClass = 'bg-blue-50 border-blue-100';
  let textClass = 'text-blue-700';
  let iconBgClass = 'bg-blue-100 text-blue-600';
  let IconComponent = Info;
  
  if (isCritical) {
    bgClass = 'bg-red-50 border-red-100';
    textClass = 'text-red-700';
    iconBgClass = 'bg-red-100 text-red-600';
    IconComponent = AlertCircle;
  } else if (isWarning) {
    bgClass = 'bg-orange-50 border-orange-100';
    textClass = 'text-orange-700';
    iconBgClass = 'bg-orange-100 text-orange-600';
    IconComponent = AlertTriangle;
  }
  
  const formattedDate = new Date(created_at).toLocaleString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={`p-4 rounded-xl border mb-3 ${bgClass} transition-all hover:shadow-md ${is_read ? 'opacity-55 border-slate-100 !bg-slate-50' : ''}`}>
      <div className="flex gap-3 mb-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${is_read ? 'bg-slate-200 text-slate-500' : iconBgClass}`}>
          <IconComponent size={18} />
        </div>
        <div className="flex-1">
          <h4 className={`text-sm font-bold ${is_read ? 'text-slate-600' : textClass} flex items-center gap-2`}>
            {title}
            {!is_read && <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block animate-pulse shrink-0"></span>}
          </h4>
          <p className={`text-xs mt-0.5 ${is_read ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>{message}</p>
        </div>
      </div>
      
      <div className="flex items-center justify-between mb-4 px-1">
        <span className="text-[10px] text-[#94A3B8] font-medium">{formattedDate}</span>
      </div>

      <div className="flex gap-2">
        {!is_read && (
          <button 
            onClick={() => onMarkRead(id)}
            className="flex-1 py-1.5 bg-white border border-[#E2E8F0] rounded-lg text-[10px] font-bold text-[#475569] flex items-center justify-center gap-1.5 hover:bg-gray-50 transition-colors"
          >
            <CheckCircle2 size={12} className="text-emerald-500" /> Leído
          </button>
        )}
        <button 
          onClick={() => onDelete(id)}
          className="flex-1 py-1.5 bg-white border border-[#E2E8F0] rounded-lg text-[10px] font-bold text-[#475569] flex items-center justify-center gap-1.5 hover:bg-gray-50 transition-colors"
        >
          <Trash2 size={12} className="text-red-500" /> Eliminar
        </button>
      </div>
    </div>
  );
};

interface NotificationsOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  unreadCount: number;
  onMarkRead: (id: number) => void;
  onDelete: (id: number) => void;
  onClearAll: () => void;
}

const NotificationsOverlay: React.FC<NotificationsOverlayProps> = ({ 
  isOpen, 
  onClose, 
  notifications, 
  unreadCount, 
  onMarkRead, 
  onDelete, 
  onClearAll 
}) => {
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
            <p className="text-xs text-[#64748B] font-medium mt-0.5">{unreadCount === 0 ? 'Sin notificaciones pendientes' : `${unreadCount} sin leer`}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[#E2E8F0] rounded-lg transition-colors text-[#64748B]">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
          {notifications.length > 0 ? (
            notifications.map(notif => (
              <NotificationItem 
                key={notif.id}
                notification={notif}
                onMarkRead={onMarkRead}
                onDelete={onDelete}
              />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 text-[#94A3B8]">
              <Info size={48} className="mb-3 opacity-40" />
              <p className="text-sm font-semibold">Bandeja vacía</p>
              <p className="text-xs mt-1">No tienes alertas o notificaciones por ahora.</p>
            </div>
          )}
        </div>

        {notifications.length > 0 && (
          <div className="p-4 border-t border-[#F1F5F9] bg-[#F8FAFC]">
            <button 
              onClick={onClearAll}
              className="w-full py-3 bg-white border border-[#E2E8F0] text-[#EF4444] rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-red-50 transition-all active:scale-[0.98]"
            >
              <Trash2 size={16} /> Limpiar toda la bandeja
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default NotificationsOverlay;
