import React, { useState, useRef, useEffect } from 'react';
import { Download, Upload, Calendar, DollarSign, X } from 'lucide-react';
import api, { parseAmount } from '../services/api';
import type { Category, Budget } from '../services/api';

interface TransactionFormProps {
  onClose?: () => void;
  onSuccess?: () => void;
  transactionToEdit?: any | null;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ onClose, onSuccess, transactionToEdit }) => {
  const [type, setType] = useState<'income' | 'expense'>('income');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const dateInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [cats, budgs] = await Promise.all([
          api.getCategories(),
          api.getBudgets(),
        ]);
        setCategories(cats);
        setBudgets(budgs);

        if (transactionToEdit) {
          setType(transactionToEdit.type);
          setAmount(new Intl.NumberFormat('de-DE').format(transactionToEdit.amount));
          setDate(transactionToEdit.date);
          setCategory(transactionToEdit.category.toString());
          setDescription(transactionToEdit.description || '');
        }
      } catch (err) {
        console.error('Error fetching form data:', err);
      }
    };
    loadData();
  }, [transactionToEdit]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value === '') {
      setAmount('');
      return;
    }
    const formatted = new Intl.NumberFormat('de-DE').format(parseInt(value));
    setAmount(formatted);
  };

  const handleCategoryChange = (catId: string) => {
    setCategory(catId);
    if (!catId) return;

    // If selected category has a budget, force the type to expense
    const hasBudget = budgets.some(b => b.category === parseInt(catId));
    if (hasBudget) {
      setType('expense');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !category || !date) {
      alert('Por favor completa los campos obligatorios');
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        type,
        amount: parseAmount(amount),
        category: parseInt(category),
        date,
        description
      };

      if (transactionToEdit) {
        await api.updateTransaction(transactionToEdit.id, payload);
      } else {
        await api.createTransaction(payload);
      }
      
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (err) {
      console.error('Error saving transaction:', err);
      alert('Error al guardar la transacción.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleIconCalendarClick = () => {
    if (dateInputRef.current) {
      dateInputRef.current.showPicker();
    }
  };

  const isIncomeDisabled = budgets.some(b => b.category === parseInt(category));

  return (
    <div className="card p-8 bg-white border border-[#E0E7FF] shadow-lg animate-in fade-in zoom-in duration-300 rounded-2xl" style={{ maxWidth: '672px', margin: '0 auto' }}>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-xl font-bold text-slate-800">
          {transactionToEdit ? 'Editar Transacción' : 'Nueva Transacción'}
        </h2>
        {onClose && (
          <button onClick={onClose} className="text-[#94A3B8] hover:text-[#475569] transition-colors p-1.5 hover:bg-slate-100 rounded-lg">
            <X size={20} />
          </button>
        )}
      </div>

      <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
        {/* Type Selection */}
        <div>
          <label className="block text-sm font-bold text-slate-800 mb-4">Tipo*</label>
          <div className="flex gap-6">
            <label 
              className={`flex items-center gap-2 transition-all ${isIncomeDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer group'}`} 
              onClick={() => {
                if (!isIncomeDisabled) setType('income');
              }}
            >
              <div style={{ position: 'relative' }}>
                <input type="radio" name="type" className="hidden" checked={type === 'income'} disabled={isIncomeDisabled} onChange={() => {}} />
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${type === 'income' ? 'border-[#10B981]' : 'border-[#CBD5E1]'}`}>
                   {type === 'income' && <div className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-in zoom-in duration-200"></div>}
                </div>
              </div>
              <span className={`flex items-center gap-2 text-sm font-medium transition-colors ${type === 'income' ? 'text-[#1E293B]' : 'text-[#64748B]'}`}>
                <Download size={16} className={type === 'income' ? 'text-emerald-600' : 'text-[#94A3B8]'} /> Ingreso
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer group" onClick={() => setType('expense')}>
              <div style={{ position: 'relative' }}>
                <input type="radio" name="type" className="hidden" checked={type === 'expense'} onChange={() => {}} />
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${type === 'expense' ? 'border-[#EF4444]' : 'border-[#CBD5E1]'}`}>
                   {type === 'expense' && <div className="w-2.5 h-2.5 rounded-full bg-[#EF4444] animate-in zoom-in duration-200"></div>}
                </div>
              </div>
              <span className={`flex items-center gap-2 text-sm font-medium transition-colors ${type === 'expense' ? 'text-[#1E293B]' : 'text-[#64748B]'}`}>
                <Upload size={16} className={type === 'expense' ? 'text-red-600' : 'text-[#94A3B8]'} /> Egreso
              </span>
            </label>
          </div>
          {isIncomeDisabled && (
            <p className="text-[11px] text-red-500 font-semibold mt-2 animate-in fade-in duration-200">
              * Esta categoría tiene un presupuesto establecido, por lo que solo permite registrar egresos.
            </p>
          )}
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-bold text-slate-800 mb-2">Monto*</label>
          <div className="relative group">
            <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${amount ? 'text-[#4D5DFB]' : 'text-[#94A3B8]'}`}>
              <DollarSign size={18} />
            </div>
            <input 
              type="text" 
              value={amount}
              onChange={handleAmountChange}
              placeholder="0.00" 
              required
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#4D5DFB] focus:bg-white transition-all text-lg font-bold text-slate-700"
            />
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-bold text-slate-800 mb-2">Categoría *</label>
          <select 
            value={category}
            onChange={(e) => handleCategoryChange(e.target.value)}
            required
            className="w-full px-4 py-3 bg-gray-50 border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#4D5DFB] focus:bg-white cursor-pointer transition-all font-medium text-slate-750"
          >
            <option value="">Seleccione una categoría</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.icon ? `${cat.icon} ` : ''}{cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-bold text-slate-800 mb-2">Fecha *</label>
          <div className="relative group">
            <div 
              onClick={handleIconCalendarClick}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#4D5DFB] cursor-pointer transition-colors"
            >
              <Calendar size={18} />
            </div>
            <input 
              type="date"
              ref={dateInputRef}
              value={date}
              required
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#4D5DFB] focus:bg-white transition-all text-sm font-bold text-[#64748B]"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-bold text-slate-800 mb-2">Descripción</label>
          <input 
            type="text" 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ej: Mercado semanal" 
            className="w-full px-4 py-3 bg-gray-50 border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#4D5DFB] focus:bg-white transition-all font-medium text-slate-700"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-4 mt-4">
          <button 
            type="submit" 
            disabled={isLoading}
            className={`flex-1 text-white py-4 rounded-xl font-bold transition-all shadow-lg active:scale-95 disabled:opacity-50 ${
              type === 'income' ? 'bg-[#10B981] hover:bg-[#059669]' : 'bg-[#EF4444] hover:bg-[#DC2626]'
            }`}
          >
            {isLoading ? 'Cargando...' : transactionToEdit ? 'Guardar Cambios' : `Registrar ${type === 'income' ? 'Ingreso' : 'Egreso'}`}
          </button>
          <button 
            type="button" 
            onClick={onClose} 
            className="flex-1 border border-[#E2E8F0] text-[#64748B] py-4 rounded-xl font-medium hover:bg-gray-50 transition-all active:scale-95"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};

export default TransactionForm;
