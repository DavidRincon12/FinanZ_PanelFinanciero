import React, { useState } from 'react';
import { X, Tag, Smile } from 'lucide-react';
import api from '../services/api';

interface CategoryFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

const CategoryForm: React.FC<CategoryFormProps> = ({ onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('💰');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    try {
      await api.createCategory({ name, icon });
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error creating category:', err);
      alert(err.message || 'Error al crear la categoría');
    } finally {
      setIsLoading(false);
    }
  };

  const icons = ['💰', '🍔', '🚗', '🏠', '🎁', '🏥', '🎮', '✈️', '🛒', '🎓', '👗', '💼', '⚡'];

  return (
    <div className="card max-w-md mx-auto p-8 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Tag className="text-[#4D5DFB]" size={24} /> Nueva Categoría
        </h2>
        <button onClick={onClose} className="text-[#94A3B8] hover:text-[#475569] transition-colors">
          <X size={24} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Nombre de la categoría*</label>
          <input 
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Gimnasio, Suscripciones..." 
            className="w-full px-4 py-3 bg-gray-50 border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#4D5DFB] transition-all"
            required
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
            <Smile size={16} /> Selecciona un ícono
          </label>
          <div className="grid grid-cols-6 gap-2">
            {icons.map(emoji => (
              <button
                key={emoji}
                type="button"
                onClick={() => setIcon(emoji)}
                className={`text-2xl p-2 rounded-lg transition-all ${icon === emoji ? 'bg-indigo-100 scale-110 shadow-sm' : 'hover:bg-gray-100'}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <button 
            type="submit" 
            disabled={isLoading}
            className="flex-1 bg-[#4D5DFB] text-white py-3.5 rounded-xl font-bold hover:bg-[#3B4AD9] transition-all disabled:opacity-50"
          >
            {isLoading ? 'Guardando...' : 'Crear Categoría'}
          </button>
          <button 
            type="button" 
            onClick={onClose}
            className="flex-1 border border-[#E2E8F0] text-[#64748B] py-3.5 rounded-xl font-medium hover:bg-gray-50 transition-all"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};

export default CategoryForm;
