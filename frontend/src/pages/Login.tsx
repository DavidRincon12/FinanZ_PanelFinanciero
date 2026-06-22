import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Wallet, Mail, Lock, ArrowRight } from 'lucide-react';
import api from '../services/api';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInWithCredential, GoogleAuthProvider } from 'firebase/auth';

// ─── Configuración Firebase (leída desde variables de entorno de Vite) ─────────
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId:     import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Inicializar Firebase solo una vez (evita el error "duplicate-app")
const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const firebaseAuth = getAuth(firebaseApp);

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;

// ─── Tipado de la respuesta del callback de Google Identity Services ───────────
interface GoogleCredentialResponse {
  credential: string;
}

// ─── Extender Window para que TypeScript reconozca los globales de Google ──────
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: object) => void;
          renderButton: (element: HTMLElement, config: object) => void;
          prompt: () => void;
        };
      };
    };
    handleCredentialResponse?: (response: GoogleCredentialResponse) => void;
    googleInitialized?: boolean;
  }
}

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError]           = useState('');

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  // ─── Inyectar Google Identity Services script y renderizar el botón ──────────
  useEffect(() => {
    const initGoogle = () => {
      if (!window.google) return;

      // Mismo callback que usa el backend: googleIdToken → Firebase → Django
      window.handleCredentialResponse = async (response: GoogleCredentialResponse) => {
        setGoogleLoading(true);
        setError('');
        try {
          // 1. Cambiar el googleIdToken por un firebaseIdToken (igual que el backend)
          const googleIdToken = response.credential;
          const credential = GoogleAuthProvider.credential(googleIdToken);
          const userCredential = await signInWithCredential(firebaseAuth, credential);
          const firebaseIdToken = await userCredential.user.getIdToken();

          // 2. Enviar el firebaseIdToken al backend para crear la sesión cookie
          await api.firebaseLogin(firebaseIdToken);

          // 3. Verificar sesión y loguear en el contexto React
          const meResponse = await api.me();
          if (meResponse.authenticated) {
            login('session_active', meResponse.user);
            navigate(from, { replace: true });
          } else {
            throw new Error('No se pudo verificar la sesión tras el login con Google.');
          }
        } catch (err: any) {
          console.error('Google login error:', err);
          setError(err.message || 'Error al iniciar sesión con Google');
          // Cerrar sesión en Firebase si Django rechazó el token
          await firebaseAuth.signOut().catch(() => {});
        } finally {
          setGoogleLoading(false);
        }
      };

      if (!window.googleInitialized) {
        window.google!.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: window.handleCredentialResponse,
        });
        window.googleInitialized = true;
      }

      const btnContainer = document.getElementById('btnGoogleContainer');
      if (btnContainer) {
        window.google!.accounts.id.renderButton(btnContainer, {
          theme: 'outline',
          size: 'large',
          type: 'standard',
          shape: 'rectangular',
          text: 'continue_with',
          logo_alignment: 'center',
          width: '380',
        });
      }
    };

    // Si el script de Google ya fue cargado, inicializar directamente
    if (window.google) {
      initGoogle();
      return;
    }

    // Si no, inyectar el script y esperar a que cargue
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = initGoogle;
    document.head.appendChild(script);

    return () => {
      // Limpiar el callback global al desmontar
      delete window.handleCredentialResponse;
    };
  }, [from, login, navigate]);

  // ─── Login clásico (email + contraseña) ──────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      const data = await api.login({ email, password });
      login('session_active', data.user);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Credenciales incorrectas');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = isSubmitting || googleLoading;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
      <div className="max-w-[450px] w-full">

        {/* Logo y encabezado */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-[#4D5DFB] rounded-[22px] flex items-center justify-center text-white shadow-xl shadow-indigo-100 mb-6 hover:scale-105 transition-transform duration-300">
            <Wallet size={32} />
          </div>
          <h1 className="text-3xl font-black text-[#1E293B] mb-2 tracking-tight">Bienvenido a FinanZ</h1>
          <p className="text-[#64748B] font-medium">Toma el control de tu futuro financiero hoy</p>
        </div>

        {/* Tarjeta principal */}
        <div className="bg-white rounded-[32px] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-[#F1F5F9] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-[#4D5DFB]"></div>

          {/* Mensaje de error global */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-700 font-medium">
              {error}
            </div>
          )}

          {/* Formulario clásico */}
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
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2 px-1">
                <label className="text-sm font-bold text-[#1E293B]">Contraseña</label>
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
                  disabled={isLoading}
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#1E293B] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-[#0F172A] transition-all active:scale-[0.98] shadow-lg shadow-gray-200 disabled:opacity-70"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Iniciar Sesión <ArrowRight size={18} /></>
              )}
            </button>
          </form>

          {/* Separador */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#F1F5F9]"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-4 text-[#94A3B8] font-bold uppercase tracking-widest">O continúa con</span>
            </div>
          </div>

          {/* Botón oficial de Google renderizado por Google Identity Services */}
          <div className="flex flex-col items-center gap-3">
            {googleLoading ? (
              <div className="flex items-center gap-3 py-3 text-sm font-medium text-[#64748B]">
                <div className="w-5 h-5 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                Autenticando con Google...
              </div>
            ) : (
              <div id="btnGoogleContainer" className="w-full flex justify-center" />
            )}
          </div>
        </div>

        {/* Pie de página */}
        <p className="mt-8 text-center text-sm text-[#64748B] font-medium">
          ¿No tienes una cuenta?{' '}
          <Link to="/register" className="text-[#4D5DFB] font-bold hover:underline">
            Regístrate gratis
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
