import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Wallet, Mail, Lock, User, ArrowRight, ShieldCheck, Target } from 'lucide-react';
import api from '../services/api';

const Register: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Las contraseñas no coinciden");
      return;
    }
    setIsSubmitting(true);
    
    try {
      const data = await api.register({ name, email, password });
      login('session_active', data.user);
      setIsSubmitting(false);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error en el registro con el servidor');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
      <div className="max-w-[500px] w-full">
        {/* Logo and Greeting */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-[#10B981] rounded-[22px] flex items-center justify-center text-white shadow-xl shadow-emerald-100 mb-6 group hover:scale-105 transition-transform duration-300">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-3xl font-black text-[#1E293B] mb-2 tracking-tight">Crea tu cuenta</h1>
          <p className="text-[#64748B] font-medium text-center">Empieza a gestionar tus finanzas de manera inteligente</p>
        </div>

        {/* Register Card */}
        <div className="bg-white rounded-[32px] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-[#F1F5F9] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-[#10B981]"></div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-[#1E293B] mb-2 px-1">Nombre Completo</label>
              <div className="relative group">
                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8] group-focus-within:text-[#10B981] transition-colors" />
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre"
                  className="w-full pl-12 pr-4 py-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-50 focus:border-[#10B981] transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-[#1E293B] mb-2 px-1">Correo Electrónico</label>
              <div className="relative group">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8] group-focus-within:text-[#10B981] transition-colors" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-12 pr-4 py-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-50 focus:border-[#10B981] transition-all"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-[#1E293B] mb-2 px-1">Contraseña</label>
                <div className="relative group">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8] group-focus-within:text-[#10B981] transition-colors" />
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-4 py-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-50 focus:border-[#10B981] transition-all"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-[#1E293B] mb-2 px-1">Confirmar</label>
                <div className="relative group">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8] group-focus-within:text-[#10B981] transition-colors" />
                  <input 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-4 py-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-50 focus:border-[#10B981] transition-all"
                    required
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-[#10B981] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-[#059669] transition-all active:scale-[0.98] shadow-lg shadow-emerald-50 disabled:opacity-70"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  Crear Cuenta <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#F1F5F9]"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-4 text-[#94A3B8] font-bold uppercase tracking-widest">O regístrate con</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button className="flex items-center justify-center gap-2 py-4 border border-[#E2E8F0] rounded-2xl hover:bg-[#F8FAFC] transition-all active:scale-[0.98]">
              <Wallet size={18} className="text-[#10B981]" />
              <span className="text-sm font-bold text-[#334155]">Google</span>
            </button>
            <button className="flex items-center justify-center gap-2 py-4 border border-[#E2E8F0] rounded-2xl hover:bg-[#F8FAFC] transition-all active:scale-[0.98]">
              <Target size={18} className="text-[#334155]" />
              <span className="text-sm font-bold text-[#334155]">Otros</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-sm text-[#64748B] font-medium">
          ¿Ya tienes una cuenta? <Link to="/login" className="text-[#4D5DFB] font-bold hover:underline">Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
