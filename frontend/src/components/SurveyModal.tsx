import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SurveyModalProps {
  isOpen: boolean;
  onComplete: (data: { personal_activity: string; tastes: string; monthly_income: number }) => void;
}

const activities = [
  { emoji: '🎓', label: 'Estudiante', value: 'student' },
  { emoji: '💼', label: 'Empleado', value: 'employee' },
  { emoji: '🚀', label: 'Independiente', value: 'freelancer' },
  { emoji: '🔍', label: 'En búsqueda', value: 'unemployed' },
  { emoji: '🏖️', label: 'Jubilado', value: 'retired' },
];

const tasteOptions = [
  { emoji: '💻', label: 'Tecnología' },
  { emoji: '🍔', label: 'Restaurantes y comida' },
  { emoji: '✈️', label: 'Viajes y turismo' },
  { emoji: '🛍️', label: 'Compras y moda' },
  { emoji: '🎮', label: 'Entretenimiento' },
  { emoji: '🏠', label: 'Hogar' },
  { emoji: '🚗', label: 'Transporte' },
  { emoji: '📚', label: 'Educación' },
  { emoji: '💊', label: 'Salud' },
  { emoji: '🐾', label: 'Mascotas' },
];

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
  }),
};

const SurveyModal: React.FC<SurveyModalProps> = ({ isOpen, onComplete }) => {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [personalActivity, setPersonalActivity] = useState('');
  const [selectedTastes, setSelectedTastes] = useState<string[]>([]);
  const [monthlyIncome, setMonthlyIncome] = useState('');

  if (!isOpen) return null;

  const goNext = () => {
    setDirection(1);
    setStep((s) => s + 1);
  };

  const goBack = () => {
    setDirection(-1);
    setStep((s) => s - 1);
  };

  const toggleTaste = (label: string) => {
    setSelectedTastes((prev) =>
      prev.includes(label) ? prev.filter((t) => t !== label) : [...prev, label]
    );
  };

  const formatCurrency = (value: string) => {
    const num = value.replace(/\D/g, '');
    if (!num) return '';
    return Number(num).toLocaleString('es-CO');
  };

  const handleIncomeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    setMonthlyIncome(raw);
  };

  const handleFinish = () => {
    const tastesStr = selectedTastes
      .map((t) => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_'))
      .join(',');
    onComplete({
      personal_activity: personalActivity,
      tastes: tastesStr,
      monthly_income: Number(monthlyIncome),
    });
  };

  const incomeValue = Number(monthlyIncome);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <motion.div
        className="absolute inset-0 bg-black/40 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />

      {/* Card */}
      <motion.div
        className="relative w-full max-w-lg mx-4 bg-white rounded-3xl shadow-2xl overflow-hidden"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-3 pt-6 pb-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                s === step
                  ? 'w-8 bg-[#4D5DFB]'
                  : s < step
                  ? 'w-2.5 bg-[#4D5DFB]/40'
                  : 'w-2.5 bg-slate-200'
              }`}
            />
          ))}
        </div>

        {/* Step content */}
        <div className="relative overflow-hidden" style={{ minHeight: '380px' }}>
          <AnimatePresence mode="wait" custom={direction}>
            {step === 1 && (
              <motion.div
                key="step1"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="px-6 pb-6 pt-4"
              >
                <h2 className="text-xl font-bold text-slate-800 text-center">
                  ¿Cuál es tu actividad principal?
                </h2>
                <p className="text-sm text-slate-500 text-center mt-1 mb-6">
                  Esto nos ayuda a personalizar tus consejos financieros
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {activities.map((act) => {
                    const selected = personalActivity === act.value;
                    return (
                      <motion.button
                        key={act.value}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setPersonalActivity(act.value)}
                        className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all duration-200 cursor-pointer ${
                          selected
                            ? 'border-[#4D5DFB] bg-[#4D5DFB]/5 shadow-md shadow-[#4D5DFB]/10'
                            : 'border-slate-100 bg-slate-50 hover:border-slate-200'
                        }`}
                      >
                        <motion.span
                          className="text-3xl"
                          animate={selected ? { scale: [1, 1.2, 1] } : {}}
                          transition={{ duration: 0.3 }}
                        >
                          {act.emoji}
                        </motion.span>
                        <span
                          className={`text-sm font-semibold ${
                            selected ? 'text-[#4D5DFB]' : 'text-slate-600'
                          }`}
                        >
                          {act.label}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>

                <div className="mt-6">
                  <button
                    onClick={goNext}
                    disabled={!personalActivity}
                    className={`w-full py-3 rounded-xl font-bold text-sm transition-all duration-200 ${
                      personalActivity
                        ? 'bg-[#4D5DFB] text-white hover:bg-[#3b4beb] shadow-lg shadow-[#4D5DFB]/25 cursor-pointer'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    Siguiente
                  </button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="px-6 pb-6 pt-4"
              >
                <h2 className="text-xl font-bold text-slate-800 text-center">
                  ¿Cuáles son tus principales intereses?
                </h2>
                <p className="text-sm text-slate-500 text-center mt-1 mb-6">
                  Selecciona los que apliquen
                </p>

                <div className="flex flex-wrap gap-2 justify-center">
                  {tasteOptions.map((taste) => {
                    const selected = selectedTastes.includes(taste.label);
                    return (
                      <motion.button
                        key={taste.label}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => toggleTaste(taste.label)}
                        className={`px-4 py-2.5 rounded-full border-2 text-sm font-semibold transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                          selected
                            ? 'bg-[#4D5DFB] text-white border-[#4D5DFB] shadow-md shadow-[#4D5DFB]/15'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <span>{taste.emoji}</span>
                        {taste.label}
                      </motion.button>
                    );
                  })}
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={goBack}
                    className="flex-1 py-3 rounded-xl font-bold text-sm bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    Atrás
                  </button>
                  <button
                    onClick={goNext}
                    disabled={selectedTastes.length === 0}
                    className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all duration-200 ${
                      selectedTastes.length > 0
                        ? 'bg-[#4D5DFB] text-white hover:bg-[#3b4beb] shadow-lg shadow-[#4D5DFB]/25 cursor-pointer'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    Siguiente
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="px-6 pb-6 pt-4"
              >
                <h2 className="text-xl font-bold text-slate-800 text-center">
                  ¿Cuál es tu ingreso mensual aproximado?
                </h2>
                <p className="text-sm text-slate-500 text-center mt-1 mb-8">
                  No te preocupes, esta información es privada
                </p>

                <div className="relative max-w-xs mx-auto">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">
                    COP $
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={monthlyIncome ? formatCurrency(monthlyIncome) : ''}
                    onChange={handleIncomeChange}
                    placeholder="0"
                    className="w-full py-4 pl-20 pr-4 text-2xl font-bold text-slate-800 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-[#4D5DFB] focus:outline-none focus:ring-4 focus:ring-[#4D5DFB]/10 transition-all text-center"
                  />
                </div>

                <div className="flex gap-3 mt-8">
                  <button
                    onClick={goBack}
                    className="flex-1 py-3 rounded-xl font-bold text-sm bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    Atrás
                  </button>
                  <button
                    onClick={handleFinish}
                    disabled={!incomeValue || incomeValue <= 0}
                    className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all duration-200 ${
                      incomeValue > 0
                        ? 'bg-[#4D5DFB] text-white hover:bg-[#3b4beb] shadow-lg shadow-[#4D5DFB]/25 cursor-pointer'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    Finalizar
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default SurveyModal;
