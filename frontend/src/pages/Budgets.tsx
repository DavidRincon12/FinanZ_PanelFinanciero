import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import AnimatedPage from '../components/AnimatedPage';
import { Plus, Loader2 } from 'lucide-react';
import api from '../services/api';
import type { Budget } from '../services/api';
import { getCategoryStyle } from '../utils/categoryHelper';
import { fmtMoney } from '../utils/format';

const BudgetCard = ({ category, categoryIcon, spent, total, percentage, icon, color }: any) => (
  <div className="card !p-6 mb-4">
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
      <div className="text-xl font-medium text-[#94A3B8]">
        {Math.round(percentage)}%
      </div>
    </div>
    
    <div className="w-full bg-[#E2E8F0] h-2.5 rounded-full mb-6 overflow-hidden">
      <div 
        className="h-full rounded-full transition-all duration-500" 
        style={{ 
          width: `${Math.min(percentage, 100)}%`, 
          backgroundColor: percentage > 100 ? '#EF4444' : color 
        }}
      ></div>
    </div>

    <div className="flex gap-4">
      <button className="flex-1 py-2 px-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm font-medium text-[#475569] hover:bg-[#F1F5F9] transition-colors">
        Editar
      </button>
      <button className="flex-1 py-2 px-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm font-medium text-[#475569] hover:bg-[#F1F5F9] transition-colors">
        Eliminar
      </button>
    </div>
  </div>
);

const Budgets: React.FC = () => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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
    fetchBudgets();
  }, []);

  return (
    <Layout title="Presupuestos">
      <AnimatedPage>
        <div className="w-full" style={{ maxWidth: '896px', margin: '0 auto' }}>
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-slate-800">Presupuestos establecidos</h2>
            <button className="flex items-center gap-2 bg-indigo-100 text-indigo-600 px-4 py-2 rounded-xl font-bold text-xs hover:bg-indigo-200 transition-all uppercase tracking-wider">
              <Plus size={14} /> Añadir Categoría
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
                    />
                  );
                })
              ) : (
                <p className="text-center text-[#64748B] py-10">No hay presupuestos establecidos.</p>
              )}
            </div>
          )}
        </div>
      </AnimatedPage>
    </Layout>
  );
};

export default Budgets;
