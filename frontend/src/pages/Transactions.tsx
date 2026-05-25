import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import AnimatedPage from '../components/AnimatedPage';
import { Plus, ArrowDownLeft, ArrowUpRight, Loader2, Tag } from 'lucide-react';
import TransactionForm from '../components/TransactionForm';
import CategoryForm from '../components/CategoryForm';
import api from '../services/api';
import type { Transaction } from '../services/api';
import { getCategoryStyle } from '../utils/categoryHelper';
import { fmtMoney } from '../utils/format';

const TransactionItem = ({ name, category, categoryIcon, date, amount, type }: any) => {
  const catStyle = getCategoryStyle(category, 18);
  return (
    <div className="flex items-center justify-between p-4 hover:bg-[#F8FAFC] rounded-2xl transition-colors mb-2">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${catStyle.bgOpacityClass}`}>
          {categoryIcon ? categoryIcon : catStyle.icon}
        </div>
        <div>
          <h4 className="font-bold text-[#1E293B]">{name || 'Sin descripción'}</h4>
          <p className="text-sm text-[#64748B] capitalize">{category || 'Sin categoría'} - {new Date(date).toLocaleDateString()}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className={`font-bold text-lg ${type === 'income' ? 'text-[#10B981]' : 'text-[#1E293B]'}`}>
          {type === 'income' ? '+' : '-'}{fmtMoney(amount)}
        </span>
        {type === 'income' ? (
          <ArrowDownLeft size={18} className="text-[#10B981]" />
        ) : (
          <ArrowUpRight size={18} className="text-[#64748B]" />
        )}
      </div>
    </div>
  );
};

const Transactions: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
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

  return (
    <Layout title="Transacciones">
      <AnimatedPage>
        <div className="w-full h-full" style={{ maxWidth: '896px', margin: '0 auto' }}>
          {showCategoryForm ? (
            <CategoryForm 
              onClose={() => setShowCategoryForm(false)}
              onSuccess={() => {
                setShowCategoryForm(false);
                fetchTransactions(); // Refresh if needed (though categories are usually separate)
              }}
            />
          ) : showForm ? (
            <TransactionForm 
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
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 bg-indigo-100 text-[#475569] px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-[#CBD5E1] transition-all"
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
                <div className="card p-6">
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
      </AnimatedPage>
    </Layout>
  );
};

export default Transactions;
