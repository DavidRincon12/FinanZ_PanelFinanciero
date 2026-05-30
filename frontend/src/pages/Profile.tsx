import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import api from '../services/api';
import Layout from '../components/Layout';
import AnimatedPage from '../components/AnimatedPage';
import { User as UserIcon, Bell, DollarSign, Globe, Save, Sparkles, Settings } from 'lucide-react';

const Profile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();

  const [monthlyBudget, setMonthlyBudget] = useState(() => {
    const budgetVal = user?.monthly_budget || 0;
    return budgetVal > 0 ? new Intl.NumberFormat('de-DE').format(Math.round(budgetVal)) : '';
  });
  const [alert80, setAlert80] = useState(user?.alert_at_80_percent ?? true);
  const [alert100, setAlert100] = useState(user?.alert_at_100_percent ?? true);
  const [timezone, setTimezone] = useState(user?.timezone || 'America/Bogota');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g, '');
    if (!v) {
      setMonthlyBudget('');
      return;
    }
    setMonthlyBudget(new Intl.NumberFormat('de-DE').format(parseInt(v)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const numericBudget = monthlyBudget ? parseFloat(monthlyBudget.replace(/\./g, '')) : 0;

    try {
      const response = await api.updateProfile({
        monthly_budget: numericBudget,
        alert_at_80_percent: alert80,
        alert_at_100_percent: alert100,
        timezone,
      });

      if (response.status === 'success') {
        updateUser(response.user);
        toast('success', '¡Ajustes guardados!', 'Tu perfil y configuración han sido actualizados.');
      } else {
        throw new Error(response.error || 'No se pudo actualizar el perfil');
      }
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error al guardar los ajustes.');
      toast('error', 'Error al guardar', err.message || 'No se pudo conectar al servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout title="Ajustes">
      <AnimatedPage>
        <div className="max-w-[800px] mx-auto pb-12">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Configuración de Perfil</h2>
              <p className="text-sm text-[#94A3B8] mt-1">Administra tu presupuesto global, notificaciones y preferencias.</p>
            </div>
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-[#4D5DFB]">
              <Settings size={20} className="animate-spin-slow" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Sidebar Profile Card */}
            <div className="lg:col-span-1 flex flex-col gap-6">
              <div className="card !p-6 flex flex-col items-center text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-[#4D5DFB]"></div>
                
                <div className="w-20 h-20 bg-[#E0E7FF] rounded-full flex items-center justify-center text-[#4D5DFB] ring-4 ring-[#EEF2F6] mb-4">
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <UserIcon size={36} />
                  )}
                </div>

                <h3 className="font-bold text-[#1E293B] text-lg leading-snug">{user?.name || 'Usuario'}</h3>
                <p className="text-xs text-[#94A3B8] font-medium mt-1 truncate w-full">{user?.email}</p>

                <div className="w-full border-t border-[#F1F5F9] my-5"></div>

                <div className="flex items-center gap-2 py-2 px-3 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg leading-none">
                  <Sparkles size={14} /> Miembro Activo
                </div>
              </div>
            </div>

            {/* Settings Form */}
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Financial Settings Section */}
                <div className="card !p-6 space-y-5">
                  <h3 className="font-bold text-slate-800 text-[17px] flex items-center gap-2 mb-2 pb-3 border-b border-[#F1F5F9]">
                    <DollarSign size={18} className="text-[#4D5DFB]" /> Presupuesto Global
                  </h3>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
                      {error}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-bold text-[#1E293B] mb-2 px-1">Presupuesto Mensual General</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]">
                        <DollarSign size={18} />
                      </div>
                      <input 
                        type="text" 
                        value={monthlyBudget}
                        onChange={handleBudgetChange}
                        placeholder="0"
                        className="w-full pl-12 pr-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#4D5DFB] transition-all text-lg font-bold text-slate-700"
                      />
                    </div>
                    <p className="text-xs text-[#94A3B8] mt-2 px-1 leading-relaxed">
                      Este es tu límite mensual de gastos global. Se te enviarán alertas si tus egresos agregados alcanzan los porcentajes especificados a continuación.
                    </p>
                  </div>
                </div>

                {/* Notifications Preferences */}
                <div className="card !p-6 space-y-5">
                  <h3 className="font-bold text-slate-800 text-[17px] flex items-center gap-2 mb-2 pb-3 border-b border-[#F1F5F9]">
                    <Bell size={18} className="text-[#EF4444]" /> Preferencias de Alerta
                  </h3>

                  <div className="space-y-4">
                    <label className="flex items-start gap-3 p-3.5 rounded-xl border border-[#F1F5F9] hover:bg-[#F8FAFC] transition-all cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={alert80}
                        onChange={(e) => setAlert80(e.target.checked)}
                        className="w-5 h-5 mt-0.5 accent-[#4D5DFB]"
                      />
                      <div>
                        <span className="block text-sm font-bold text-[#1E293B]">Advertencia de Presupuesto (80%)</span>
                        <span className="block text-xs text-[#94A3B8] mt-1 leading-relaxed">Notificarme in-app y por correo electrónico cuando mis gastos del mes superen el 80% de mi presupuesto global.</span>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-3.5 rounded-xl border border-[#F1F5F9] hover:bg-[#F8FAFC] transition-all cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={alert100}
                        onChange={(e) => setAlert100(e.target.checked)}
                        className="w-5 h-5 mt-0.5 accent-[#EF4444]"
                      />
                      <div>
                        <span className="block text-sm font-bold text-[#1E293B]">Límite de Presupuesto Superado (100%)</span>
                        <span className="block text-xs text-[#94A3B8] mt-1 leading-relaxed">Notificarme in-app y por correo electrónico cuando mis gastos acumulados superen el 100% de mi presupuesto global.</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Localization Settings */}
                <div className="card !p-6 space-y-5">
                  <h3 className="font-bold text-slate-800 text-[17px] flex items-center gap-2 mb-2 pb-3 border-b border-[#F1F5F9]">
                    <Globe size={18} className="text-emerald-500" /> Preferencias Regionales
                  </h3>

                  <div>
                    <label className="block text-sm font-bold text-[#1E293B] mb-2 px-1">Zona Horaria</label>
                    <select 
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#4D5DFB] transition-all text-sm font-semibold text-slate-700"
                    >
                      <option value="America/Bogota">Colombia (America/Bogota)</option>
                      <option value="America/Mexico_City">México (America/Mexico_City)</option>
                      <option value="America/Lima">Perú (America/Lima)</option>
                      <option value="America/Santiago">Chile (America/Santiago)</option>
                      <option value="America/Argentina/Buenos_Aires">Argentina (America/Buenos_Aires)</option>
                      <option value="America/Caracas">Venezuela (America/Caracas)</option>
                      <option value="Europe/Madrid">España (Europe/Madrid)</option>
                    </select>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center justify-center gap-2 px-8 py-3.5 bg-[#4D5DFB] text-white font-bold rounded-2xl hover:bg-[#3B4AD9] transition-all disabled:opacity-50 shadow-lg shadow-indigo-200 cursor-pointer active:scale-95 text-sm"
                  >
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <Save size={18} /> Guardar Cambios
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </AnimatedPage>

      <style>{`
        .animate-spin-slow {
          animation: spin 8s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </Layout>
  );
};

export default Profile;
