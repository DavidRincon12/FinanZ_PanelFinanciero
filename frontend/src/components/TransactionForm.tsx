import React, { useState, useRef, useEffect } from 'react';
import { Download, Upload, Calendar, DollarSign, X } from 'lucide-react';
import api, { parseAmount } from '../services/api';
import type { Category } from '../services/api';

interface TransactionFormProps {
  onClose?: () => void;
  onSuccess?: () => void;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ onClose, onSuccess }) => {
  const [type, setType] = useState<'income' | 'expense'>('income');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const dateInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await api.getCategories();
        setCategories(data);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    fetchCategories();
  }, []);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value === '') {
      setAmount('');
      return;
    }
    const formatted = new Intl.NumberFormat('de-DE').format(parseInt(value));
    setAmount(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !category || !date) {
      alert('Por favor completa los campos obligatorios');
      return;
    }

    setIsLoading(true);
    try {
      await api.createTransaction({
        type,
        amount: parseAmount(amount),
        category: parseInt(category),
        date,
        description
      });
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (err) {
      console.error('Error creating transaction:', err);
      alert('Error al crear la transacción. Asegúrate de estar autenticado en el backend.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleIconCalendarClick = () => {
    if (dateInputRef.current) {
      dateInputRef.current.showPicker();
    }
  };

  return (
    <div className="card p-8 shadow-lg animate-in fade-in zoom-in duration-300" style={{ maxWidth: '672px', margin: '0 auto', borderColor: '#E0E7FF' }}>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-xl font-bold text-slate-800">Nueva Transacción</h2>
        {onClose && (
          <button onClick={onClose} className="text-[#94A3B8] hover:text-[#475569] transition-colors">
            <X size={20} />
          </button>
        )}
      </div>

      <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
        {/* Type Selection */}
        <div>
          <label className="block text-sm font-bold text-slate-800 mb-4">Tipo*</label>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer group" onClick={() => setType('income')}>
              <div style={{ position: 'relative' }}>
                <input type="radio" name="type" className="hidden" checked={type === 'income'} onChange={() => {}} />
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
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-bold text-slate-800 mb-2">Monto*</label>
          <div className="relative group">
            <div className={`absolute left-4 top-50% -translate-y-1/2 transition-colors ${amount ? 'text-emerald-600' : 'text-[#94A3B8]'}`} style={{ top: '50%' }}>
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
            onChange={(e) => setCategory(e.target.value)}
            required
            className="w-full px-4 py-3 bg-gray-50 border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#4D5DFB] focus:bg-white cursor-pointer transition-all"
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
              className="absolute right-4 top-50% -translate-y-1/2 text-[#94A3B8] hover:text-[#4D5DFB] cursor-pointer transition-colors" 
              style={{ top: '50%' }}
            >
              <Calendar size={18} />
            </div>
            <input 
              type="date"
              ref={dateInputRef}
              value={date}
              required
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#4D5DFB] focus:bg-white transition-all uppercase text-xs font-bold text-[#64748B]"
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
            className="w-full px-4 py-3 bg-gray-50 border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#4D5DFB] focus:bg-white transition-all"
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
            {isLoading ? 'Cargando...' : `Registrar ${type === 'income' ? 'Ingreso' : 'Egreso'}`}
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
