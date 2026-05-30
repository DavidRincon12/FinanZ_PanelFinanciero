import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import AnimatedPage from '../components/AnimatedPage';
import { AlertCircle, Wallet, TrendingUp, TrendingDown, Target, ArrowRight, Loader2 } from 'lucide-react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from 'recharts';
import api from '../services/api';
import type { Transaction, SavingsGoal, AppNotification } from '../services/api';
import { getCategoryStyle } from '../utils/categoryHelper';
import { fmtMoney } from '../utils/format';

const TransactionRow = ({ date, category, categoryIcon, description, amount, type }: any) => {
  const catStyle = getCategoryStyle(category, 16);
  return (
    <tr className="border-b">
      <td className="py-4 text-sm text-[#64748B]">{new Date(date).toLocaleDateString()}</td>
      <td className="py-4 text-sm font-medium text-slate-700">
        <span className="flex items-center gap-2">
          <span className="w-6 h-6 rounded flex items-center justify-center bg-slate-50 text-sm">
            {categoryIcon ? categoryIcon : catStyle.icon}
          </span>
          {category || 'Sin categoría'}
        </span>
      </td>
      <td className="py-4 text-sm text-[#64748B]">{description || 'Sin descripción'}</td>
      <td className={`py-4 text-sm font-bold text-right ${type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
        {type === 'income' ? '+' : '-'}{fmtMoney(parseFloat(String(amount)))}
      </td>
    </tr>
  );
};

const Dashboard: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalBalance, setTotalBalance]   = useState<number | null>(null);
  const [monthIncome, setMonthIncome]     = useState<number>(0);
  const [monthExpense, setMonthExpense]   = useState<number>(0);
  const [balanceData,  setBalanceData]    = useState<any[]>([]);
  const [pieData,      setPieData]        = useState<any[]>([]);
  const [goals, setGoals]                 = useState<SavingsGoal[]>([]);
  const [alerts, setAlerts]               = useState<AppNotification[]>([]);
  const [isLoadingAlerts, setIsLoadingAlerts] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [txs, balanceRes, expensesRes, balanceSummary, goalsRes, alertsRes] = await Promise.all([
          api.getTransactions(),
          api.getBalance(),
          api.getExpensesByCategory(),
          api.getTotalBalance(),
          api.getGoals(),
          api.getNotifications()
        ]);

        setTransactions(txs.slice(0, 5));
        setTotalBalance(balanceSummary.balance);
        setMonthIncome(balanceSummary.month_income);
        setMonthExpense(balanceSummary.month_expense);
        setBalanceData(balanceRes.data || []);
        setGoals(goalsRes);
        // Filtramos notificaciones no leídas y de tipo alerta
        setAlerts(alertsRes.filter(n => !n.is_read && (n.type === 'warning' || n.type === 'critical')));
        setIsLoadingAlerts(false);

        const mappedPieData = (expensesRes.data || []).map((item: any) => ({
          name: item.category,
          value: item.total
        }));
        setPieData(mappedPieData);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setIsLoadingAlerts(false);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <Layout title="Dashboard">
      <AnimatedPage>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <Loader2 className="animate-spin text-[#4D5DFB] mb-4" size={48} />
            <p className="text-slate-500 font-medium animate-pulse">Cargando tu resumen financiero...</p>
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-6">
          
          {/* Row 1: Metrics Cards */}
          <div className="col-span-12 md:col-span-4">
            <div className="card h-full p-6 relative overflow-hidden bg-white border border-[#E2E8F0] shadow-sm rounded-2xl flex flex-col justify-between">
              <div>
                <span className="text-[#94A3B8] font-bold text-xs uppercase tracking-wider">Balance General</span>
                <h3 className={`text-3xl font-black mt-2 ${
                  totalBalance === null ? 'text-slate-400'
                  : totalBalance >= 0 ? 'text-emerald-600'
                  : 'text-red-500'
                }`}>
                  {totalBalance === null
                    ? '…'
                    : (totalBalance < 0 ? '-' : '') + fmtMoney(Math.abs(totalBalance))
                  }
                </h3>
              </div>
              <div className="flex items-center justify-between mt-4">
                <span className="text-xs text-[#64748B] font-medium">Acumulado total</span>
                <span className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500">
                  <Wallet size={20} />
                </span>
              </div>
            </div>
          </div>

          <div className="col-span-12 md:col-span-4">
            <div className="card h-full p-6 relative overflow-hidden bg-white border border-[#E2E8F0] shadow-sm rounded-2xl flex flex-col justify-between">
              <div>
                <span className="text-[#94A3B8] font-bold text-xs uppercase tracking-wider">Ingresos del Mes</span>
                <h3 className="text-3xl font-black mt-2 text-emerald-600">
                  {fmtMoney(monthIncome)}
                </h3>
              </div>
              <div className="flex items-center justify-between mt-4">
                <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <TrendingUp size={12} /> Entradas
                </span>
                <span className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <TrendingUp size={20} />
                </span>
              </div>
            </div>
          </div>

          <div className="col-span-12 md:col-span-4">
            <div className="card h-full p-6 relative overflow-hidden bg-white border border-[#E2E8F0] shadow-sm rounded-2xl flex flex-col justify-between">
              <div>
                <span className="text-[#94A3B8] font-bold text-xs uppercase tracking-wider">Egresos del Mes</span>
                <h3 className="text-3xl font-black mt-2 text-red-500">
                  {fmtMoney(monthExpense)}
                </h3>
              </div>
              <div className="flex items-center justify-between mt-4">
                <span className="text-xs text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <TrendingDown size={12} /> Salidas
                </span>
                <span className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500">
                  <TrendingDown size={20} />
                </span>
              </div>
            </div>
          </div>

          {/* Row 2: Charts */}
          <div className="col-span-12 lg:col-span-8">
            <div className="card h-full min-h-[450px] p-6">
              <div className="flex justify-between items-center mb-8">
                <h3 className="font-bold text-lg text-[#1E293B]">Balance mensual histórico</h3>
              </div>
              <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={balanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4D5DFB" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#4D5DFB" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="month" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#94A3B8', fontSize: 12}} 
                      dy={10} 
                    />
                    <CartesianGrid 
                      strokeDasharray="3 3" 
                      vertical={false} 
                      stroke="#F1F5F9" 
                    />
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: '16px', 
                        border: '1px solid #E2E8F0',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)',
                        background: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(4px)',
                        padding: '12px'
                      }} 
                      labelStyle={{ fontWeight: 'bold', color: '#1E293B', marginBottom: '4px' }}
                      itemStyle={{ fontWeight: 'bold', color: '#4D5DFB' }}
                      formatter={(value: any) => [fmtMoney(parseFloat(String(value))), 'Balance']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="balance" 
                      stroke="#4D5DFB" 
                      strokeWidth={4} 
                      fillOpacity={1} 
                      fill="url(#colorBalance)" 
                      dot={{ r: 4, strokeWidth: 2, fill: '#FFFFFF', stroke: '#4D5DFB' }}
                      activeDot={{ r: 6, strokeWidth: 0, fill: '#4D5DFB' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-4">
            <div className="card h-full">
              <h3 className="font-bold text-slate-800 mb-6">Gastos por categoría</h3>
              <div style={{ height: '220px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {pieData.map((entry, index) => {
                        const catStyle = getCategoryStyle(entry.name);
                        return <Cell key={`cell-${index}`} fill={catStyle.colorHex} />;
                      })}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              {/* Legend with percentages */}
              <div className="mt-6 space-y-2">
                {pieData.map((item, index) => {
                  const catStyle = getCategoryStyle(item.name);
                  const totalSpent = pieData.reduce((acc, curr) => acc + curr.value, 0);
                  const percentage = totalSpent > 0 ? Math.round((item.value / totalSpent) * 100) : 0;
                  return (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: catStyle.colorHex }}></div>
                        <span className="text-sm font-medium text-slate-600">{item.name}</span>
                      </div>
                      <span className="text-sm font-bold text-slate-800">{percentage}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Row 3: Transactions on left, Metas/Alerts on right */}
          <div className="col-span-12 lg:col-span-8">
            <div className="card h-full">
              <h3 className="font-bold text-slate-800 mb-6">Últimas Transacciones</h3>
              <div style={{ overflowX: 'auto' }}>
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs font-bold text-[#94A3B8] uppercase">
                      <th className="pb-4">Fecha</th>
                      <th className="pb-4">Categoría</th>
                      <th className="pb-4">Descripción</th>
                      <th className="pb-4 text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.length > 0 ? (
                      transactions.map(tx => (
                        <TransactionRow 
                          key={tx.id}
                          date={tx.date}
                          category={tx.category_name}
                          categoryIcon={tx.category_icon}
                          description={tx.description}
                          amount={tx.amount}
                          type={tx.type}
                        />
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-slate-400 text-sm">
                          No hay transacciones recientes.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
            {/* Alertas de Presupuesto */}
            <div className="card">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2">
                  <AlertCircle size={16} className="text-orange-500" /> Alertas del Mes
                </h3>
              </div>
              {isLoadingAlerts ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="animate-spin text-[#4D5DFB]" size={24} />
                </div>
              ) : alerts.length > 0 ? (
                <div className="space-y-3 max-h-[180px] overflow-y-auto pr-1">
                  {alerts.map(alert => (
                    <div key={alert.id} className={`p-3 rounded-xl border flex gap-3 items-start ${
                      alert.type === 'critical' 
                        ? 'bg-red-50/50 border-red-100 text-red-700' 
                        : 'bg-amber-50/50 border-amber-100 text-amber-700'
                    }`}>
                      <AlertCircle className="flex-shrink-0 mt-0.5" size={16} />
                      <div>
                        <p className="text-xs font-bold">{alert.title}</p>
                        <p className="text-[11px] opacity-90 mt-0.5 leading-snug">{alert.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl flex items-center gap-3">
                  <span className="text-xl">✓</span>
                  <div>
                    <p className="text-xs font-bold">¡Todo en orden!</p>
                    <p className="text-[10px] opacity-90 mt-0.5">No tienes alertas de presupuesto activas este mes.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Metas de Ahorro */}
            <div className="card">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2">
                  <Target size={16} className="text-indigo-500" /> Metas de Ahorro
                </h3>
                <a href="/goals" className="text-xs font-bold text-[#4D5DFB] hover:underline flex items-center gap-1">
                  Ver todas <ArrowRight size={12} />
                </a>
              </div>
              {goals.length > 0 ? (
                <div className="space-y-3">
                  {goals.slice(0, 3).map(goal => {
                    const percent = parseFloat(String(goal.progress_percent));
                    const completed = goal.status === 'completed';
                    const color = completed ? '#10B981' : percent > 75 ? '#F59E0B' : '#4D5DFB';
                    return (
                      <div key={goal.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-3">
                        <span className="text-2xl flex-shrink-0">{goal.icon || '🎯'}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-1">
                            <p className="text-xs font-bold text-slate-700 truncate">{goal.name}</p>
                            <span className="text-xs font-extrabold" style={{ color }}>{percent.toFixed(0)}%</span>
                          </div>
                          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full transition-all duration-500" 
                              style={{ width: `${Math.min(percent, 100)}%`, backgroundColor: color }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6 text-slate-400 text-xs">
                  No tienes metas de ahorro activas.
                  <br />
                  <a href="/goals" className="mt-2 inline-block font-bold text-[#4D5DFB] hover:underline">
                    Crear meta
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
        )}
      </AnimatedPage>
    </Layout>
  );
};

export default Dashboard;
