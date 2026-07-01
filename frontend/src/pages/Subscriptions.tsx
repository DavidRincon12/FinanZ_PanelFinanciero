import React, { useEffect, useState, useMemo } from 'react';
import Layout from '../components/Layout';
import AnimatedPage from '../components/AnimatedPage';
import {
  Plus, Loader2, CreditCard, Edit2, Trash2, CheckCircle2,
  SkipForward, RefreshCw, AlertCircle, Zap, Calendar, Bell,
  TrendingDown, X, ChevronDown, ChevronUp,
} from 'lucide-react';
import { subscriptionApi } from '../services/api';
import type { Subscription, SubscriptionFrequency, SubscriptionCreatePayload } from '../services/api';
import { fmtMoney } from '../utils/format';
import ConfirmModal from '../components/ConfirmModal';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const FREQ_LABELS: Record<SubscriptionFrequency, string> = {
  weekly: 'Semanal',
  monthly: 'Mensual',
  quarterly: 'Trimestral',
  semiannually: 'Semestral',
  annually: 'Anual',
};

const FREQ_COLORS: Record<SubscriptionFrequency, string> = {
  weekly: '#8B5CF6',
  monthly: '#4D5DFB',
  quarterly: '#06B6D4',
  semiannually: '#10B981',
  annually: '#F59E0B',
};

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / 86_400_000);
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

function urgencyBadge(days: number): { label: string; cls: string } {
  if (days < 0)  return { label: 'Vencida', cls: 'bg-rose-100 text-rose-700' };
  if (days === 0) return { label: 'Hoy',    cls: 'bg-rose-100 text-rose-700' };
  if (days <= 3)  return { label: `${days}d`, cls: 'bg-amber-100 text-amber-700' };
  if (days <= 7)  return { label: `${days}d`, cls: 'bg-yellow-100 text-yellow-700' };
  return { label: `${days}d`, cls: 'bg-slate-100 text-slate-600' };
}

// ---------------------------------------------------------------------------
// Subscription Form (create / edit)
// ---------------------------------------------------------------------------

interface FormState {
  name: string;
  amount: string;
  frequency: SubscriptionFrequency;
  start_date: string;
  auto_pay: boolean;
  alert_days_before: string;
  is_active: boolean;
}

const defaultForm = (): FormState => ({
  name: '',
  amount: '',
  frequency: 'monthly',
  start_date: new Date().toISOString().split('T')[0],
  auto_pay: false,
  alert_days_before: '3',
  is_active: true,
});

interface SubFormProps {
  initial?: Subscription | null;
  onSave: (payload: SubscriptionCreatePayload) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
}

const SubscriptionForm: React.FC<SubFormProps> = ({ initial, onSave, onCancel, loading }) => {
  const [form, setForm] = useState<FormState>(() => {
    if (!initial) return defaultForm();
    return {
      name: initial.name,
      amount: String(initial.amount),
      frequency: initial.frequency,
      start_date: initial.start_date,
      auto_pay: initial.auto_pay,
      alert_days_before: String(initial.alert_days_before),
      is_active: initial.is_active,
    };
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const amount = parseFloat(form.amount);
    if (!form.name.trim()) { setError('El nombre es obligatorio.'); return; }
    if (isNaN(amount) || amount <= 0) { setError('El monto debe ser mayor a 0.'); return; }
    const alertDays = parseInt(form.alert_days_before, 10);
    if (isNaN(alertDays) || alertDays < 0) { setError('Días de alerta inválidos.'); return; }
    try {
      await onSave({
        name: form.name.trim(),
        amount,
        frequency: form.frequency,
        start_date: form.start_date,
        auto_pay: form.auto_pay,
        alert_days_before: alertDays,
        is_active: form.is_active,
      });
    } catch (err: any) {
      setError(err.message || 'Error al guardar.');
    }
  };

  const inputCls = 'w-full rounded-xl border border-[#E2E8F0] px-4 py-2.5 text-[#1E293B] text-sm focus:outline-none focus:ring-2 focus:ring-[#4D5DFB]/40 focus:border-[#4D5DFB] transition';
  const labelCls = 'block text-xs font-semibold text-[#64748B] mb-1.5 uppercase tracking-wide';

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {error && (
        <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-rose-700 text-sm">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Name */}
      <div>
        <label className={labelCls}>Nombre del servicio</label>
        <input
          id="sub-name"
          className={inputCls}
          placeholder="Netflix, Spotify…"
          value={form.name}
          onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
          required
        />
      </div>

      {/* Amount + Frequency */}
      <div className="flex gap-3">
        <div className="flex-1">
          <label className={labelCls}>Monto</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8] text-sm font-bold">$</span>
            <input
              id="sub-amount"
              className={`${inputCls} pl-7`}
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={form.amount}
              onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
              required
            />
          </div>
        </div>
        <div className="flex-1">
          <label className={labelCls}>Frecuencia</label>
          <select
            id="sub-frequency"
            className={inputCls}
            value={form.frequency}
            onChange={e => setForm(p => ({ ...p, frequency: e.target.value as SubscriptionFrequency }))}
          >
            {(Object.entries(FREQ_LABELS) as [SubscriptionFrequency, string][]).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Start date + Alert days */}
      <div className="flex gap-3">
        <div className="flex-1">
          <label className={labelCls}>Fecha de inicio</label>
          <input
            id="sub-start-date"
            className={inputCls}
            type="date"
            value={form.start_date}
            onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))}
            required
          />
        </div>
        <div className="flex-1">
          <label className={labelCls}>Días de alerta anticipada</label>
          <input
            id="sub-alert-days"
            className={inputCls}
            type="number"
            min="0"
            max="30"
            value={form.alert_days_before}
            onChange={e => setForm(p => ({ ...p, alert_days_before: e.target.value }))}
          />
        </div>
      </div>

      {/* Toggles */}
      <div className="flex gap-4">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <div
            onClick={() => setForm(p => ({ ...p, auto_pay: !p.auto_pay }))}
            className={`w-10 h-6 rounded-full transition-colors ${form.auto_pay ? 'bg-[#4D5DFB]' : 'bg-slate-200'} relative`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.auto_pay ? 'translate-x-4' : ''}`} />
          </div>
          <span className="text-sm font-medium text-[#1E293B]">Pago automático</span>
        </label>

        {initial && (
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <div
              onClick={() => setForm(p => ({ ...p, is_active: !p.is_active }))}
              className={`w-10 h-6 rounded-full transition-colors ${form.is_active ? 'bg-emerald-500' : 'bg-slate-200'} relative`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.is_active ? 'translate-x-4' : ''}`} />
            </div>
            <span className="text-sm font-medium text-[#1E293B]">Activa</span>
          </label>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl border border-[#E2E8F0] text-[#64748B] text-sm font-semibold hover:bg-slate-50 transition"
        >
          Cancelar
        </button>
        <button
          id="sub-submit"
          type="submit"
          disabled={loading}
          className="flex-1 py-2.5 rounded-xl bg-[#4D5DFB] text-white text-sm font-semibold hover:bg-indigo-600 transition flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : null}
          {initial ? 'Actualizar' : 'Crear suscripción'}
        </button>
      </div>
    </form>
  );
};

// ---------------------------------------------------------------------------
// Subscription Row (compact table)
// ---------------------------------------------------------------------------

interface RowProps {
  sub: Subscription;
  onEdit: () => void;
  onDelete: () => void;
  onConfirm: () => void;
  onSkip: () => void;
  actionLoading: boolean;
}

const SubscriptionRow: React.FC<RowProps> = ({ sub, onEdit, onDelete, onConfirm, onSkip, actionLoading }) => {
  const days = daysUntil(sub.next_billing_date);
  const badge = urgencyBadge(days);
  const freqColor = FREQ_COLORS[sub.frequency] ?? '#4D5DFB';
  const isDue = days <= 0;

  return (
    <tr className="group hover:bg-slate-50/80 transition-colors">
      {/* Service */}
      <td className="py-3.5 px-4">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
            style={{ background: freqColor }}
          >
            {sub.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-[#1E293B] text-sm leading-tight">{sub.name}</p>
            <p className="text-[11px] text-[#94A3B8]">{FREQ_LABELS[sub.frequency]}</p>
          </div>
        </div>
      </td>

      {/* Amount */}
      <td className="py-3.5 px-4 text-right">
        <span className="font-bold text-[#1E293B] text-sm">{fmtMoney(Number(sub.amount))}</span>
      </td>

      {/* Next billing */}
      <td className="py-3.5 px-4">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${badge.cls}`}>{badge.label}</span>
          <span className="text-xs text-[#64748B]">{formatDate(sub.next_billing_date)}</span>
        </div>
      </td>

      {/* Status */}
      <td className="py-3.5 px-4">
        {sub.auto_pay ? (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full w-fit">
            <Zap size={10} /> Auto
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full w-fit">
            Manual
          </span>
        )}
      </td>

      {/* Active */}
      <td className="py-3.5 px-4">
        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${sub.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-500'}`}>
          {sub.is_active ? 'Activa' : 'Pausada'}
        </span>
      </td>

      {/* Actions */}
      <td className="py-3.5 px-4">
        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {isDue && sub.is_active && (
            <>
              <button
                id={`sub-confirm-${sub.id}`}
                onClick={onConfirm}
                disabled={actionLoading}
                title="Confirmar pago"
                className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition disabled:opacity-40"
              >
                <CheckCircle2 size={15} />
              </button>
              <button
                id={`sub-skip-${sub.id}`}
                onClick={onSkip}
                disabled={actionLoading}
                title="Omitir pago"
                className="p-1.5 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition disabled:opacity-40"
              >
                <SkipForward size={15} />
              </button>
            </>
          )}
          <button
            id={`sub-edit-${sub.id}`}
            onClick={onEdit}
            title="Editar"
            className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition"
          >
            <Edit2 size={15} />
          </button>
          <button
            id={`sub-delete-${sub.id}`}
            onClick={onDelete}
            title="Eliminar"
            className="p-1.5 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 transition"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </td>
    </tr>
  );
};

// ---------------------------------------------------------------------------
// Summary Stats
// ---------------------------------------------------------------------------

interface StatsProps { subs: Subscription[] }

const SummaryStats: React.FC<StatsProps> = ({ subs }) => {
  const active = subs.filter(s => s.is_active);
  const monthly = active.reduce((acc, s) => {
    const a = Number(s.amount);
    const map: Record<SubscriptionFrequency, number> = {
      weekly: 52 / 12,
      monthly: 1,
      quarterly: 1 / 3,
      semiannually: 1 / 6,
      annually: 1 / 12,
    };
    return acc + a * (map[s.frequency] ?? 1);
  }, 0);
  const dueNow = active.filter(s => daysUntil(s.next_billing_date) <= 0).length;
  const upcoming = active.filter(s => { const d = daysUntil(s.next_billing_date); return d > 0 && d <= 7; }).length;

  const cards = [
    { label: 'Costo mensual', value: fmtMoney(monthly), sub: 'estimado', icon: <TrendingDown size={20} />, color: '#4D5DFB' },
    { label: 'Suscripciones', value: String(active.length), sub: 'activas', icon: <CreditCard size={20} />, color: '#10B981' },
    { label: 'Vencidas', value: String(dueNow), sub: 'requieren acción', icon: <AlertCircle size={20} />, color: dueNow > 0 ? '#EF4444' : '#94A3B8' },
    { label: 'Esta semana', value: String(upcoming), sub: 'próximos 7 días', icon: <Bell size={20} />, color: upcoming > 0 ? '#F59E0B' : '#94A3B8' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {cards.map(c => (
        <div key={c.label} className="bg-white border border-[#E2E8F0] rounded-2xl p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${c.color}18`, color: c.color }}>
            {c.icon}
          </div>
          <div>
            <p className="text-2xl font-extrabold text-[#1E293B] leading-none">{c.value}</p>
            <p className="text-[11px] text-[#94A3B8] font-medium mt-0.5">{c.label}</p>
            <p className="text-[10px] text-[#CBD5E1]">{c.sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

type FilterTab = 'all' | 'active' | 'paused' | 'due';

const Subscriptions: React.FC = () => {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  // Drawer / form state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Subscription | null>(null);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<Subscription | null>(null);

  // Filters
  const [filter, setFilter] = useState<FilterTab>('all');
  const [sortBy, setSortBy] = useState<'next_billing_date' | 'amount' | 'name'>('next_billing_date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // ---------------------------------------------------------------------------

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const load = async () => {
    try {
      const data = await subscriptionApi.list();
      setSubs(data);
    } catch {
      setError('No se pudieron cargar las suscripciones.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // ---------------------------------------------------------------------------

  const filtered = useMemo(() => {
    let list = [...subs];
    if (filter === 'active') list = list.filter(s => s.is_active);
    if (filter === 'paused') list = list.filter(s => !s.is_active);
    if (filter === 'due') list = list.filter(s => s.is_active && daysUntil(s.next_billing_date) <= 0);

    list.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'next_billing_date') cmp = a.next_billing_date.localeCompare(b.next_billing_date);
      if (sortBy === 'amount') cmp = Number(a.amount) - Number(b.amount);
      if (sortBy === 'name') cmp = a.name.localeCompare(b.name);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [subs, filter, sortBy, sortDir]);

  // ---------------------------------------------------------------------------

  const handleSave = async (payload: SubscriptionCreatePayload) => {
    setFormLoading(true);
    try {
      if (editing) {
        const updated = await subscriptionApi.update(editing.id, payload);
        setSubs(prev => prev.map(s => s.id === updated.id ? updated : s));
        showToast('Suscripción actualizada ✓');
      } else {
        const created = await subscriptionApi.create(payload);
        setSubs(prev => [...prev, created]);
        showToast('Suscripción creada ✓');
      }
      setDrawerOpen(false);
      setEditing(null);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await subscriptionApi.delete(deleteTarget.id);
    setSubs(prev => prev.filter(s => s.id !== deleteTarget.id));
    setDeleteTarget(null);
    showToast('Suscripción eliminada');
  };

  const handleConfirm = async (id: number) => {
    setActionLoading(id);
    try {
      await subscriptionApi.confirm(id);
      showToast('Pago confirmado y registrado ✓');
      await load();
    } catch (err: any) {
      showToast(err.message || 'Error al confirmar pago');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSkip = async (id: number) => {
    setActionLoading(id);
    try {
      await subscriptionApi.skip(id);
      showToast('Pago omitido — próximo ciclo programado');
      await load();
    } catch (err: any) {
      showToast(err.message || 'Error al omitir pago');
    } finally {
      setActionLoading(null);
    }
  };

  // ---------------------------------------------------------------------------

  const SortHeader: React.FC<{ col: typeof sortBy; label: string }> = ({ col, label }) => (
    <button
      className="flex items-center gap-1 text-xs font-semibold text-[#94A3B8] uppercase tracking-wider hover:text-[#4D5DFB] transition group"
      onClick={() => { if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortBy(col); setSortDir('asc'); } }}
    >
      {label}
      {sortBy === col
        ? sortDir === 'asc' ? <ChevronUp size={12} className="text-[#4D5DFB]" /> : <ChevronDown size={12} className="text-[#4D5DFB]" />
        : <ChevronDown size={12} className="opacity-0 group-hover:opacity-40" />}
    </button>
  );

  const TABS: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'Todas' },
    { key: 'active', label: 'Activas' },
    { key: 'paused', label: 'Pausadas' },
    { key: 'due', label: 'Vencidas' },
  ];

  // ---------------------------------------------------------------------------

  return (
    <Layout>
      <AnimatedPage>
        <div className="p-8 max-w-[1200px] mx-auto">

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-extrabold text-[#1E293B] tracking-tight">Suscripciones</h1>
              <p className="text-[#94A3B8] text-sm mt-1">
                Controla todos tus servicios recurrentes en un solo lugar.
              </p>
            </div>
            <button
              id="sub-add-btn"
              onClick={() => { setEditing(null); setDrawerOpen(true); }}
              className="flex items-center gap-2 bg-[#4D5DFB] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-600 transition shadow-md shadow-indigo-200"
            >
              <Plus size={18} /> Nueva suscripción
            </button>
          </div>

          {/* Stats */}
          {!loading && <SummaryStats subs={subs} />}

          {/* Filters */}
          <div className="flex items-center gap-2 mb-5 flex-wrap">
            {TABS.map(t => (
              <button
                key={t.key}
                id={`sub-tab-${t.key}`}
                onClick={() => setFilter(t.key)}
                className={`px-4 py-1.5 rounded-xl text-sm font-semibold transition ${
                  filter === t.key
                    ? 'bg-[#4D5DFB] text-white shadow-md shadow-indigo-200'
                    : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:bg-slate-50'
                }`}
              >
                {t.label}
              </button>
            ))}
            <div className="ml-auto">
              <button
                onClick={load}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#64748B] border border-[#E2E8F0] bg-white hover:bg-slate-50 transition"
              >
                <RefreshCw size={13} /> Actualizar
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-[#94A3B8]">
                <Loader2 size={32} className="animate-spin text-[#4D5DFB]" />
                <p className="text-sm">Cargando suscripciones…</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-rose-500">
                <AlertCircle size={32} />
                <p className="text-sm">{error}</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4 text-[#94A3B8]">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center">
                  <CreditCard size={32} className="text-[#4D5DFB]" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-[#1E293B]">Sin suscripciones</p>
                  <p className="text-sm mt-1">Agrega tu primer servicio recurrente.</p>
                </div>
                <button
                  onClick={() => { setEditing(null); setDrawerOpen(true); }}
                  className="flex items-center gap-2 bg-[#4D5DFB] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-600 transition"
                >
                  <Plus size={16} /> Agregar suscripción
                </button>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#F1F5F9] bg-slate-50/60">
                    <th className="py-3 px-4 text-left"><SortHeader col="name" label="Servicio" /></th>
                    <th className="py-3 px-4 text-right"><SortHeader col="amount" label="Monto" /></th>
                    <th className="py-3 px-4 text-left"><SortHeader col="next_billing_date" label="Próximo cobro" /></th>
                    <th className="py-3 px-4 text-left"><span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Tipo</span></th>
                    <th className="py-3 px-4 text-left"><span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Estado</span></th>
                    <th className="py-3 px-4 text-left"><span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Acciones</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F8FAFC]">
                  {filtered.map(sub => (
                    <SubscriptionRow
                      key={sub.id}
                      sub={sub}
                      onEdit={() => { setEditing(sub); setDrawerOpen(true); }}
                      onDelete={() => setDeleteTarget(sub)}
                      onConfirm={() => handleConfirm(sub.id)}
                      onSkip={() => handleSkip(sub.id)}
                      actionLoading={actionLoading === sub.id}
                    />
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Due today — callout */}
          {(() => {
            const dueList = subs.filter(s => s.is_active && daysUntil(s.next_billing_date) <= 0);
            if (!dueList.length) return null;
            return (
              <div className="mt-6 bg-rose-50 border border-rose-200 rounded-2xl px-6 py-4 flex items-start gap-3">
                <AlertCircle size={20} className="text-rose-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-bold text-rose-700 text-sm">
                    {dueList.length} suscripción{dueList.length > 1 ? 'es' : ''} vencida{dueList.length > 1 ? 's' : ''}
                  </p>
                  <p className="text-rose-600 text-xs mt-0.5">
                    {dueList.map(s => s.name).join(', ')} — Confírmalas u omítelas para avanzar el ciclo.
                  </p>
                </div>
              </div>
            );
          })()}

          {/* Calendar hint */}
          {!loading && subs.length > 0 && (
            <div className="mt-4 bg-indigo-50 border border-indigo-100 rounded-2xl px-6 py-4 flex items-center gap-3">
              <Calendar size={18} className="text-[#4D5DFB] flex-shrink-0" />
              <p className="text-indigo-700 text-xs">
                <strong>Tip:</strong> Las suscripciones con <em>pago automático</em> se registran como gasto
                automáticamente cuando vencen (cron diario) y también al iniciar sesión.
              </p>
            </div>
          )}

        </div>

        {/* Side Drawer — Create / Edit */}
        {drawerOpen && (
          <div className="fixed inset-0 z-40 flex justify-end">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => { setDrawerOpen(false); setEditing(null); }} />
            <div className="relative z-10 w-full max-w-md bg-white h-full shadow-2xl flex flex-col">
              <div className="flex items-center justify-between px-6 py-5 border-b border-[#E2E8F0]">
                <div>
                  <h2 className="font-bold text-[#1E293B] text-lg">
                    {editing ? 'Editar suscripción' : 'Nueva suscripción'}
                  </h2>
                  <p className="text-xs text-[#94A3B8] mt-0.5">
                    {editing ? `Editando: ${editing.name}` : 'Completa los datos del servicio recurrente'}
                  </p>
                </div>
                <button
                  onClick={() => { setDrawerOpen(false); setEditing(null); }}
                  className="p-2 rounded-xl text-[#94A3B8] hover:bg-slate-100 transition"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-6">
                <SubscriptionForm
                  initial={editing}
                  onSave={handleSave}
                  onCancel={() => { setDrawerOpen(false); setEditing(null); }}
                  loading={formLoading}
                />
              </div>
            </div>
          </div>
        )}

        {/* Delete confirm */}
        {deleteTarget && (
          <ConfirmModal
            isOpen={!!deleteTarget}
            title="Eliminar suscripción"
            message={`¿Eliminar "${deleteTarget.name}"? Esta acción no se puede deshacer.`}
            confirmText="Eliminar"
            type="danger"
            onConfirm={handleDelete}
            onClose={() => setDeleteTarget(null)}
          />
        )}

        {/* Toast */}
        {toast && (
          <div className="fixed bottom-6 right-6 z-50 bg-[#1E293B] text-white text-sm font-medium px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <CheckCircle2 size={16} className="text-emerald-400" />
            {toast}
          </div>
        )}
      </AnimatedPage>
    </Layout>
  );
};

export default Subscriptions;
