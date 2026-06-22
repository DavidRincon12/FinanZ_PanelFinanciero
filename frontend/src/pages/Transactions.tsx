import React, { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import AnimatedPage from '../components/AnimatedPage';
import { Plus, ArrowDownLeft, ArrowUpRight, Loader2, Tag, Pencil, Trash2, Search, X } from 'lucide-react';
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
  const requestCountRef = useRef(0);

  // Filters State
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [categories, setCategories] = useState<any[]>([]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch custom categories
  const fetchCategories = async () => {
    try {
      const data = await api.getCategories();
      setCategories(data);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchTransactions = async () => {
    setIsLoading(true);
    const currentRequest = ++requestCountRef.current;
    try {
      const data = await api.getTransactions({
        search: debouncedSearch,
        category_id: selectedCat,
        transaction_type: selectedType,
        start_date: startDate,
        end_date: endDate,
      });
      if (currentRequest === requestCountRef.current) {
        setTransactions(data);
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      if (currentRequest === requestCountRef.current) {
        setIsLoading(false);
      }
    }
  };

  // Initial fetch for categories
  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch transactions when filters change
  useEffect(() => {
    fetchTransactions();
  }, [debouncedSearch, selectedCat, selectedType, startDate, endDate]);

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
                fetchCategories();
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

              {/* Glassmorphic Filters Panel */}
              <div className="mb-6 p-6 rounded-2xl bg-white/60 backdrop-blur-md border border-[#E2E8F0] shadow-sm flex flex-col gap-4">
                {/* Row 1: Search & Category */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Description Search */}
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Search size={18} />
                    </div>
                    <input
                      type="text"
                      placeholder="Buscar por descripción..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-white/80 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#4D5DFB]/20 focus:border-[#4D5DFB] transition-all placeholder-slate-400"
                    />
                  </div>

                  {/* Category select */}
                  <div className="relative">
                    <select
                      value={selectedCat}
                      onChange={(e) => setSelectedCat(e.target.value)}
                      className="w-full pl-4 pr-10 py-2.5 bg-white/80 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#4D5DFB]/20 focus:border-[#4D5DFB] transition-all appearance-none cursor-pointer"
                    >
                      <option value="">Todas las categorías</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                      <Tag size={16} />
                    </div>
                  </div>
                </div>

                {/* Row 2: Type Tabs, Date Ranges & Reset */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                  {/* Type Tabs */}
                  <div className="lg:col-span-4 flex bg-slate-100/80 p-1 rounded-xl">
                    <button
                      onClick={() => setSelectedType('')}
                      className={`flex-1 text-center py-1.5 text-xs font-semibold rounded-lg transition-all ${
                        selectedType === ''
                          ? 'bg-white text-[#1E293B] shadow-sm'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Todos
                    </button>
                    <button
                      onClick={() => setSelectedType('income')}
                      className={`flex-1 text-center py-1.5 text-xs font-semibold rounded-lg transition-all ${
                        selectedType === 'income'
                          ? 'bg-white text-emerald-600 shadow-sm'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Ingresos
                    </button>
                    <button
                      onClick={() => setSelectedType('expense')}
                      className={`flex-1 text-center py-1.5 text-xs font-semibold rounded-lg transition-all ${
                        selectedType === 'expense'
                          ? 'bg-white text-rose-600 shadow-sm'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Gastos
                    </button>
                  </div>

                  {/* Date Ranges */}
                  <div className="lg:col-span-6 grid grid-cols-2 gap-3">
                    <div className="relative">
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-3 py-2 bg-white/80 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-[#4D5DFB]/20 focus:border-[#4D5DFB] transition-all"
                      />
                      <span className="absolute -top-2 left-3 bg-white px-1.5 text-[9px] text-slate-400 font-bold uppercase tracking-wider">Desde</span>
                    </div>
                    <div className="relative">
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full px-3 py-2 bg-white/80 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-[#4D5DFB]/20 focus:border-[#4D5DFB] transition-all"
                      />
                      <span className="absolute -top-2 left-3 bg-white px-1.5 text-[9px] text-slate-400 font-bold uppercase tracking-wider">Hasta</span>
                    </div>
                  </div>

                  {/* Reset button */}
                  <div className="lg:col-span-2 flex justify-end">
                    {(search || selectedCat || selectedType || startDate || endDate) ? (
                      <button
                        onClick={() => {
                          setSearch('');
                          setSelectedCat('');
                          setSelectedType('');
                          setStartDate('');
                          setEndDate('');
                        }}
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-500 hover:text-[#4D5DFB] hover:bg-[#4D5DFB]/5 rounded-xl transition-all border border-slate-200 hover:border-[#4D5DFB]/30"
                      >
                        <X size={14} /> Limpiar
                      </button>
                    ) : (
                      <div className="w-full text-center py-2 text-xs text-slate-400 font-medium select-none">
                        Búsqueda y filtros
                      </div>
                    )}
                  </div>
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
                    <p className="text-center text-[#64748B] py-10">No hay transacciones que coincidan con los filtros.</p>
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
