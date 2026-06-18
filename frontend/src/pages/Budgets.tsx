import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import AnimatedPage from '../components/AnimatedPage';
import { Plus, Loader2 } from 'lucide-react';
import api from '../services/api';
import type { Budget } from '../services/api';
import { getCategoryStyle } from '../utils/categoryHelper';
import { fmtMoney } from '../utils/format';
import BudgetForm from '../components/BudgetForm';
import ConfirmModal from '../components/ConfirmModal';

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

const Budgets: React.FC = () => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);

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

  useEffect(() => {
    fetchBudgets();
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
