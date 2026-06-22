import React, { useEffect, useState, useMemo } from 'react';
import Layout from '../components/Layout';
import AnimatedPage from '../components/AnimatedPage';
import { Plus, Loader2, AlertTriangle, XCircle, Info, ChevronLeft, ChevronRight, Edit2, Trash2 } from 'lucide-react';
import api from '../services/api';
import type { Budget, AppNotification } from '../services/api';
import { getCategoryStyle } from '../utils/categoryHelper';
import { fmtMoney } from '../utils/format';
import BudgetForm from '../components/BudgetForm';
import ConfirmModal from '../components/ConfirmModal';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Cell,
} from 'recharts';

interface BudgetCardProps {
  category: string;
  categoryIcon?: string | null;
  spent: number;
  total: number;
  percentage: number;
  icon: React.ReactNode;
  color: string;
  warningThreshold: number;
  criticalThreshold: number;
  onEdit: () => void;
  onDelete: () => void;
}

const BudgetCard: React.FC<BudgetCardProps> = ({ 
  category, 
  categoryIcon, 
  spent, 
  total, 
  percentage, 
  icon, 
  color, 
  warningThreshold,
  criticalThreshold,
  onEdit, 
  onDelete 
}) => {
  let statusColor = 'text-emerald-600';
  let barGradient = 'from-emerald-400 to-emerald-500';
  let statusText = 'Saludable';
  
  if (percentage >= criticalThreshold) {
    statusColor = 'text-rose-600';
    barGradient = 'from-rose-400 to-rose-600';
    statusText = 'Excedido';
  } else if (percentage >= warningThreshold) {
    statusColor = 'text-amber-500';
    barGradient = 'from-amber-400 to-amber-500';
    statusText = 'Por agotar';
  }

  return (
    <div 
      className="card !p-5 bg-white border border-[#E2E8F0] shadow-sm rounded-2xl hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
      style={{ borderLeftWidth: '5px', borderLeftColor: color }}
    >
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-50 text-xl" style={{ color: categoryIcon ? undefined : color }}>
              {categoryIcon ? categoryIcon : icon}
            </div>
            <div>
              <h4 className="font-bold text-[#1E293B] text-base leading-tight">{category}</h4>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${statusColor}`}>{statusText}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-base font-extrabold text-[#1E293B]">
              {Math.round(percentage)}%
            </div>
            <p className="text-[10px] text-[#94A3B8] font-bold">Consumido</p>
          </div>
        </div>
        
        <div className="space-y-1 mb-4">
          <div className="w-full bg-[#F1F5F9] h-2.5 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full bg-gradient-to-r ${barGradient} transition-all duration-500`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            ></div>
          </div>
          <div className="flex justify-between items-center text-[11px] text-[#64748B]">
            <span>{fmtMoney(spent)} gastado</span>
            <span className="font-semibold text-[#334155]">Límite: {fmtMoney(total)}</span>
          </div>
        </div>

        <div className="flex justify-between text-[9px] text-[#94A3B8] font-bold mb-5 px-1 uppercase tracking-wider">
          <span>Alerta al {warningThreshold}%</span>
          <span>Crítico al {criticalThreshold}%</span>
        </div>
      </div>

      <div className="flex gap-2 border-t border-[#F1F5F9] pt-4 mt-auto">
        <button 
          onClick={onEdit}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-bold text-[#475569] hover:bg-[#F1F5F9] hover:text-[#1E293B] transition-colors cursor-pointer"
        >
          <Edit2 size={12} /> Editar
        </button>
        <button 
          onClick={onDelete}
          className="flex items-center justify-center p-2.5 bg-white border border-rose-100 rounded-xl text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
          title="Eliminar presupuesto"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Custom Tooltip for the BarChart                                    */
/* ------------------------------------------------------------------ */
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-lg p-3 text-sm">
      <p className="font-semibold text-[#1E293B] mb-1">{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.name} style={{ color: entry.color }}>
          {entry.name}: {fmtMoney(entry.value)}
        </p>
      ))}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Helper – notification icon & color                                 */
/* ------------------------------------------------------------------ */
const alertMeta = (type: string) => {
  switch (type) {
    case 'critical':
      return { icon: <XCircle size={18} />, bg: 'bg-red-50', text: 'text-red-600', badge: 'bg-red-100 text-red-700' };
    case 'warning':
      return { icon: <AlertTriangle size={18} />, bg: 'bg-amber-50', text: 'text-amber-600', badge: 'bg-amber-100 text-amber-700' };
    default:
      return { icon: <Info size={18} />, bg: 'bg-blue-50', text: 'text-blue-600', badge: 'bg-blue-100 text-blue-700' };
  }
};

const monthsEs = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */
const Budgets: React.FC = () => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);

  // Filter States
  const [filterMonth, setFilterMonth] = useState<number>(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear());
  const [activeStatusFilter, setActiveStatusFilter] = useState<'Todos' | 'Saludable' | 'Por agotar' | 'Excedidos'>('Todos');

  // History and Notifications
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const fetchBudgets = async () => {
    try {
      const data = await api.getBudgets();
      setBudgets(data);
    } catch (err) {
      console.error('Error fetching budgets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const data = await api.getBudgetHistory();
      setHistoryData(data);
    } catch (err) {
      console.error('Error fetching budget history:', err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const data = await api.getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  useEffect(() => {
    fetchBudgets();
    fetchHistory();
    fetchNotifications();
  }, []);

  const handleEdit = (budget: Budget) => {
    setSelectedBudget(budget);
    setIsFormOpen(true);
  };

  const handleAdd = () => {
    setSelectedBudget(null);
    setIsFormOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await api.deleteBudget(deleteTarget.id);
      fetchBudgets();
    } catch (err) {
      console.error('Error deleting budget:', err);
      alert('Ocurrió un error al intentar eliminar el presupuesto.');
    } finally {
      setDeleteTarget(null);
    }
  };

  // Month navigation handlers
  const handlePrevMonth = () => {
    setFilterMonth(prev => {
      if (prev === 1) {
        setFilterYear(y => y - 1);
        return 12;
      }
      return prev - 1;
    });
  };

  const handleNextMonth = () => {
    setFilterMonth(prev => {
      if (prev === 12) {
        setFilterYear(y => y + 1);
        return 1;
      }
      return prev + 1;
    });
  };

  // Filter budgets client-side by month/year and status selection
  const filteredBudgets = useMemo(() => {
    const monthly = budgets.filter(b => b.month === filterMonth && b.year === filterYear);
    return monthly.filter(b => {
      const warning = b.warning_threshold || 80;
      const critical = b.critical_threshold || 100;
      const pct = b.percentage;

      if (activeStatusFilter === 'Saludable') {
        return pct < warning;
      } else if (activeStatusFilter === 'Por agotar') {
        return pct >= warning && pct < critical;
      } else if (activeStatusFilter === 'Excedidos') {
        return pct >= critical;
      }
      return true; // 'Todos'
    });
  }, [budgets, filterMonth, filterYear, activeStatusFilter]);

  // Compute monthly summary statistics (based on active period)
  const { totalBudgeted, totalSpent, remaining, globalPercentage } = useMemo(() => {
    const monthly = budgets.filter(b => b.month === filterMonth && b.year === filterYear);
    const budgeted = monthly.reduce((sum, b) => sum + parseFloat(b.amount.toString()), 0);
    const spent = monthly.reduce((sum, b) => sum + parseFloat(b.spent.toString()), 0);
    const rem = budgeted - spent;
    const pct = budgeted > 0 ? (spent / budgeted) * 100 : 0;
    return {
      totalBudgeted: budgeted,
      totalSpent: spent,
      remaining: rem,
      globalPercentage: pct
    };
  }, [budgets, filterMonth, filterYear]);

  // Status Filter Counts for active period
  const counts = useMemo(() => {
    const monthly = budgets.filter(b => b.month === filterMonth && b.year === filterYear);
    const healthy = monthly.filter(b => b.percentage < (b.warning_threshold || 80)).length;
    const warning = monthly.filter(b => b.percentage >= (b.warning_threshold || 80) && b.percentage < (b.critical_threshold || 100)).length;
    const exceeded = monthly.filter(b => b.percentage >= (b.critical_threshold || 100)).length;
    return {
      todos: monthly.length,
      saludable: healthy,
      porAgotar: warning,
      excedidos: exceeded
    };
  }, [budgets, filterMonth, filterYear]);

  /* ---- Motivational comparison logic ---- */
  const motivationalMessage = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    let prevMonth = currentMonth - 1;
    let prevYear = currentYear;
    if (prevMonth <= 0) {
      prevMonth = 12;
      prevYear -= 1;
    }

    const isCurrentMonth = (n: AppNotification) => {
      const d = new Date(n.created_at);
      return d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear;
    };
    const isPrevMonth = (n: AppNotification) => {
      const d = new Date(n.created_at);
      return d.getMonth() + 1 === prevMonth && d.getFullYear() === prevYear;
    };
    const isAlert = (n: AppNotification) => n.type === 'warning' || n.type === 'critical';

    const currentAlerts = notifications.filter(n => isAlert(n) && isCurrentMonth(n)).length;
    const prevAlerts = notifications.filter(n => isAlert(n) && isPrevMonth(n)).length;
    const diff = Math.abs(currentAlerts - prevAlerts);

    if (currentAlerts < prevAlerts) {
      return {
        type: 'success' as const,
        text: `¡Excelente progreso! 🎉 Este mes tienes ${diff} alerta${diff !== 1 ? 's' : ''} menos que el mes pasado.`,
      };
    } else if (currentAlerts > prevAlerts) {
      return {
        type: 'warning' as const,
        text: `⚠️ Atención: Este mes tienes ${diff} alerta${diff !== 1 ? 's' : ''} más que el mes anterior. Revisa tus gastos.`,
      };
    }
    return {
      type: 'neutral' as const,
      text: 'Tu comportamiento financiero se mantiene estable respecto al mes pasado.',
    };
  }, [notifications]);

  /* ---- Sorted notifications (newest first) ---- */
  const sortedNotifications = useMemo(
    () => [...notifications].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [notifications],
  );

  return (
    <Layout title="Presupuestos">
      <AnimatedPage>
        <div className="w-full max-w-5xl mx-auto px-4 md:px-0">
          
          {/* Header Row & Month Navigation */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h2 className="text-3xl font-extrabold text-[#0F172A] tracking-tight">Presupuestos</h2>
              <p className="text-[#64748B] text-sm mt-1">Controla y planifica tus límites de gastos mensuales</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="flex items-center bg-white border border-[#E2E8F0] rounded-xl p-1 shadow-sm gap-1">
                <button 
                  onClick={handlePrevMonth}
                  className="p-2 hover:bg-[#F1F5F9] rounded-lg transition-colors text-[#64748B] cursor-pointer"
                  title="Mes Anterior"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="font-semibold text-sm text-[#334155] px-3 py-1 min-w-[125px] text-center select-none uppercase tracking-wide text-xs">
                  {monthsEs[filterMonth - 1]} {filterYear}
                </span>
                <button 
                  onClick={handleNextMonth}
                  className="p-2 hover:bg-[#F1F5F9] rounded-lg transition-colors text-[#64748B] cursor-pointer"
                  title="Mes Siguiente"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
              <button 
                onClick={handleAdd}
                className="flex items-center gap-2 bg-[#4D5DFB] hover:bg-[#3B4AD9] text-white px-5 py-2.5 rounded-xl font-bold text-xs transition-all uppercase tracking-wider shadow-sm hover:shadow-md cursor-pointer ml-auto sm:ml-2 whitespace-nowrap"
              >
                <Plus size={14} /> Establecer Presupuesto
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center p-20">
              <Loader2 className="animate-spin text-[#4D5DFB]" size={40} />
            </div>
          ) : (
            <>
              {/* Top Summary Card Widget */}
              <div className="bg-white border border-[#E2E8F0] shadow-sm rounded-3xl p-6 mb-8 relative overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-[#4D5DFB] flex items-center justify-center text-xl font-bold">
                      $
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Total Presupuestado</p>
                      <h3 className="text-2xl font-extrabold text-[#0F172A] mt-1">{fmtMoney(totalBudgeted)}</h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-[#F1F5F9] pt-4 md:pt-0 md:pl-6">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold ${globalPercentage >= 100 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                      {globalPercentage >= 100 ? '🔥' : '📈'}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Total Gastado</p>
                      <h3 className="text-2xl font-extrabold text-[#0F172A] mt-1">{fmtMoney(totalSpent)}</h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-[#F1F5F9] pt-4 md:pt-0 md:pl-6">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold ${remaining < 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                      💰
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Restante</p>
                      <h3 className={`text-2xl font-extrabold mt-1 ${remaining < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {fmtMoney(remaining)}
                      </h3>
                    </div>
                  </div>
                </div>

                {totalBudgeted > 0 && (
                  <div className="mt-6 border-t border-[#F1F5F9] pt-6">
                    <div className="flex justify-between items-center text-sm font-semibold mb-2">
                      <span className="text-[#64748B]">Consumo total del mes</span>
                      <span className={`${globalPercentage >= 100 ? 'text-rose-600' : globalPercentage >= 80 ? 'text-amber-500' : 'text-emerald-600'}`}>
                        {Math.round(globalPercentage)}%
                      </span>
                    </div>
                    <div className="w-full bg-[#F1F5F9] h-3 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-700 bg-gradient-to-r"
                        style={{ 
                          width: `${Math.min(globalPercentage, 100)}%`,
                          backgroundImage: globalPercentage >= 100 
                            ? 'linear-gradient(to right, #F87171, #EF4444)' 
                            : globalPercentage >= 80 
                            ? 'linear-gradient(to right, #FBBF24, #F59E0B)' 
                            : 'linear-gradient(to right, #34D399, #10B981)' 
                        }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Status Filter Row */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin w-full">
                  {[
                    { key: 'Todos', label: 'Todos', count: counts.todos, activeColor: 'bg-indigo-50 border-indigo-200 text-indigo-700' },
                    { key: 'Saludable', label: 'Saludable', count: counts.saludable, activeColor: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
                    { key: 'Por agotar', label: 'Por agotar', count: counts.porAgotar, activeColor: 'bg-amber-50 border-amber-200 text-amber-700' },
                    { key: 'Excedidos', label: 'Excedidos', count: counts.excedidos, activeColor: 'bg-rose-50 border-rose-200 text-rose-700' },
                  ].map(pill => {
                    const active = activeStatusFilter === pill.key;
                    return (
                      <button
                        key={pill.key}
                        onClick={() => setActiveStatusFilter(pill.key as any)}
                        className={`flex items-center gap-2 px-4 py-2 border rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer hover:shadow-sm ${
                          active 
                            ? `${pill.activeColor} shadow-inner` 
                            : 'bg-white border-[#E2E8F0] text-[#64748B] hover:text-[#334155] hover:bg-[#F8FAFC]'
                        }`}
                      >
                        {pill.label}
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${active ? 'bg-white/80' : 'bg-[#F1F5F9] text-[#64748B]'}`}>
                          {pill.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Grid of Redesigned Budget Cards */}
              {filteredBudgets.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredBudgets.map(budget => {
                    const catStyle = getCategoryStyle(budget.category_name, 20);
                    return (
                      <BudgetCard 
                        key={budget.id}
                        category={budget.category_name} 
                        categoryIcon={budget.category_icon}
                        spent={budget.spent} 
                        total={budget.amount} 
                        percentage={budget.percentage} 
                        icon={catStyle.icon}
                        color={catStyle.colorHex} 
                        warningThreshold={budget.warning_threshold || 80}
                        criticalThreshold={budget.critical_threshold || 100}
                        onEdit={() => handleEdit(budget)}
                        onDelete={() => setDeleteTarget({ id: budget.id, name: budget.category_name })}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="card p-12 text-center border border-[#E2E8F0] rounded-2xl bg-white shadow-sm">
                  <p className="text-[#64748B] font-semibold text-sm">
                    No hay presupuestos que coincidan con los filtros seleccionados para este mes.
                  </p>
                  <button 
                    onClick={handleAdd}
                    className="mt-4 bg-[#4D5DFB] text-white px-5 py-2.5 rounded-xl font-bold text-xs hover:bg-[#3B4AD9] transition-all uppercase tracking-wider cursor-pointer"
                  >
                    Crear presupuesto
                  </button>
                </div>
              )}
            </>
          )}

          {/* ===== Historical Spending Chart ===== */}
          {historyData.length > 0 && (
            <div className="card !p-6 mt-8 bg-white border border-[#E2E8F0] shadow-sm rounded-2xl">
              <h3 className="text-lg font-bold text-[#1E293B] mb-4">📊 Historial de Gastos vs Presupuesto</h3>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <BarChart data={historyData} barGap={4} barCategoryGap="20%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748B' }} />
                    <YAxis tick={{ fontSize: 12, fill: '#64748B' }} tickFormatter={(v: number) => fmtMoney(v)} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="total_budgeted" name="Presupuestado" fill="#6366F1" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="total_spent" name="Gastado" radius={[4, 4, 0, 0]}>
                      {historyData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.total_spent > entry.total_budgeted ? '#EF4444' : '#10B981'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* ===== Motivational Comparison Banner ===== */}
          {notifications.length > 0 && (
            <div
              className={`mt-8 p-4 rounded-xl border font-medium text-sm ${
                motivationalMessage.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : motivationalMessage.type === 'warning'
                  ? 'bg-amber-50 border-amber-200 text-amber-700'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              {motivationalMessage.text}
            </div>
          )}

          {/* ===== Historical Alerts Log ===== */}
          {sortedNotifications.length > 0 && (
            <div className="card !p-6 mt-6 bg-white border border-[#E2E8F0] shadow-sm rounded-2xl">
              <h3 className="text-lg font-bold text-[#1E293B] mb-4">📋 Registro de Alertas Históricas</h3>
              <div className="max-h-[400px] overflow-y-auto space-y-3 pr-1">
                {sortedNotifications.map(notif => {
                  const meta = alertMeta(notif.type);
                  const dateStr = new Date(notif.created_at).toLocaleDateString('es-CO', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  });
                  return (
                    <div
                      key={notif.id}
                      className={`flex items-start gap-3 p-3 rounded-xl ${meta.bg} border border-transparent hover:border-[#E2E8F0] transition-colors`}
                    >
                      <div className={`mt-0.5 ${meta.text}`}>{meta.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${meta.badge}`}>
                            {notif.type}
                          </span>
                          <span className="text-[11px] text-[#94A3B8]">{dateStr}</span>
                        </div>
                        <p className="text-sm font-semibold text-[#1E293B] truncate">{notif.title}</p>
                        <p className="text-xs text-[#64748B] line-clamp-2">{notif.message}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <BudgetForm 
          isOpen={isFormOpen} 
          onClose={() => setIsFormOpen(false)} 
          onSuccess={fetchBudgets} 
          budgetToEdit={selectedBudget} 
        />

        <ConfirmModal 
          isOpen={deleteTarget !== null}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDeleteConfirm}
          title="Eliminar Presupuesto"
          message={`¿Estás seguro de que deseas eliminar el presupuesto de "${deleteTarget?.name}"? Esta acción borrará el límite de gasto establecido.`}
          confirmText="Eliminar"
          cancelText="Cancelar"
          type="danger"
        />
      </AnimatedPage>
    </Layout>
  );
};

export default Budgets;
