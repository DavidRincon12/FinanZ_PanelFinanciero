/**
 * Toast / Notification System
 * - useToast() hook for triggering toasts
 * - useConfirm() hook for custom confirm dialogs (replaces window.confirm)
 * - <ToastProvider> wraps the app
 */
import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X, Trash2, AlertCircle } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

interface ToastContextValue {
  toast: (type: ToastType, title: string, message?: string) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

// ─── Context ──────────────────────────────────────────────────────────────────
const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
};

// ─── Icon map ─────────────────────────────────────────────────────────────────
const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 size={20} />,
  error:   <XCircle size={20} />,
  warning: <AlertTriangle size={20} />,
  info:    <Info size={20} />,
};

const COLORS: Record<ToastType, { bg: string; icon: string; bar: string; border: string }> = {
  success: { bg: 'bg-white', icon: 'text-emerald-500', bar: 'bg-emerald-500', border: 'border-l-emerald-500' },
  error:   { bg: 'bg-white', icon: 'text-red-500',     bar: 'bg-red-500',     border: 'border-l-red-500' },
  warning: { bg: 'bg-white', icon: 'text-amber-500',   bar: 'bg-amber-500',   border: 'border-l-amber-500' },
  info:    { bg: 'bg-white', icon: 'text-blue-500',    bar: 'bg-blue-500',    border: 'border-l-blue-500' },
};

// ─── Toast Item ───────────────────────────────────────────────────────────────
const ToastItem = ({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) => {
  const c = COLORS[toast.type];
  return (
    <div
      className={`
        relative flex items-start gap-3 px-4 py-3.5 rounded-2xl shadow-xl
        border border-slate-100 border-l-4 ${c.border} ${c.bg}
        min-w-[280px] max-w-[360px] overflow-hidden
        animate-in slide-in-from-right-4 fade-in duration-300
      `}
      style={{ backdropFilter: 'blur(12px)' }}
    >
      {/* Progress bar */}
      <div
        className={`absolute bottom-0 left-0 h-0.5 ${c.bar} rounded-full`}
        style={{
          animation: 'toastProgress 4s linear forwards',
        }}
      />

      {/* Icon */}
      <span className={`mt-0.5 flex-shrink-0 ${c.icon}`}>{ICONS[toast.type]}</span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm text-slate-800 leading-snug">{toast.title}</p>
        {toast.message && (
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{toast.message}</p>
        )}
      </div>

      {/* Close */}
      <button
        onClick={() => onRemove(toast.id)}
        className="flex-shrink-0 text-slate-300 hover:text-slate-500 transition-colors mt-0.5"
      >
        <X size={16} />
      </button>
    </div>
  );
};

// ─── Confirm Dialog ───────────────────────────────────────────────────────────
interface ConfirmState extends ConfirmOptions {
  resolve: (value: boolean) => void;
}

const ConfirmDialog = ({ opts, onClose }: { opts: ConfirmState; onClose: (result: boolean) => void }) => {
  const handleClose = (result: boolean) => {
    onClose(result);
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ backdropFilter: 'blur(6px)', backgroundColor: 'rgba(15,23,42,0.35)' }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-slate-100"
        style={{ animation: 'confirmPop 0.22s ease' }}
      >
        {/* Icon */}
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${opts.danger ? 'bg-red-50' : 'bg-amber-50'}`}>
          {opts.danger
            ? <Trash2 size={22} className="text-red-500" />
            : <AlertCircle size={22} className="text-amber-500" />
          }
        </div>

        {/* Title */}
        <h3 className="font-bold text-slate-800 text-lg mb-1.5">{opts.title}</h3>
        <p className="text-sm text-slate-500 leading-relaxed mb-6">{opts.message}</p>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => handleClose(true)}
            className={`flex-1 py-3 rounded-xl font-bold text-sm text-white transition-all active:scale-95 shadow-md ${
              opts.danger
                ? 'bg-red-500 hover:bg-red-600 shadow-red-100'
                : 'bg-[#4D5DFB] hover:bg-[#3B4AD9] shadow-indigo-100'
            }`}
          >
            {opts.confirmLabel ?? 'Confirmar'}
          </button>
          <button
            onClick={() => handleClose(false)}
            className="flex-1 py-3 rounded-xl font-medium text-sm border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all"
          >
            {opts.cancelLabel ?? 'Cancelar'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Provider ─────────────────────────────────────────────────────────────────
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmOpts, setConfirmOpts] = useState<ConfirmState | null>(null);
  const counterRef = useRef(0);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = `t-${++counterRef.current}`;
    setToasts(prev => [...prev.slice(-4), { id, type, title, message }]);
    setTimeout(() => removeToast(id), 4200);
  }, [removeToast]);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise(resolve => {
      setConfirmOpts({ ...options, resolve });
    });
  }, []);

  const handleConfirmClose = (result: boolean) => {
    if (confirmOpts) confirmOpts.resolve(result);
    setConfirmOpts(null);
  };

  return (
    <ToastContext.Provider value={{ toast, confirm }}>
      {children}

      {/* Toast stack – bottom right */}
      <div className="fixed bottom-6 right-6 z-[9998] flex flex-col gap-2.5 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} onRemove={removeToast} />
          </div>
        ))}
      </div>

      {/* Confirm dialog */}
      {confirmOpts && (
        <ConfirmDialog opts={confirmOpts} onClose={handleConfirmClose} />
      )}

      {/* Keyframe animations */}
      <style>{`
        @keyframes toastProgress {
          from { width: 100%; }
          to   { width: 0%; }
        }
        @keyframes confirmPop {
          from { opacity: 0; transform: scale(0.92) translateY(10px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }
      `}</style>
    </ToastContext.Provider>
  );
};
