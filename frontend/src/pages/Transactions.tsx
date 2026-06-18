import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import AnimatedPage from '../components/AnimatedPage';
import { Plus, ArrowDownLeft, ArrowUpRight, Loader2, Tag, Pencil, Trash2 } from 'lucide-react';
import TransactionForm from '../components/TransactionForm';
import CategoryForm from '../components/CategoryForm';
import api from '../services/api';
import type { Transaction } from '../services/api';
import { getCategoryStyle } from '../utils/categoryHelper';
import { fmtMoney } from '../utils/format';
import ConfirmModal from '../components/ConfirmModal';

interface TransactionItemProps {
  name: string;
  category: string;
  categoryIcon?: string | null;
  date: string;
  amount: number;
  type: 'income' | 'expense';
  onEdit: () => void;
  onDelete: () => void;
}

const TransactionItem: React.FC<TransactionItemProps> = ({ 
  name, 
  category, 
  categoryIcon, 
  date, 
  amount, 
  type, 
  onEdit, 
  onDelete 
}) => {
  const catStyle = getCategoryStyle(category, 18);
  
  const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  return (
    <div className="flex items-center justify-between p-4 hover:bg-[#F8FAFC] border border-transparent hover:border-slate-100 rounded-2xl transition-all mb-2 group">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${catStyle.bgOpacityClass}`}>
          {categoryIcon ? categoryIcon : catStyle.icon}
        </div>
        <div>
          <h4 className="font-bold text-[#1E293B] text-base">{name || 'Sin descripción'}</h4>
          <p className="text-xs text-[#64748B] capitalize">{category || 'Sin categoría'} • {formattedDate}</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className={`font-bold text-lg ${type === 'income' ? 'text-[#10B981]' : 'text-[#1E293B]'}`}>
          {type === 'income' ? '+' : '-'}{fmtMoney(amount)}
        </span>
        
        {/* Action buttons shown on hover */}
        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={onEdit} 
            className="p-1.5 text-slate-500 hover:text-[#4D5DFB] hover:bg-indigo-50 rounded-xl transition-all"
            title="Editar transacción"
          >
            <Pencil size={15} />
          </button>
          <button 
            onClick={onDelete} 
            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
            title="Eliminar transacción"
          >
            <Trash2 size={15} />
          </button>
        </div>

        {type === 'income' ? (
          <ArrowDownLeft size={18} className="text-[#10B981] group-hover:hidden" />
        ) : (
          <ArrowUpRight size={18} className="text-[#64748B] group-hover:hidden" />
        )}
      </div>
    </div>
  );
};

const Transactions: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const data = await api.getTransactions();
      setTransactions(data);
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleOpenCreate = () => {
    setSelectedTransaction(null);
    setShowForm(true);
  };

  const handleOpenEdit = (tx: Transaction) => {
    setSelectedTransaction(tx);
    setShowForm(true);
  };

  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await api.deleteTransaction(deleteTarget.id);
      fetchTransactions();
    } catch (err) {
      console.error('Error deleting transaction:', err);
      alert('Error al eliminar la transacción.');
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <Layout title="Transacciones">
      <AnimatedPage>
        <div className="w-full h-full" style={{ maxWidth: '896px', margin: '0 auto' }}>
          {showCategoryForm ? (
            <CategoryForm 
              onClose={() => setShowCategoryForm(false)}
              onSuccess={() => {
                setShowCategoryForm(false);
                fetchTransactions();
              }}
            />
          ) : showForm ? (
            <TransactionForm 
              transactionToEdit={selectedTransaction}
              onClose={() => setShowForm(false)} 
              onSuccess={() => {
                setShowForm(false);
                fetchTransactions();
              }}
            />
          ) : (
            <>
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-slate-800">Transacciones recientes</h2>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowCategoryForm(true)}
                    className="flex items-center gap-2 bg-slate-100 text-[#475569] px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-[#CBD5E1] transition-all"
                  >
                    <Tag size={18} /> Nueva Categoría
                  </button>
                  <button 
                    onClick={handleOpenCreate}
                    className="flex items-center gap-2 bg-indigo-100 text-indigo-600 px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-indigo-200 transition-all uppercase tracking-wider"
                  >
                    <Plus size={18} /> Nueva Transacción
                  </button>
                </div>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center p-20">
                  <Loader2 className="animate-spin text-indigo-600" size={40} />
                </div>
              ) : (
                <div className="card p-6 bg-white border border-[#E2E8F0] shadow-sm rounded-2xl">
                  {transactions.length > 0 ? (
                    transactions.map(tx => (
                      <TransactionItem 
                        key={tx.id}
                        name={tx.description}
                        category={tx.category_name}
                        categoryIcon={tx.category_icon}
                        date={tx.date}
                        amount={tx.amount}
                        type={tx.type}
                        onEdit={() => handleOpenEdit(tx)}
                        onDelete={() => setDeleteTarget({ id: tx.id, name: tx.description || 'Sin descripción' })}
                      />
                    ))
                  ) : (
                    <p className="text-center text-[#64748B] py-10">No hay transacciones registradas.</p>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <ConfirmModal 
          isOpen={deleteTarget !== null}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDeleteConfirm}
          title="Eliminar Transacción"
          message={`¿Estás seguro de que deseas eliminar la transacción "${deleteTarget?.name}"? Esta acción no se puede deshacer.`}
          confirmText="Eliminar"
          cancelText="Cancelar"
          type="danger"
        />
      </AnimatedPage>
    </Layout>
  );
};

export default Transactions;
