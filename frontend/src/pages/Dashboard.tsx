import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import AnimatedPage from '../components/AnimatedPage';
import { AlertCircle } from 'lucide-react';
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../services/api';
import type { Transaction } from '../services/api';
import { getCategoryStyle } from '../utils/categoryHelper';
import { fmtMoney } from '../utils/format';


const StatCard = ({ title, value, subtext, icon, color, buttonLabel }: any) => (
  <div className="card h-full flex flex-col items-center justify-center text-center p-6">
    <h3 className="text-slate-800 font-bold mb-4">{title}</h3>
    <div className="flex items-center gap-4 mb-4">
       {icon && (
         <div className={`p-4 rounded-2xl ${color === 'green' ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-600'}`}>
            {icon}
         </div>
       )}
       {value !== undefined && (
         <div className={`text-4xl font-bold ${color === 'green' ? 'text-emerald-600' : 'text-slate-800'}`}>
           {typeof value === 'string' && value.startsWith('$') ? value : fmtMoney(value)}
         </div>
       )}
       {subtext && <p className="text-slate-800 font-medium">{subtext}</p>}
    </div>
    <button className="w-full max-w-[200px] py-1-5 px-4 bg-gray-50 border border-[#E2E8F0] rounded-lg text-xs font-medium text-slate-600 hover:bg-[#F1F5F9] transition-all">
      {buttonLabel}
    </button>
  </div>
);

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
  const [balanceData,  setBalanceData]    = useState<any[]>([]);
  const [pieData,      setPieData]        = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [txs, balanceRes, expensesRes, balance] = await Promise.all([
          api.getTransactions(),
          api.getBalance(),
          api.getExpensesByCategory(),
          api.getTotalBalance(),
        ]);

        setTransactions(txs.slice(0, 5));
        setTotalBalance(balance);
        setBalanceData(balanceRes.data || []);

        const mappedPieData = (expensesRes.data || []).map((item: any) => ({
          name: item.category,
          value: item.total
        }));
        setPieData(mappedPieData);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      }
    };
    fetchData();
  }, []);

  return (
    <Layout title="Dashboard">
      <AnimatedPage>
        <div className="grid grid-cols-12 gap-6">
          
          {/* Row 1: Balance & Alertas */}
          <div className="col-span-12 lg:col-span-4">
            <div className="card h-full flex flex-col items-center justify-center text-center p-6">
              <h3 className="text-slate-800 font-bold mb-4">Balance General</h3>
              <div className="flex items-center gap-4 mb-4">
                <div className={`text-4xl font-bold ${
                  totalBalance === null ? 'text-slate-400'
                  : totalBalance >= 0   ? 'text-emerald-600'
                  :                      'text-red-500'
                }`}>
                  {totalBalance === null
                    ? '…'
                    : (totalBalance < 0 ? '-' : '') + fmtMoney(Math.abs(totalBalance))
                  }
                </div>
              </div>
              <button className="w-full max-w-[200px] py-1.5 px-4 bg-gray-50 border border-[#E2E8F0] rounded-lg text-xs font-medium text-slate-600 hover:bg-[#F1F5F9] transition-all">
                Ver historial
              </button>
            </div>
          </div>
          <div className="col-span-12 lg:col-span-8">
            <div className="card h-full flex flex-col items-center justify-center text-center p-6">
               <h3 className="text-slate-700 font-bold mb-4">Alertas de Presupuesto</h3>
               <div className="flex items-center gap-6 mb-6">
                  <div className="w-14 h-14 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center">
                     <AlertCircle size={32} />
                   </div>
                  <p className="text-lg font-bold text-slate-800">Cargando alertas del backend...</p>
               </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="col-span-12 lg:col-span-8">
            <div className="card h-full min-h-[450px]">
              <div className="flex justify-between items-center mb-8">
                <h3 className="font-bold text-lg text-[#1E293B]">Balance mensual histórico</h3>
              </div>
              <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={balanceData}>
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 12}} dy={10} />
                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none' }} />
                    <Line type="monotone" dataKey="balance" stroke="#10B981" strokeWidth={4} dot={{ r: 6 }} />
                  </LineChart>
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

          {/* Row 3: Transactions */}
          <div className="col-span-12">
            <div className="card">
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
                    {transactions.map(tx => (
                      <TransactionRow 
                        key={tx.id}
                        date={tx.date}
                        category={tx.category_name}
                        categoryIcon={tx.category_icon}
                        description={tx.description}
                        amount={tx.amount}
                        type={tx.type}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </AnimatedPage>
    </Layout>
  );
};

export default Dashboard;
