import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import AnimatedPage from '../components/AnimatedPage';
import { useToast } from '../components/Toast';
import { fmtMoney } from '../utils/format';
import api from '../services/api';
import type { SavingsGoal } from '../services/api';
import {
  Plus, Target, Loader2, X, DollarSign, Calendar,
  CheckCircle2, Clock, Pause, Trash2, PiggyBank, ChevronRight,
  Sparkles, TrendingUp, Pencil
} from 'lucide-react';

// ─── Emoji Picker ─────────────────────────────────────────────────────────────
const GOAL_ICONS = ['🎯','🏠','🚗','✈️','🎓','💍','🏖️','💻','📱','🎮','🏋️','🐶','🍕','⛷️','🛳️','🎸','📷','👶','🏡','💎'];

// ─── Status badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }: { status: SavingsGoal['status'] }) => {
  const map = {
    active:    { label: 'Activa',     icon: <Clock size={12} />,        cls: 'bg-blue-100 text-blue-700' },
    completed: { label: 'Completada', icon: <CheckCircle2 size={12} />, cls: 'bg-emerald-100 text-emerald-700' },
    paused:    { label: 'Pausada',    icon: <Pause size={12} />,         cls: 'bg-amber-100 text-amber-700' },
  };
  const s = map[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.cls}`}>
      {s.icon} {s.label}
    </span>
  );
};

// ─── Progress Ring ────────────────────────────────────────────────────────────
const ProgressRing = ({ percent, size = 80, icon, completed }: {
  percent: number; size?: number; icon: string; completed: boolean;
}) => {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const prog = Math.min(percent, 100);
  const strokeDash = (prog / 100) * circ;
  const color = completed ? '#10B981' : percent > 75 ? '#F59E0B' : '#4D5DFB';

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E2E8F0" strokeWidth={8} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={8}
          strokeDasharray={`${strokeDash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-2xl">
        {icon}
      </div>
    </div>
  );
};

// ─── Goal Card ────────────────────────────────────────────────────────────────
const GoalCard = ({
  goal, onDeposit, onDelete, onEdit,
}: {
  goal: SavingsGoal;
  onDeposit: (g: SavingsGoal) => void;
  onDelete: (id: number) => void;
  onEdit: (g: SavingsGoal) => void;
}) => {
  // DRF returns DecimalField as strings — parse to float for display
  const percent   = parseFloat(String(goal.progress_percent));
  const completed = goal.status === 'completed';
  const color     = completed ? '#10B981' : percent > 75 ? '#F59E0B' : '#4D5DFB';

  return (
    <div className={`card !p-6 flex flex-col gap-4 hover:shadow-lg transition-all duration-300 ${completed ? 'border border-emerald-200' : ''}`}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4 min-w-0">
          <ProgressRing percent={percent} icon={goal.icon || '🎯'} completed={completed} />
          <div className="min-w-0">
            <h3 className="font-bold text-[#1E293B] text-base leading-tight truncate">{goal.name}</h3>
            {goal.description && (
              <p className="text-xs text-[#94A3B8] mt-0.5 truncate">{goal.description}</p>
            )}
            <div className="mt-1.5">
              <StatusBadge status={goal.status} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
          <button
            onClick={() => onEdit(goal)}
            className="text-[#CBD5E1] hover:text-[#4D5DFB] transition-colors p-1.5 rounded-lg hover:bg-indigo-50"
            title="Editar meta"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={() => onDelete(goal.id)}
            className="text-[#CBD5E1] hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-50"
            title="Eliminar meta"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-xs font-semibold text-[#64748B] mb-1.5">
          <span>{fmtMoney(parseFloat(String(goal.current_amount)))}</span>
          <span className="text-[#94A3B8]">de {fmtMoney(parseFloat(String(goal.target_amount)))}</span>
        </div>
        <div className="w-full bg-[#F1F5F9] rounded-full h-2 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${Math.min(percent, 100)}%`, backgroundColor: color }}
          />
        </div>
        <div className="flex justify-between items-center mt-2">
          <span className="text-xl font-extrabold" style={{ color }}>
            {percent.toFixed(1)}%
          </span>
          {!completed && (
            <span className="text-xs text-[#94A3B8]">
              Faltan {fmtMoney(parseFloat(String(goal.remaining_amount)))}
            </span>
          )}
        </div>
      </div>

      {/* Deadline */}
      {goal.deadline && (
        <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
          <Calendar size={13} />
          <span>
            {new Date(goal.deadline + 'T00:00:00').toLocaleDateString('es-CO', {
              day: '2-digit', month: 'long', year: 'numeric',
            })}
          </span>
        </div>
      )}

      {/* Actions */}
      {!completed ? (
        <button
          onClick={() => onDeposit(goal)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white transition-all active:scale-95 shadow-md hover:shadow-lg"
          style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)` }}
        >
          <Plus size={16} /> Abonar dinero
        </button>
      ) : (
        <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-sm">
          <Sparkles size={16} /> ¡Meta alcanzada!
        </div>
      )}
    </div>
  );
};

// ─── Create Goal Modal ────────────────────────────────────────────────────────
const CreateGoalModal = ({
  onClose, onCreated,
}: {
  onClose: () => void;
  onCreated: (g: SavingsGoal) => void;
}) => {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [icon, setIcon] = useState('🎯');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g, '');
    if (!v) { setTargetAmount(''); return; }
    setTargetAmount(new Intl.NumberFormat('de-DE').format(parseInt(v)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim() || !targetAmount) {
      setError('Nombre y monto son obligatorios.');
      return;
    }
    const numeric = parseFloat(targetAmount.replace(/\./g, ''));
    setIsLoading(true);
    try {
      const goal = await api.createGoal({
        name: name.trim(),
        description: description.trim(),
        icon,
        target_amount: numeric,
        deadline: deadline || null,
      });
      toast('success', '¡Meta creada!', `"${goal.name}" fue creada correctamente.`);
      onCreated(goal);
    } catch (err: any) {
      setError(err.message || 'Error al crear la meta');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backdropFilter: 'blur(8px)', backgroundColor: 'rgba(15,23,42,0.4)' }}
    >
      <div className="card w-full max-w-lg p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
        style={{ animation: 'confirmPop 0.22s ease' }}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-[#1E293B] flex items-center gap-2">
            <Target className="text-[#4D5DFB]" size={22} /> Nueva Meta
          </h2>
          <button onClick={onClose} className="text-[#94A3B8] hover:text-[#475569] transition-colors p-1">
            <X size={22} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Icon picker */}
          <div>
            <label className="block text-sm font-bold text-[#1E293B] mb-2">Ícono</label>
            <div className="grid grid-cols-10 gap-1.5">
              {GOAL_ICONS.map(em => (
                <button key={em} type="button" onClick={() => setIcon(em)}
                  className={`text-xl p-1.5 rounded-lg transition-all ${
                    icon === em ? 'bg-indigo-100 scale-110 ring-2 ring-indigo-400' : 'hover:bg-slate-100'
                  }`}>
                  {em}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-bold text-[#1E293B] mb-2">Nombre *</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="Ej: Fondo de emergencia, Viaje a Europa…"
              className="w-full px-4 py-3 bg-gray-50 border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#4D5DFB] transition-all"
              autoFocus required />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-bold text-[#1E293B] mb-2">Descripción (opcional)</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              placeholder="¿Para qué es esta meta?"
              rows={2}
              className="w-full px-4 py-3 bg-gray-50 border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#4D5DFB] transition-all resize-none" />
          </div>

          {/* Target Amount */}
          <div>
            <label className="block text-sm font-bold text-[#1E293B] mb-2">Monto objetivo *</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]">
                <DollarSign size={18} />
              </div>
              <input type="text" value={targetAmount} onChange={handleAmountChange}
                placeholder="0"
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#4D5DFB] transition-all text-lg font-bold text-slate-700"
                required />
            </div>
          </div>

          {/* Deadline */}
          <div>
            <label className="block text-sm font-bold text-[#1E293B] mb-2">Fecha límite (opcional)</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]">
                <Calendar size={18} />
              </div>
              <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#4D5DFB] transition-all uppercase text-xs font-bold text-[#64748B]" />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={isLoading}
              className="flex-1 py-3.5 bg-[#4D5DFB] text-white font-bold rounded-xl hover:bg-[#3B4AD9] transition-all disabled:opacity-50 shadow-lg shadow-indigo-200">
              {isLoading ? 'Creando…' : 'Crear Meta'}
            </button>
            <button type="button" onClick={onClose}
              className="flex-1 py-3.5 border border-[#E2E8F0] text-[#64748B] font-medium rounded-xl hover:bg-gray-50 transition-all">
              Cancelar
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes confirmPop {
          from { opacity:0; transform: scale(0.94) translateY(12px); }
          to   { opacity:1; transform: scale(1)    translateY(0); }
        }
      `}</style>
    </div>
  );
};

// ─── Edit Goal Modal ──────────────────────────────────────────────────────────
const EditGoalModal = ({
  goal, onClose, onUpdated,
}: {
  goal: SavingsGoal;
  onClose: () => void;
  onUpdated: (g: SavingsGoal) => void;
}) => {
  const { toast } = useToast();
  const [name, setName] = useState(goal.name);
  const [description, setDescription] = useState(goal.description || '');
  const [targetAmount, setTargetAmount] = useState(new Intl.NumberFormat('de-DE').format(Math.round(parseFloat(String(goal.target_amount)))));
  const [deadline, setDeadline] = useState(goal.deadline || '');
  const [icon, setIcon] = useState(goal.icon || '🎯');
  const [status, setStatus] = useState<SavingsGoal['status']>(goal.status);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g, '');
    if (!v) { setTargetAmount(''); return; }
    setTargetAmount(new Intl.NumberFormat('de-DE').format(parseInt(v)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim() || !targetAmount) {
      setError('Nombre y monto son obligatorios.');
      return;
    }
    const numeric = parseFloat(targetAmount.replace(/\./g, ''));
    setIsLoading(true);
    try {
      const updated = await api.updateGoal(goal.id, {
        name: name.trim(),
        description: description.trim(),
        icon,
        target_amount: numeric,
        deadline: deadline || null,
        status,
      });
      toast('success', '¡Meta actualizada!', `"${updated.name}" fue actualizada correctamente.`);
      onUpdated(updated);
    } catch (err: any) {
      setError(err.message || 'Error al actualizar la meta');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backdropFilter: 'blur(8px)', backgroundColor: 'rgba(15,23,42,0.4)' }}
    >
      <div className="card w-full max-w-lg p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
        style={{ animation: 'confirmPop 0.22s ease' }}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-[#1E293B] flex items-center gap-2">
            <Target className="text-[#4D5DFB]" size={22} /> Editar Meta
          </h2>
          <button onClick={onClose} className="text-[#94A3B8] hover:text-[#475569] transition-colors p-1">
            <X size={22} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Icon picker */}
          <div>
            <label className="block text-sm font-bold text-[#1E293B] mb-2">Ícono</label>
            <div className="grid grid-cols-10 gap-1.5">
              {GOAL_ICONS.map(em => (
                <button key={em} type="button" onClick={() => setIcon(em)}
                  className={`text-xl p-1.5 rounded-lg transition-all ${
                    icon === em ? 'bg-indigo-100 scale-110 ring-2 ring-indigo-400' : 'hover:bg-slate-100'
                  }`}>
                  {em}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-bold text-[#1E293B] mb-2">Nombre *</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="Ej: Fondo de emergencia, Viaje a Europa…"
              className="w-full px-4 py-3 bg-gray-50 border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#4D5DFB] transition-all"
              required />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-bold text-[#1E293B] mb-2">Descripción (opcional)</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              placeholder="¿Para qué es esta meta?"
              rows={2}
              className="w-full px-4 py-3 bg-gray-50 border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#4D5DFB] transition-all resize-none" />
          </div>

          {/* Target Amount */}
          <div>
            <label className="block text-sm font-bold text-[#1E293B] mb-2">Monto objetivo *</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]">
                <DollarSign size={18} />
              </div>
              <input type="text" value={targetAmount} onChange={handleAmountChange}
                placeholder="0"
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#4D5DFB] transition-all text-lg font-bold text-slate-700"
                required />
            </div>
          </div>

          {/* Deadline */}
          <div>
            <label className="block text-sm font-bold text-[#1E293B] mb-2">Fecha límite (opcional)</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]">
                <Calendar size={18} />
              </div>
              <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#4D5DFB] transition-all uppercase text-xs font-bold text-[#64748B]" />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-bold text-[#1E293B] mb-2">Estado de la meta</label>
            <div className="flex gap-2">
              {(['active', 'completed', 'paused'] as const).map(s => {
                const label = s === 'active' ? 'Activa' : s === 'completed' ? 'Completada' : 'Pausada';
                const colorClass = s === 'active' ? 'border-blue-200 bg-blue-50 text-blue-700' : s === 'completed' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700';
                const isActive = status === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    className={`flex-1 py-3 px-3 text-xs font-bold border rounded-xl transition-all cursor-pointer text-center ${
                      isActive ? colorClass + ' ring-2 ring-indigo-400' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={isLoading}
              className="flex-1 py-3.5 bg-[#4D5DFB] text-white font-bold rounded-xl hover:bg-[#3B4AD9] transition-all disabled:opacity-50 shadow-lg shadow-indigo-200">
              {isLoading ? 'Guardando…' : 'Guardar Cambios'}
            </button>
            <button type="button" onClick={onClose}
              className="flex-1 py-3.5 border border-[#E2E8F0] text-[#64748B] font-medium rounded-xl hover:bg-gray-50 transition-all">
              Cancelar
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes confirmPop {
          from { opacity:0; transform: scale(0.94) translateY(12px); }
          to   { opacity:1; transform: scale(1)    translateY(0); }
        }
      `}</style>
    </div>
  );
};

// ─── Deposit Modal ────────────────────────────────────────────────────────────
const DepositModal = ({
  goal, onClose, onDeposited,
}: {
  goal: SavingsGoal;
  onClose: () => void;
  onDeposited: (g: SavingsGoal) => void;
}) => {
  const { toast } = useToast();
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g, '');
    if (!v) { setAmount(''); return; }
    setAmount(new Intl.NumberFormat('de-DE').format(parseInt(v)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const numeric = parseFloat(amount.replace(/\./g, ''));
    if (!numeric || numeric <= 0) { setError('Ingresa un monto válido.'); return; }
    setIsLoading(true);
    try {
      const updated = await api.depositGoal(goal.id, numeric);
      if (updated.status === 'completed') {
        toast('success', '¡Meta alcanzada! 🎉', `¡Felicitaciones! Completaste "${goal.name}".`);
      } else {
        toast('success', 'Aporte registrado', `Progreso: ${updated.progress_percent.toFixed(1)}%`);
      }
      onDeposited(updated);
    } catch (err: any) {
      setError(err.message || 'Error al registrar el aporte');
    } finally {
      setIsLoading(false);
    }
  };

  const remaining = parseFloat(String(goal.remaining_amount));
  const quickAmounts = [
    { label: '25%', value: Math.round(remaining * 0.25) },
    { label: '50%', value: Math.round(remaining * 0.5) },
    { label: '100%', value: Math.round(remaining) },
  ].filter(a => a.value > 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backdropFilter: 'blur(8px)', backgroundColor: 'rgba(15,23,42,0.4)' }}
    >
      <div className="card w-full max-w-md p-8 shadow-2xl"
        style={{ animation: 'confirmPop 0.22s ease' }}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-[#1E293B] flex items-center gap-2">
            <PiggyBank className="text-[#10B981]" size={22} /> Abonar a meta
          </h2>
          <button onClick={onClose} className="text-[#94A3B8] hover:text-[#475569] p-1">
            <X size={22} />
          </button>
        </div>

        {/* Goal info */}
        <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl mb-5">
          <span className="text-3xl">{goal.icon || '🎯'}</span>
          <div className="min-w-0">
            <p className="font-bold text-[#1E293B] truncate">{goal.name}</p>
            <p className="text-sm text-[#64748B]">
              {parseFloat(String(goal.progress_percent)).toFixed(1)}% · Faltan {fmtMoney(parseFloat(String(goal.remaining_amount)))}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Quick amounts */}
          {quickAmounts.length > 0 && (
            <div>
              <label className="block text-sm font-bold text-[#1E293B] mb-2">Montos rápidos</label>
              <div className="flex gap-2">
                {quickAmounts.map((qa) => (
                  <button key={qa.label} type="button"
                    onClick={() => setAmount(new Intl.NumberFormat('de-DE').format(qa.value))}
                    className="flex-1 py-2 px-1 text-xs font-bold border border-[#E2E8F0] rounded-xl hover:border-[#4D5DFB] hover:text-[#4D5DFB] transition-all text-center leading-snug">
                    {qa.label === '100%' ? '💯' : qa.label}
                    <br />{fmtMoney(qa.value)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Amount input */}
          <div>
            <label className="block text-sm font-bold text-[#1E293B] mb-2">Monto del aporte *</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]">
                <DollarSign size={18} />
              </div>
              <input type="text" value={amount} onChange={handleChange}
                placeholder="0"
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#10B981] transition-all text-lg font-bold text-slate-700"
                autoFocus required />
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={isLoading}
              className="flex-1 py-3.5 bg-[#10B981] text-white font-bold rounded-xl hover:bg-[#059669] transition-all disabled:opacity-50 shadow-lg shadow-emerald-200">
              {isLoading ? 'Registrando…' : 'Registrar Aporte'}
            </button>
            <button type="button" onClick={onClose}
              className="flex-1 py-3.5 border border-[#E2E8F0] text-[#64748B] font-medium rounded-xl hover:bg-gray-50 transition-all">
              Cancelar
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes confirmPop {
          from { opacity:0; transform: scale(0.94) translateY(12px); }
          to   { opacity:1; transform: scale(1)    translateY(0); }
        }
      `}</style>
    </div>
  );
};

// ─── Empty State ──────────────────────────────────────────────────────────────
const EmptyState = ({ onNew }: { onNew: () => void }) => (
  <div className="card flex flex-col items-center justify-center py-20 gap-6 text-center">
    <div className="w-24 h-24 bg-indigo-50 rounded-3xl flex items-center justify-center text-5xl shadow-inner">
      🎯
    </div>
    <div>
      <h3 className="text-xl font-bold text-[#1E293B] mb-2">Sin metas aún</h3>
      <p className="text-[#64748B] max-w-sm mx-auto">
        Crea tu primera meta de ahorro y empieza a registrar aportes para alcanzarla.
      </p>
    </div>
    <button onClick={onNew}
      className="flex items-center gap-2 px-6 py-3.5 bg-[#4D5DFB] text-white font-bold rounded-2xl hover:bg-[#3B4AD9] transition-all shadow-lg shadow-indigo-200 active:scale-95">
      <Plus size={18} /> Crear mi primera meta
    </button>
  </div>
);

// ─── Stats Bar ────────────────────────────────────────────────────────────────
const StatsBar = ({ goals }: { goals: SavingsGoal[] }) => {
  // DRF returns DecimalField as strings — always parse to float
  const total     = goals.reduce((s, g) => s + parseFloat(String(g.target_amount)),  0);
  const saved     = goals.reduce((s, g) => s + parseFloat(String(g.current_amount)), 0);
  const completed = goals.filter(g => g.status === 'completed').length;
  const active    = goals.filter(g => g.status === 'active').length;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {[
        { label: 'Metas activas',   value: active,              icon: <Clock size={20} />,     color: 'text-blue-600',   bg: 'bg-blue-50' },
        { label: 'Completadas',     value: completed,           icon: <CheckCircle2 size={20}/>, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Total ahorrado',  value: fmtMoney(saved),     icon: <PiggyBank size={20} />, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        { label: 'Meta total',      value: fmtMoney(total),     icon: <TrendingUp size={20}/>, color: 'text-violet-600', bg: 'bg-violet-50' },
      ].map(stat => (
        <div key={stat.label} className="card !p-5 flex items-center gap-4">
          <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
            {stat.icon}
          </div>
          <div className="min-w-0">
            <p className="text-xs text-[#94A3B8] font-medium truncate">{stat.label}</p>
            <p className="text-xl font-extrabold text-[#1E293B] truncate">{stat.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const Goals: React.FC = () => {
  const { toast, confirm } = useToast();
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [depositTarget, setDepositTarget] = useState<SavingsGoal | null>(null);
  const [editTarget, setEditTarget] = useState<SavingsGoal | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'paused'>('all');

  const fetchGoals = async () => {
    setIsLoading(true);
    try {
      const data = await api.getGoals();
      setGoals(data);
    } catch {
      toast('error', 'Error al cargar metas', 'No se pudo conectar al servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchGoals(); }, []);

  const handleCreated = (g: SavingsGoal) => {
    setGoals(prev => [g, ...prev]);
    setShowCreate(false);
  };

  const handleDeposited = (updated: SavingsGoal) => {
    setGoals(prev => prev.map(g => g.id === updated.id ? updated : g));
    setDepositTarget(null);
  };

  const handleUpdated = (updated: SavingsGoal) => {
    setGoals(prev => prev.map(g => g.id === updated.id ? updated : g));
    setEditTarget(null);
  };

  // Guard against React StrictMode double-invocation
  const deletingRef = React.useRef<Set<number>>(new Set());

  const handleDelete = async (id: number) => {
    if (deletingRef.current.has(id)) return;  // already in progress
    const goal = goals.find(g => g.id === id);
    const ok = await confirm({
      title: 'Eliminar meta',
      message: `¿Estás seguro de que deseas eliminar "${goal?.name}"? Esta acción no se puede deshacer.`,
      confirmLabel: 'Sí, eliminar',
      cancelLabel: 'Cancelar',
      danger: true,
    });
    if (!ok) return;

    deletingRef.current.add(id);
    try {
      await api.deleteGoal(id);
      setGoals(prev => prev.filter(g => g.id !== id));
      toast('success', 'Meta eliminada', `"${goal?.name}" fue eliminada.`);
    } catch {
      toast('error', 'Error', 'No se pudo eliminar la meta.');
    } finally {
      deletingRef.current.delete(id);
    }
  };

  const filtered = filter === 'all' ? goals : goals.filter(g => g.status === filter);
  const tabs: { key: typeof filter; label: string }[] = [
    { key: 'all',       label: 'Todas' },
    { key: 'active',    label: 'Activas' },
    { key: 'completed', label: 'Completadas' },
    { key: 'paused',    label: 'Pausadas' },
  ];

  return (
    <Layout title="Metas">
      <AnimatedPage>
        <div style={{ maxWidth: '1024px', margin: '0 auto' }}>
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Mis Metas de Ahorro</h2>
              <p className="text-sm text-[#94A3B8] mt-1">Crea metas y registra aportes para alcanzarlas.</p>
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-5 py-3 bg-[#4D5DFB] text-white font-bold rounded-xl hover:bg-[#3B4AD9] transition-all shadow-lg shadow-indigo-200 text-sm active:scale-95"
            >
              <Plus size={18} /> Nueva Meta
            </button>
          </div>

          {/* Stats */}
          {goals.length > 0 && !isLoading && <StatsBar goals={goals} />}

          {/* Tabs */}
          {goals.length > 0 && (
            <div className="flex gap-1 p-1 bg-[#F1F5F9] rounded-xl mb-6 w-fit">
              {tabs.map(t => (
                <button key={t.key} onClick={() => setFilter(t.key)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    filter === t.key ? 'bg-white text-[#1E293B] shadow-sm' : 'text-[#64748B] hover:text-[#1E293B]'
                  }`}>
                  {t.label}
                  {t.key !== 'all' && (
                    <span className="ml-1.5 text-xs bg-slate-200 rounded-full px-1.5">
                      {goals.filter(g => g.status === t.key).length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Content */}
          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="animate-spin text-indigo-600" size={40} />
            </div>
          ) : goals.length === 0 ? (
            <EmptyState onNew={() => setShowCreate(true)} />
          ) : filtered.length === 0 ? (
            <div className="card flex flex-col items-center py-16 gap-3 text-center">
              <ChevronRight size={32} className="text-[#CBD5E1]" />
              <p className="text-[#64748B]">No hay metas en esta categoría.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filtered.map(goal => (
                <GoalCard key={goal.id} goal={goal} onDeposit={setDepositTarget} onDelete={handleDelete} onEdit={setEditTarget} />
              ))}
            </div>
          )}
        </div>
      </AnimatedPage>

      {/* Modals */}
      {showCreate && <CreateGoalModal onClose={() => setShowCreate(false)} onCreated={handleCreated} />}
      {depositTarget && (
        <DepositModal goal={depositTarget} onClose={() => setDepositTarget(null)} onDeposited={handleDeposited} />
      )}
      {editTarget && (
        <EditGoalModal goal={editTarget} onClose={() => setEditTarget(null)} onUpdated={handleUpdated} />
      )}
    </Layout>
  );
};

export default Goals;
