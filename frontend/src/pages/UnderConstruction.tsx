import React from 'react';
import { Construction, Home, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const UnderConstruction: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center text-[#4D5DFB] mb-8 relative">
        <Construction size={48} />
        <div className="absolute -top-1 -right-1 w-8 h-8 bg-[#EF4444] rounded-full border-4 border-white flex items-center justify-center text-white">
           <Clock size={16} />
        </div>
      </div>
      
      <h1 className="text-4xl font-bold text-[#1E293B] mb-4">¡En Construcción!</h1>
      <p className="text-lg text-[#64748B] max-w-md mb-10">
        Estamos trabajando duro para traerte esta funcionalidad muy pronto. FinanZ está creciendo para darte el mejor control de tus finanzas.
      </p>

      <button 
        onClick={() => navigate('/dashboard')}
        className="flex items-center gap-2 px-8 py-3.5 bg-[#4D5DFB] text-white rounded-xl font-bold hover:bg-[#3D4DEB] transition-all shadow-lg shadow-indigo-100"
      >
        <Home size={20} /> Volver al Inicio
      </button>
    </div>
  );
};

export default UnderConstruction;
