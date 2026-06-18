import React from 'react';
import { Ghost, Home, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center">
      <div className="text-[120px] font-black text-[#E2E8F0] absolute z-0 select-none">
        404
      </div>
      
      <div className="relative z-10">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center text-[#94A3B8] mb-8 mx-auto">
          <Ghost size={48} className="animate-bounce" />
        </div>
        
        <h1 className="text-4xl font-bold text-[#1E293B] mb-4">Página no encontrada</h1>
        <p className="text-lg text-[#64748B] max-w-md mb-10">
          Vaya, parece que la dirección que buscas no existe o ha sido movida a otra ubicación.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button 
            onClick={() => navigate('/dashboard')}
            className="flex items-center justify-center gap-2 px-8 py-3.5 bg-[#4D5DFB] text-white rounded-xl font-bold hover:bg-[#3D4DEB] transition-all shadow-lg shadow-indigo-100"
          >
            <Home size={20} /> Volver al Inicio
          </button>
          <div className="relative flex items-center group">
            <Search size={18} className="absolute left-4 text-[#94A3B8] group-hover:text-[#4D5DFB] transition-colors" />
            <input 
              type="text" 
              placeholder="Buscar sección..." 
              className="pl-12 pr-4 py-3.5 bg-white border border-[#E2E8F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4D5DFB] focus:border-transparent transition-all w-64"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
