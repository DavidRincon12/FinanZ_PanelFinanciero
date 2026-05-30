import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Wallet, Mail, Lock, ArrowRight, Target } from 'lucide-react';
import api from '../services/api';

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const from = (location.state as any)?.from?.pathname || "/dashboard";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Call backend to establish session
      const data = await api.login({ email, password });

      login('session_active', data.user);
      
      setIsSubmitting(false);
      navigate(from, { replace: true });
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error en la autenticación con el servidor');
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    try {
      await api.firebaseLogin('development_token');
      const meResponse = await api.me();
      if (meResponse.authenticated) {
        login('session_active', meResponse.user);
        navigate(from, { replace: true });
      } else {
        throw new Error('Google login failed');
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error al iniciar sesión con Google');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
      <div className="max-w-[450px] w-full">
        {/* Logo and Greeting */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-[#4D5DFB] rounded-[22px] flex items-center justify-center text-white shadow-xl shadow-indigo-100 mb-6 group hover:scale-105 transition-transform duration-300">
            <Wallet size={32} />
          </div>
          <h1 className="text-3xl font-black text-[#1E293B] mb-2 tracking-tight">Bienvenido a FinanZ</h1>
          <p className="text-[#64748B] font-medium">Toma el control de tu futuro financiero hoy</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-[32px] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-[#F1F5F9] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-[#4D5DFB]"></div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-[#1E293B] mb-2 px-1">Correo Electrónico</label>
              <div className="relative group">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8] group-focus-within:text-[#4D5DFB] transition-colors" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-12 pr-4 py-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-[#4D5DFB] transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2 px-1">
                <label className="text-sm font-bold text-[#1E293B]">Contraseña</label>
                <button type="button" className="text-xs font-bold text-[#4D5DFB] hover:underline">¿Olvidaste tu contraseña?</button>
              </div>
              <div className="relative group">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8] group-focus-within:text-[#4D5DFB] transition-colors" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-[#4D5DFB] transition-all"
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-[#1E293B] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-[#0F172A] transition-all active:scale-[0.98] shadow-lg shadow-gray-200 disabled:opacity-70"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  Iniciar Sesión <ArrowRight size={18} />
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
              <span className="bg-white px-4 text-[#94A3B8] font-bold uppercase tracking-widest">O continúa con</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button 
              type="button"
              onClick={handleGoogleLogin}
              disabled={isSubmitting}
              className="flex items-center justify-center gap-2 py-4 border border-[#E2E8F0] rounded-2xl hover:bg-[#F8FAFC] transition-all group active:scale-[0.98] cursor-pointer"
            >
              <Wallet size={18} className="text-[#4D5DFB] transition-colors" />
              <span className="text-sm font-bold text-[#334155]">Google</span>
            </button>
            <button 
              type="button"
              className="flex items-center justify-center gap-2 py-4 border border-[#E2E8F0] rounded-2xl hover:bg-[#F8FAFC] transition-all group active:scale-[0.98]"
            >
              <Target size={18} className="text-[#334155] group-hover:text-black transition-colors" />
              <span className="text-sm font-bold text-[#334155]">Github</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-sm text-[#64748B] font-medium">
          ¿No tienes una cuenta? <Link to="/register" className="text-[#4D5DFB] font-bold hover:underline">Regístrate gratis</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
