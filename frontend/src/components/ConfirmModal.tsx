import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Eliminar',
  cancelText = 'Cancelar',
  type = 'danger'
}) => {
  if (!isOpen) return null;

  const isWarning = type === 'warning';

  let iconBg = 'bg-red-50 text-red-600 border-red-100';
  let buttonBg = 'bg-red-600 hover:bg-red-700 shadow-red-100';
  let IconComponent = Trash2;

  if (isWarning) {
    iconBg = 'bg-amber-50 text-amber-600 border-amber-100';
    buttonBg = 'bg-amber-500 hover:bg-amber-600 shadow-amber-100';
    IconComponent = AlertTriangle;
  } else if (type === 'info') {
    iconBg = 'bg-blue-50 text-blue-600 border-blue-100';
    buttonBg = 'bg-[#4D5DFB] hover:bg-[#3B4AD9] shadow-indigo-100';
    IconComponent = AlertTriangle;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0" 
        onClick={onClose}
      />
      
      {/* Box */}
      <div className="card w-full max-w-sm p-6 bg-white rounded-2xl shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-200 border border-slate-100">
        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute right-4 top-4 text-[#94A3B8] hover:text-[#475569] transition-colors p-1.5 hover:bg-slate-100 rounded-lg"
        >
          <X size={16} />
        </button>

        {/* Content */}
        <div className="flex flex-col items-center text-center mt-3">
          {/* Circular Icon */}
          <div className={`w-14 h-14 rounded-full flex items-center justify-center border-2 mb-4 ${iconBg}`}>
            <IconComponent size={28} />
          </div>

          <h3 className="text-lg font-bold text-slate-800 mb-2">
            {title}
          </h3>
          <p className="text-sm text-[#64748B] mb-6 leading-relaxed">
            {message}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button 
            type="button" 
            onClick={onConfirm}
            className={`flex-1 text-white py-3 rounded-xl font-bold transition-all shadow-md active:scale-95 text-sm ${buttonBg}`}
          >
            {confirmText}
          </button>
          <button 
            type="button" 
            onClick={onClose}
            className="flex-1 border border-[#E2E8F0] text-[#64748B] py-3 rounded-xl font-semibold hover:bg-gray-50 transition-all text-sm active:scale-95"
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
