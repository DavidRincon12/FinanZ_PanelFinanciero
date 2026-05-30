import React, { useState, useEffect } from 'react';
import { X, PiggyBank, DollarSign } from 'lucide-react';
import api, { parseAmount } from '../services/api';
import type { Category, Budget } from '../services/api';

interface BudgetFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  budgetToEdit?: Budget | null;
}

const BudgetForm: React.FC<BudgetFormProps> = ({ isOpen, onClose, onSuccess, budgetToEdit }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [category, setCategory] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [warningThreshold, setWarningThreshold] = useState<string>('80');
  const [criticalThreshold, setCriticalThreshold] = useState<string>('100');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      fetchCategories();
      
      if (budgetToEdit) {
        setCategory(budgetToEdit.category.toString());
        setAmount(new Intl.NumberFormat('de-DE').format(budgetToEdit.amount));
        setMonth(budgetToEdit.month);
        setYear(budgetToEdit.year);
        setWarningThreshold(budgetToEdit.warning_threshold?.toString() || '80');
        setCriticalThreshold(budgetToEdit.critical_threshold?.toString() || '100');
      } else {
        setCategory('');
        setAmount('');
        setMonth(new Date().getMonth() + 1);
        setYear(new Date().getFullYear());
        setWarningThreshold('80');
        setCriticalThreshold('100');
      }
    }
  }, [isOpen, budgetToEdit]);

  const fetchCategories = async () => {
    try {
      const data = await api.getCategories();
      setCategories(data);
      if (data.length > 0 && !budgetToEdit) {
        setCategory(data[0].id.toString());
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value === '') {
      setAmount('');
      return;
    }
    const formatted = new Intl.NumberFormat('de-DE').format(parseInt(value));
    setAmount(formatted);
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !amount || !warningThreshold || !criticalThreshold) {
      setError('Por favor completa todos los campos obligatorios.');
      return;
    }

    const numericAmount = parseAmount(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError('El monto debe ser un número positivo.');
      return;
    }

    const warn = parseInt(warningThreshold);
    const crit = parseInt(criticalThreshold);
    if (isNaN(warn) || warn < 1 || warn > 99) {
      setError('El porcentaje de advertencia debe estar entre 1% y 99%.');
      return;
    }

    if (isNaN(crit) || crit < 1 || crit > 100) {
      setError('El porcentaje crítico debe estar entre 1% y 100%.');
      return;
    }

    if (crit <= warn) {
      setError('El porcentaje crítico debe ser mayor al porcentaje de advertencia (al menos +1%).');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (budgetToEdit) {
        await api.updateBudget(budgetToEdit.id, { 
          amount: numericAmount,
          warning_threshold: warn,
          critical_threshold: crit,
        });
      } else {
        await api.createBudget({
          category: parseInt(category),
          amount: numericAmount,
          month,
          year,
          warning_threshold: warn,
          critical_threshold: crit,
        });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al guardar el presupuesto');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const months = [
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' },
  ];

  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear + 1, currentYear + 2];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4">
      <div 
        className="fixed inset-0" 
        onClick={onClose}
      />
      <div className="card w-full max-w-md p-8 bg-white rounded-2xl shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <PiggyBank className="text-[#4D5DFB]" size={24} /> 
            {budgetToEdit ? 'Editar Presupuesto' : 'Añadir Presupuesto'}
          </h2>
          <button onClick={onClose} className="text-[#94A3B8] hover:text-[#475569] transition-colors p-1.5 hover:bg-slate-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-700 text-xs font-semibold rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Category Selector */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Categoría*</label>
            {budgetToEdit ? (
              <div className="w-full px-4 py-3 bg-slate-50 border border-[#E2E8F0] rounded-xl text-slate-600 font-medium">
                {budgetToEdit.category_name}
              </div>
            ) : (
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#4D5DFB] transition-all font-medium text-slate-700"
                required
              >
                <option value="" disabled>Selecciona una categoría</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Amount input */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Límite Mensual*</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">
                <DollarSign size={18} />
              </span>
              <input
                type="text"
                value={amount}
                onChange={handleAmountChange}
                placeholder="Ej: 500.000"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#4D5DFB] transition-all font-bold text-slate-700 text-lg"
                required
              />
            </div>
          </div>

          {/* Month & Year Selectors (only on create) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Mes</label>
              {budgetToEdit ? (
                <div className="w-full px-4 py-3 bg-slate-50 border border-[#E2E8F0] rounded-xl text-slate-500 font-medium">
                  {months.find((m) => m.value === month)?.label}
                </div>
              ) : (
                <select
                  value={month}
                  onChange={(e) => setMonth(parseInt(e.target.value))}
                  className="w-full px-4 py-3 bg-gray-50 border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#4D5DFB] transition-all font-medium text-slate-700"
                >
                  {months.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Año</label>
              {budgetToEdit ? (
                <div className="w-full px-4 py-3 bg-slate-50 border border-[#E2E8F0] rounded-xl text-slate-500 font-medium">
                  {year}
                </div>
              ) : (
                <select
                  value={year}
                  onChange={(e) => setYear(parseInt(e.target.value))}
                  className="w-full px-4 py-3 bg-gray-50 border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#4D5DFB] transition-all font-medium text-slate-700"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Custom Thresholds Selectors */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Advertencia (%)</label>
              <input
                type="number"
                value={warningThreshold}
                onChange={(e) => setWarningThreshold(e.target.value)}
                placeholder="80"
                className="w-full px-4 py-3 bg-gray-50 border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#4D5DFB] transition-all font-semibold text-slate-700 text-sm"
                min="1"
                max="99"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Alerta Crítica (%)</label>
              <input
                type="number"
                value={criticalThreshold}
                onChange={(e) => setCriticalThreshold(e.target.value)}
                placeholder="100"
                className="w-full px-4 py-3 bg-gray-50 border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#4D5DFB] transition-all font-semibold text-slate-700 text-sm"
                min={Math.min(100, (parseInt(warningThreshold) || 1) + 1)}
                max="100"
                required
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-4 pt-4">
            <button 
              type="submit" 
              disabled={isLoading}
              className="flex-1 bg-[#4D5DFB] text-white py-3.5 rounded-xl font-bold hover:bg-[#3B4AD9] transition-all disabled:opacity-50 flex items-center justify-center text-sm shadow-md"
            >
              {isLoading ? 'Guardando...' : budgetToEdit ? 'Guardar Cambios' : 'Añadir'}
            </button>
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 border border-[#E2E8F0] text-[#64748B] py-3.5 rounded-xl font-medium hover:bg-gray-50 transition-all text-sm"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BudgetForm;
