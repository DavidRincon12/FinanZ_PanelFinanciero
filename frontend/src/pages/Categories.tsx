import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import AnimatedPage from '../components/AnimatedPage';
import { Plus, Tag, Pencil, Trash2, X, Loader2 } from 'lucide-react';
import api from '../services/api';
import type { Category } from '../services/api';
import { getCategoryStyle } from '../utils/categoryHelper';
import ConfirmModal from '../components/ConfirmModal';

const Categories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('💰');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchCategories = async () => {
    try {
      const data = await api.getCategories();
      setCategories(data);
    } catch (err) {
      console.error('Error fetching categories:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingCategory(null);
    setName('');
    setIcon('💰');
    setError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setIcon(cat.icon || '💰');
    setError(null);
    setIsModalOpen(true);
  };

  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await api.deleteCategory(deleteTarget.id);
      fetchCategories();
    } catch (err: any) {
      console.error(err);
      alert('Error al intentar eliminar la categoría.');
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('El nombre de la categoría es obligatorio.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (editingCategory) {
        await api.updateCategory(editingCategory.id, { name, icon });
      } else {
        await api.createCategory({ name, icon });
      }
      fetchCategories();
      setIsModalOpen(false);
    } catch (err: any) {
      setError(err.message || 'Error al guardar la categoría.');
    } finally {
      setSaving(false);
    }
  };

  const emojiList = [
    '💰', '🍔', '🚗', '🏠', '🎁', '🏥', '🎮', '✈️', '🛒', '🎓', '👗', '💼', '⚡', 
    '🐾', '📚', '🩺', '🍿', '🏋️‍♂️', '🍽️', '💇‍♂️', '💅', '🧼', '🚕', '🍷', '🛠️', '📦'
  ];

  return (
    <Layout title="Categorías">
      <AnimatedPage>
        <div className="w-full" style={{ maxWidth: '896px', margin: '0 auto' }}>
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-slate-800">Tus Categorías</h2>
            <button 
              onClick={handleOpenCreateModal}
              className="flex items-center gap-2 bg-[#4D5DFB] text-white px-5 py-2.5 rounded-xl font-bold text-xs hover:bg-[#3B4AD9] transition-all uppercase tracking-wider shadow-sm"
            >
              <Plus size={14} /> Nueva Categoría
            </button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center p-20">
              <Loader2 className="animate-spin text-indigo-600" size={40} />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {categories.length > 0 ? (
                categories.map(cat => {
                  const style = getCategoryStyle(cat.name, 20);
                  const displayIcon = cat.icon || style.icon;

                  return (
                    <div 
                      key={cat.id}
                      className="card flex items-center justify-between p-5 bg-white border border-[#E2E8F0] shadow-sm rounded-2xl hover:shadow-md transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-slate-50 text-2xl">
                          {displayIcon}
                        </div>
                        <div>
                          <h4 className="font-bold text-[#1E293B] text-base">{cat.name}</h4>
                          <span className="text-[10px] bg-slate-100 text-[#64748B] px-2 py-0.5 rounded-full font-semibold uppercase">
                            Personalizada
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleOpenEditModal(cat)}
                          className="p-2 text-[#64748B] hover:text-[#4D5DFB] hover:bg-indigo-50 rounded-xl transition-all"
                          title="Editar"
                        >
                          <Pencil size={18} />
                        </button>
                        <button 
                          onClick={() => setDeleteTarget({ id: cat.id, name: cat.name })}
                          className="p-2 text-[#64748B] hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                          title="Eliminar"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full card p-12 text-center border border-[#E2E8F0] rounded-2xl bg-white">
                  <p className="text-[#64748B] font-medium">No tienes categorías registradas.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Create/Edit Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4">
            <div className="fixed inset-0" onClick={() => setIsModalOpen(false)} />
            <div className="card w-full max-w-md p-8 bg-white rounded-2xl shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <Tag className="text-[#4D5DFB]" size={24} /> 
                  {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="text-[#94A3B8] hover:text-[#475569] transition-colors p-1.5 hover:bg-slate-100 rounded-lg">
                  <X size={20} />
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-700 text-xs font-semibold rounded-xl">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Nombre de la categoría*</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej: Suscripciones, Gimnasio..." 
                    className="w-full px-4 py-3 bg-gray-50 border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#4D5DFB] transition-all font-medium text-slate-700"
                    required
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Selecciona un ícono</label>
                  <div className="grid grid-cols-6 gap-2 max-h-[160px] overflow-y-auto p-1 border border-slate-100 rounded-xl bg-slate-50 custom-scrollbar">
                    {emojiList.map(emoji => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setIcon(emoji)}
                        className={`text-2xl p-2 rounded-lg transition-all ${icon === emoji ? 'bg-indigo-100 scale-110 shadow-sm' : 'hover:bg-slate-200'}`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="submit" 
                    disabled={saving}
                    className="flex-1 bg-[#4D5DFB] text-white py-3.5 rounded-xl font-bold hover:bg-[#3B4AD9] transition-all disabled:opacity-50 flex items-center justify-center"
                  >
                    {saving ? 'Guardando...' : editingCategory ? 'Guardar Cambios' : 'Crear'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 border border-[#E2E8F0] text-[#64748B] py-3.5 rounded-xl font-medium hover:bg-gray-50 transition-all"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <ConfirmModal 
          isOpen={deleteTarget !== null}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDeleteConfirm}
          title="Eliminar Categoría"
          message={`¿Estás seguro de que deseas eliminar la categoría "${deleteTarget?.name}"? Esta acción no afectará tus transacciones anteriores.`}
          confirmText="Eliminar"
          cancelText="Cancelar"
          type="danger"
        />
      </AnimatedPage>
    </Layout>
  );
};

export default Categories;
