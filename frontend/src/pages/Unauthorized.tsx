import React from 'react';
import { ShieldAlert, Home, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Unauthorized: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-24 h-24 bg-red-100 rounded-3xl flex items-center justify-center text-red-600 mb-8 animate-pulse">
        <ShieldAlert size={48} />
      </div>
      
      <h1 className="text-4xl font-bold text-[#1E293B] mb-4">Acceso Denegado</h1>
      <p className="text-lg text-[#64748B] max-w-md mb-10">
        Lo sentimos, no tienes los permisos necesarios para acceder a esta sección. Por favor, contacta al administrador si crees que esto es un error.
      </p>

      <div className="flex gap-4">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-6 py-3 bg-white border border-[#E2E8F0] text-[#475569] rounded-xl font-bold hover:bg-[#F1F5F9] transition-all"
        >
          <ArrowLeft size={18} /> Volver
        </button>
        <button 
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 px-6 py-3 bg-[#4D5DFB] text-white rounded-xl font-bold hover:bg-[#3D4DEB] transition-all shadow-lg shadow-indigo-100"
        >
          <Home size={18} /> Ir al Inicio
        </button>
      </div>
    </div>
  );
};

export default Unauthorized;
