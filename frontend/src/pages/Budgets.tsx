import React, { useEffect, useState, useMemo } from 'react';
import Layout from '../components/Layout';
import AnimatedPage from '../components/AnimatedPage';
import { Plus, Loader2, AlertTriangle, XCircle, Info } from 'lucide-react';
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
  let barColor = color;
  if (percentage >= criticalThreshold) {
    barColor = '#EF4444';
  } else if (percentage >= warningThreshold) {
    barColor = '#F59E0B';
  }

  return (
    <div className="card !p-6 mb-4 bg-white border border-[#E2E8F0] shadow-sm rounded-2xl hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-slate-50 text-xl" style={{ color: categoryIcon ? undefined : color }}>
            {categoryIcon ? categoryIcon : icon}
          </div>
          <div>
            <h4 className="font-bold text-[#1E293B] text-lg">{category}</h4>
            <p className="text-sm text-[#64748B]">{fmtMoney(spent)} de {fmtMoney(total)}</p>
          </div>
        </div>
        <div className="text-xl font-semibold text-[#64748B]">
          {Math.round(percentage)}%
        </div>
      </div>
      
      <div className="w-full bg-[#E2E8F0] h-2.5 rounded-full mb-2 overflow-hidden">
        <div 
          className="h-full rounded-full transition-all duration-500" 
          style={{ 
            width: `${Math.min(percentage, 100)}%`, 
            backgroundColor: barColor 
          }}
        ></div>
      </div>

      <div className="flex justify-between text-[11px] text-[#94A3B8] font-bold mb-5 px-1 uppercase tracking-wider">
        <span>Alerta al {warningThreshold}%</span>
        <span>Crítico al {criticalThreshold}%</span>
      </div>

      <div className="flex gap-4">
        <button 
          onClick={onEdit}
          className="flex-1 py-2.5 px-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm font-semibold text-[#475569] hover:bg-[#F1F5F9] transition-colors"
        >
          Editar Límite
        </button>
        <button 
          onClick={onDelete}
          className="flex-1 py-2.5 px-4 bg-white border border-red-100 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors"
        >
          Eliminar
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

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */
const Budgets: React.FC = () => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);

  // New state for history chart + alerts
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
        <div className="w-full" style={{ maxWidth: '896px', margin: '0 auto' }}>
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-slate-800">Presupuestos establecidos</h2>
            <button 
              onClick={handleAdd}
              className="flex items-center gap-2 bg-indigo-100 text-indigo-600 px-4 py-2.5 rounded-xl font-bold text-xs hover:bg-indigo-200 transition-all uppercase tracking-wider shadow-sm"
            >
              <Plus size={14} /> Establecer Presupuesto
            </button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center p-20">
              <Loader2 className="animate-spin text-indigo-600" size={40} />
            </div>
          ) : (
            <div className="space-y-4">
              {budgets.length > 0 ? (
                budgets.map(budget => {
                  const catStyle = getCategoryStyle(budget.category_name, 22);
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
                })
              ) : (
                <div className="card p-12 text-center border border-[#E2E8F0] rounded-2xl bg-white">
                  <p className="text-[#64748B] font-medium">No hay presupuestos establecidos para este mes.</p>
                  <button 
                    onClick={handleAdd}
                    className="mt-4 bg-[#4D5DFB] text-white px-5 py-2.5 rounded-xl font-bold text-xs hover:bg-[#3B4AD9] transition-all uppercase tracking-wider"
                  >
                    Crear mi primer presupuesto
                  </button>
                </div>
              )}
            </div>
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
