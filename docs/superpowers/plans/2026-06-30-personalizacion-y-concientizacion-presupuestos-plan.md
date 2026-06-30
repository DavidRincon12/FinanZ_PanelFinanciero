# Personalización, Concientización Financiera y Rediseño de Presupuestos Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement user personalization survey modal, dynamic advice banner, historical spending charts, alert history log, premium budgets layout redesign, and address console warnings.

**Architecture:** Extend the CustomUser Django model, update profile APIs, build a React survey modal, implement dynamic tip display based on user attributes, integrate Recharts historical comparisons, redesign the Budgets list as an interactive grid with status filtering, and clean up browser logs.

**Tech Stack:** React 19, TypeScript, Django 5.x, SQLite, Tailwind CSS v4, Recharts, Framer Motion, Lucide Icons.

## Global Constraints
- Target workspace directories: `frontend/` and `backend/`.
- Maintain docstrings and comments in untouched sections.
- Keep components modular and responsive.
- Always perform verification check steps after edits.

---

### Task 1: Depuración Técnica de la Consola

**Files:**
- Create: None
- Modify:
  - `frontend/package.json`
  - `frontend/vite.config.ts`
  - `frontend/src/index.css`
  - `frontend/index.html`
  - `frontend/src/pages/Login.tsx`
  - `frontend/src/pages/Register.tsx`
  - `frontend/src/pages/Dashboard.tsx`

**Interfaces:**
- Consumes: None
- Produces: Tailwind v4 native build, autocomplete attributes, single GSI SDK initialization, and warning-free ResponsiveContainer dimensions.

- [ ] **Step 1: Install @tailwindcss/vite**
  Run: `cmd /c npm install -D @tailwindcss/vite` in `frontend/`

- [ ] **Step 2: Config tailwindcss plugin in Vite config**
  Modify: `frontend/vite.config.ts`:
  ```typescript
  import { defineConfig } from 'vite'
  import react from '@vitejs/plugin-react'
  import tailwindcss from '@tailwindcss/vite'

  export default defineConfig({
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        '/api': { target: 'http://127.0.0.1:8000', changeOrigin: true },
        '/finance': { target: 'http://127.0.0.1:8000', changeOrigin: true },
        '/budget': { target: 'http://127.0.0.1:8000', changeOrigin: true },
        '/goals': { target: 'http://127.0.0.1:8000', changeOrigin: true },
        '/admin': { target: 'http://127.0.0.1:8000', changeOrigin: true },
        '/static': { target: 'http://127.0.0.1:8000', changeOrigin: true },
        '/media': { target: 'http://127.0.0.1:8000', changeOrigin: true },
      }
    }
  })
  ```

- [ ] **Step 3: Load tailwind in index.css**
  Modify: `frontend/src/index.css` at line 1-2:
  ```css
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  @import "tailwindcss";
  ```

- [ ] **Step 4: Remove Tailwind CDN script in index.html**
  Modify: `frontend/index.html` to ensure no script tags load tailwind CDN.

- [ ] **Step 5: Set autocomplete attributes in login & registration forms**
  Modify: `frontend/src/pages/Login.tsx` around password input field:
  ```typescript
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
  ```
  Modify: `frontend/src/pages/Register.tsx` around password inputs:
  ```typescript
                      <input 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-12 pr-4 py-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-50 focus:border-[#10B981] transition-all"
                        required
                        autoComplete="new-password"
                      />
  ```

- [ ] **Step 6: Guard Google SDK initialization**
  Modify: `frontend/src/pages/Login.tsx`:
  ```typescript
      if (!window.googleInitialized) {
        window.google!.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: window.handleCredentialResponse,
        });
        window.googleInitialized = true;
      }
  ```

- [ ] **Step 7: Add minWidth and minHeight to ResponsiveContainer tags**
  Modify: `frontend/src/pages/Dashboard.tsx` (all ResponsiveContainer tags):
  ```typescript
  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
  ```

- [ ] **Step 8: Verify build finishes successfully**
  Run: `cmd /c npm run build` in `frontend/`
  Expected: Successful production build without TypeScript/compile warnings.

- [ ] **Step 9: Commit changes**
  Run: `git add .` and `git commit -m "chore: clean console warnings and configure native tailwind v4"`

---

### Task 2: Backend User Model & APIs updates

**Files:**
- Modify:
  - `backend/apps/users/models.py`
  - `backend/apps/users/views.py`

**Interfaces:**
- Consumes: Django AbstractUser.
- Produces: SQLite fields for personalization; JSON keys `personal_activity`, `tastes`, `monthly_income`, `is_survey_completed` from `/api/me/` and `/api/profile/update/`.

- [ ] **Step 1: Add new attributes to CustomUser model**
  Modify: `backend/apps/users/models.py`:
  ```python
      personal_activity = models.CharField(
          max_length=20,
          choices=[
              ("student", "Estudiante"),
              ("employee", "Empleado"),
              ("freelancer", "Independiente"),
              ("unemployed", "En búsqueda"),
              ("retired", "Jubilado"),
          ],
          blank=True,
          null=True,
          verbose_name="Actividad Personal"
      )
      tastes = models.CharField(
          max_length=255,
          blank=True,
          default="",
          verbose_name="Intereses y Gustos"
      )
      monthly_income = models.DecimalField(
          max_digits=12,
          decimal_places=2,
          default=0.00,
          verbose_name="Ingresos Mensuales"
      )
      is_survey_completed = models.BooleanField(
          default=False,
          verbose_name="Encuesta Completada"
      )
  ```

- [ ] **Step 2: Generate and apply Django database migrations**
  Run: `.venv\Scripts\python backend\manage.py makemigrations` and `.venv\Scripts\python backend\manage.py migrate` in workspace root.
  Expected: Database migrated successfully on local environment.

- [ ] **Step 3: Update `me_api` view response**
  Modify: `backend/apps/users/views.py`:
  ```python
                  "personal_activity": request.user.personal_activity,
                  "tastes": request.user.tastes,
                  "monthly_income": float(request.user.monthly_income),
                  "is_survey_completed": request.user.is_survey_completed,
  ```

- [ ] **Step 4: Update `profile_update_api` to accept personalization parameters**
  Modify: `backend/apps/users/views.py`:
  ```python
          survey_updated = False
  
          if "personal_activity" in data:
              activity = data["personal_activity"]
              valid_choices = ["student", "employee", "freelancer", "unemployed", "retired"]
              if activity not in valid_choices and activity is not None and activity != "":
                  return JsonResponse({"error": "Actividad personal inválida"}, status=400)
              user.personal_activity = activity if activity != "" else None
              survey_updated = True
  
          if "tastes" in data:
              user.tastes = str(data["tastes"])
              survey_updated = True
  
          if "monthly_income" in data:
              try:
                  from decimal import Decimal
                  income = Decimal(str(data["monthly_income"]))
                  if income < 0:
                      return JsonResponse({"error": "Los ingresos mensuales no pueden ser menores a 0"}, status=400)
                  user.monthly_income = income
                  survey_updated = True
              except Exception:
                  return JsonResponse({"error": "Ingresos mensuales inválidos"}, status=400)
  
          if "is_survey_completed" in data:
              user.is_survey_completed = bool(data["is_survey_completed"])
          elif survey_updated:
              user.is_survey_completed = True
  ```

- [ ] **Step 5: Execute user personalization tests**
  Run: `.venv\Scripts\python backend\manage.py test apps.users`
  Expected: All tests pass.

- [ ] **Step 6: Commit changes**
  Run: `git add .` and `git commit -m "backend: update user model and APIs with survey personalization fields"`

---

### Task 3: SurveyModal Component & Dashboard Integration

**Files:**
- Create: `frontend/src/components/SurveyModal.tsx`
- Modify:
  - `frontend/src/services/api.ts`
  - `frontend/src/pages/Dashboard.tsx`

**Interfaces:**
- Consumes: `api.updateProfile` interface.
- Produces: Survey modal popup overlays on first login if `is_survey_completed` is false.

- [ ] **Step 1: Update frontend API profile methods definitions**
  Modify: `frontend/src/services/api.ts`:
  ```typescript
    updateProfile: async (data: {
      monthly_budget?: number;
      alert_at_80_percent?: boolean;
      alert_at_100_percent?: boolean;
      timezone?: string;
      personal_activity?: string;
      tastes?: string;
      monthly_income?: number;
      is_survey_completed?: boolean;
    }): Promise<any> => {
      const res = await fetch(`${API_BASE_URL}/api/profile/update/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to update profile');
      }
      return res.json();
    },
  ```

- [ ] **Step 2: Create React SurveyModal component**
  Create: `frontend/src/components/SurveyModal.tsx` containing the multi-step layout animations (Ocupación selection, Interests tastes selection, monthly income format) and onComplete callback.

- [ ] **Step 3: Integrate SurveyModal on Dashboard page**
  Modify: `frontend/src/pages/Dashboard.tsx`:
  ```typescript
  import SurveyModal from '../components/SurveyModal';
  ...
  const Dashboard: React.FC = () => {
    ...
    return (
      <>
        <SurveyModal isOpen={!user?.is_survey_completed} onComplete={handleSurveyComplete} />
        ...
      </>
    )
  }
  ```

- [ ] **Step 4: Build survey completed toast popup feedback**
  Modify: `frontend/src/pages/Dashboard.tsx`:
  ```typescript
        {surveyToast && (
          <div className="fixed bottom-6 right-6 z-50 bg-emerald-500 text-white px-6 py-3 rounded-xl shadow-lg font-bold text-sm animate-fade-in">
            ✅ ¡Encuesta completada! Tu perfil ha sido actualizado.
          </div>
        )}
  ```

- [ ] **Step 5: Verify build compiles cleanly**
  Run: `cmd /c npm run build` inside `frontend/`

- [ ] **Step 6: Commit changes**
  Run: `git add .` and `git commit -m "feat: add multi-step welcome survey modal and update API client"`

---

### Task 4: Dynamic Recommendations & Budget 50/30/20 Suggested Banner

**Files:**
- Modify:
  - `frontend/src/pages/Dashboard.tsx`

**Interfaces:**
- Consumes: `user.personal_activity`, `user.tastes`, `user.monthly_income` and current `budgets` count.
- Produces: Contextual tips grid and quick 50/30/20 suggestions layout redirecting to budgets page.

- [ ] **Step 1: Write dynamic advice logic based on occupación and tastes**
  Modify: `frontend/src/pages/Dashboard.tsx` to add `getFinancialTips` function:
  ```typescript
  function getFinancialTips(activity: string | null | undefined, tastes: string | undefined): { icon: string; title: string; tip: string }[] {
    const tips: { icon: string; title: string; tip: string }[] = [];
  
    switch (activity) {
      case 'student':
        tips.push(
          { icon: '🎓', title: 'Presupuesto estudiantil', tip: 'Administra tu dinero limitado priorizando transporte y alimentación. Aprovecha descuentos estudiantiles y evita suscripciones innecesarias.' },
          { icon: '💰', title: 'Ahorra en lo cotidiano', tip: 'Cocina en casa, usa transporte público y busca ofertas para estudiantes. Cada peso ahorrado cuenta para tu futuro.' }
        );
        break;
      case 'employee':
        tips.push(
          { icon: '🏦', title: 'Págate a ti primero', tip: 'Automatiza tus ahorros destinando al menos un 10% de tu salario apenas lo recibas. Aprovecha los beneficios que ofrece tu empleador.' },
          { icon: '📈', title: 'Invierte un porcentaje', tip: 'Considera invertir una parte de tu salario mensualmente. El interés compuesto es tu mejor aliado a largo plazo.' }
        );
        break;
      case 'freelancer':
        tips.push(
          { icon: '📋', title: 'Separa tus finanzas', tip: 'Mantén cuentas separadas para gastos personales y de negocio. Reserva un porcentaje de cada ingreso para impuestos.' },
          { icon: '🛡️', title: 'Fondo de emergencia', tip: 'Como freelancer, tus ingresos pueden variar. Construye un fondo de emergencia que cubra al menos 6 meses de gastos.' }
        );
        break;
      case 'unemployed':
        tips.push(
          { icon: '🎯', title: 'Prioriza lo esencial', tip: 'Enfócate en cubrir gastos esenciales: vivienda, alimentación y salud. Usa recursos gratuitos disponibles en tu comunidad.' },
          { icon: '📝', title: 'Registra cada gasto', tip: 'Lleva un control meticuloso de cada peso que gastas. Esto te ayudará a identificar dónde puedes recortar y optimizar.' }
        );
        break;
      case 'retired':
        tips.push(
          { icon: '🛡️', title: 'Protege tus ahorros', tip: 'Protege tu patrimonio de la inflación con inversiones seguras. Evita inversiones de alto riesgo que puedan comprometer tu tranquilidad.' },
          { icon: '🏥', title: 'Presupuesto de salud', tip: 'Destina una parte importante de tu presupuesto a gastos de salud. Prevenir es más económico que curar.' }
        );
        break;
      default:
        tips.push(
          { icon: '💡', title: 'Empieza a ahorrar', tip: 'El primer paso para una buena salud financiera es gastar menos de lo que ganas. Establece metas claras de ahorro.' }
        );
    }
  
    const tastesStr = tastes || '';
    if (tastesStr.includes('Restaurantes y comida')) {
      tips.push({ icon: '🍳', title: 'Planifica tus comidas', tip: 'Cocinar en casa puede ahorrarte hasta un 60% en alimentación. Planifica un menú semanal y haz compras inteligentes.' });
    }
    if (tastesStr.includes('Tecnología')) {
      tips.push({ icon: '💻', title: 'Compras tech inteligentes', tip: 'Compara precios antes de comprar gadgets y espera épocas de ofertas. A menudo la versión anterior tiene la mejor relación calidad-precio.' });
    }
    if (tastesStr.includes('Viajes y turismo')) {
      tips.push({ icon: '✈️', title: 'Fondo de viajes', tip: 'Crea un fondo exclusivo para viajes. Ahorra un monto fijo mensual y podrás viajar sin afectar tu presupuesto regular.' });
    }
  
    return tips.slice(0, 3);
  }
  ```

- [ ] **Step 2: Implement dynamic tips card rendering on Dashboard layout**
  Modify: `frontend/src/pages/Dashboard.tsx` around line 247:
  ```typescript
            {/* Tips Section - shown only if survey completed */}
            {user?.is_survey_completed && (() => {
              const tips = getFinancialTips(user.personal_activity, user.tastes);
              return tips.length > 0 ? (
                <div className="col-span-12">
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <span className="text-xl">💡</span> Consejos para ti
                  </h3>
                  <div className="grid grid-cols-12 gap-4">
                    {tips.map((tip, idx) => (
                      <div key={idx} className="col-span-12 lg:col-span-4">
                        <div className="bg-white border border-slate-100 rounded-2xl p-5 h-full shadow-sm hover:shadow-md transition-shadow duration-300" style={{ borderLeft: '4px solid #4D5DFB' }}>
                          <div className="flex items-center gap-3 mb-3">
                            <span className="text-2xl">{tip.icon}</span>
                            <h4 className="font-bold text-slate-800 text-sm">{tip.title}</h4>
                          </div>
                          <p className="text-slate-500 text-sm leading-relaxed">{tip.tip}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null;
            })()}
  ```

- [ ] **Step 3: Implement 50/30/20 budget suggestion banner for new profiles**
  Modify: `frontend/src/pages/Dashboard.tsx` around line 271:
  ```typescript
            {/* 50/30/20 Budget Suggestion Banner */}
            {user?.is_survey_completed && (user?.monthly_income ?? 0) > 0 && budgets.length === 0 && (
              <div className="col-span-12">
                <div className="rounded-2xl p-6 shadow-lg text-white" style={{ background: 'linear-gradient(135deg, #4D5DFB, #818CF8)' }}>
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <span className="text-xl">📊</span> Presupuesto Sugerido (Regla 50/30/20)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                    <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 text-center">
                      <p className="text-white/80 text-xs font-semibold uppercase tracking-wider mb-1">Necesidades</p>
                      <p className="text-2xl font-black">50%</p>
                      <p className="text-white/90 font-bold text-sm mt-1">{fmtMoney((user?.monthly_income ?? 0) * 0.50)}</p>
                    </div>
                    <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 text-center">
                      <p className="text-white/80 text-xs font-semibold uppercase tracking-wider mb-1">Gustos</p>
                      <p className="text-2xl font-black">30%</p>
                      <p className="text-white/90 font-bold text-sm mt-1">{fmtMoney((user?.monthly_income ?? 0) * 0.30)}</p>
                    </div>
                    <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 text-center">
                      <p className="text-white/80 text-xs font-semibold uppercase tracking-wider mb-1">Ahorro</p>
                      <p className="text-2xl font-black">20%</p>
                      <p className="text-white/90 font-bold text-sm mt-1">{fmtMoney((user?.monthly_income ?? 0) * 0.20)}</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <button
                      onClick={() => navigate('/budgets')}
                      className="bg-white text-[#4D5DFB] font-bold px-6 py-2.5 rounded-xl hover:bg-white/90 transition-colors duration-200 text-sm shadow-md"
                    >
                      Ir a Presupuestos →
                    </button>
                  </div>
                </div>
              </div>
            )}
  ```

- [ ] **Step 4: Verify build compiles cleanly**
  Run: `cmd /c npm run build` inside `frontend/`

- [ ] **Step 5: Commit changes**
  Run: `git commit -m "feat: add adaptive financial tips and rule 50/30/20 pre-filled suggestions banner"`

---

### Task 5: Overspending Comparison & Historical Alert Logs

**Files:**
- Modify:
  - `frontend/src/pages/Budgets.tsx`

**Interfaces:**
- Consumes: Historical expense sums and warning/critical notifications from user alerts.
- Produces: Recharts comparison bar chart (budget vs spent), motivational comparison string, and scrollable log lists.

- [ ] **Step 1: Set up history chart and alerts selectors state**
  Modify: `frontend/src/pages/Budgets.tsx`:
  ```typescript
    // History and Notifications
    const [historyData, setHistoryData] = useState<any[]>([]);
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
  ```

- [ ] **Step 2: Connect history fetching APIs**
  Modify: `frontend/src/pages/Budgets.tsx` inside the load component `useEffect` block:
  ```typescript
    const fetchHistory = async () => {
      try {
        const data = await api.getBudgetHistory();
        setHistoryData(data);
      } catch (err) {
        console.error('Error fetching budget history:', err);
      }
    };
  
    const fetchNotifications = async () => {
      try {
        const data = await api.getNotifications();
        setNotifications(data);
      } catch (err) {
        console.error('Error fetching notifications:', err);
      }
    };
  ```

- [ ] **Step 3: Add Recharts BarChart comparing budget vs spent**
  Modify: `frontend/src/pages/Budgets.tsx`:
  ```typescript
            {/* ===== Historical Spending Chart ===== */}
            {historyData.length > 0 && (
              <div className="card !p-6 mt-8 bg-white border border-[#E2E8F0] shadow-sm rounded-2xl">
                <h3 className="text-lg font-bold text-[#1E293B] mb-4">📊 Historial de Gastos vs Presupuesto</h3>
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <BarChart data={historyData} barGap={4} barCategoryGap="20%">
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748B' }} />
                      <YAxis tick={{ fontSize: 12, fill: '#64748B' }} tickFormatter={(v: number) => fmtMoney(v)} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="total_budgeted" name="Presupuestado" fill="#6366F1" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="total_spent" name="Gastado" radius={[4, 4, 0, 0]}>
                        {historyData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.total_spent > entry.total_budgeted ? '#EF4444' : '#10B981'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
  ```

- [ ] **Step 4: Display comparative overgasto status log and motivational message**
  Modify: `frontend/src/pages/Budgets.tsx` to compute current vs past month overspending count alerts difference, displaying an alert block matching current state.
  ```typescript
    const motivationalMessage = useMemo(() => {
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();
  
      let prevMonth = currentMonth - 1;
      let prevYear = currentYear;
      if (prevMonth <= 0) {
        prevMonth = 12;
        prevYear -= 1;
      }
  
      const isCurrentMonth = (n: AppNotification) => {
        const d = new Date(n.created_at);
        return d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear;
      };
      const isPrevMonth = (n: AppNotification) => {
        const d = new Date(n.created_at);
        return d.getMonth() + 1 === prevMonth && d.getFullYear() === prevYear;
      };
      const isAlert = (n: AppNotification) => n.type === 'warning' || n.type === 'critical';
  
      const currentAlerts = notifications.filter(n => isAlert(n) && isCurrentMonth(n)).length;
      const prevAlerts = notifications.filter(n => isAlert(n) && isPrevMonth(n)).length;
      const diff = Math.abs(currentAlerts - prevAlerts);
  
      if (currentAlerts < prevAlerts) {
        return {
          type: 'success' as const,
          text: `¡Excelente progreso! 🎉 Este mes tienes ${diff} alerta${diff !== 1 ? 's' : ''} menos que el mes pasado.`,
        };
      } else if (currentAlerts > prevAlerts) {
        return {
          type: 'warning' as const,
          text: `⚠️ Atención: Este mes tienes ${diff} alerta${diff !== 1 ? 's' : ''} más que el mes anterior. Revisa tus gastos.`,
        };
      }
      return {
        type: 'neutral' as const,
        text: 'Tu comportamiento financiero se mantiene estable respecto al mes pasado.',
      };
    }, [notifications]);
  ```

- [ ] **Step 5: Add scrollable alert log layout**
  Modify: `frontend/src/pages/Budgets.tsx` to render sorted alert notifications using a list display format inside container.

- [ ] **Step 6: Commit changes**
  Run: `git commit -m "feat: implement historical overspending comparisons, comparative logs, and historical notifications panel"`

---

### Task 6: Premium Budgets Grid Redesign & period filters

**Files:**
- Modify:
  - `frontend/src/pages/Budgets.tsx`

**Interfaces:**
- Consumes: Month selection and status filters.
- Produces: Styled Budget grid layout cards with custom progress-bar gradients, global status bar indicator, month/year navigation selectors, and filter chips.

- [ ] **Step 1: Implement global widgets indicator card**
  Modify: `frontend/src/pages/Budgets.tsx`:
  ```typescript
                {/* Top Summary Card Widget */}
                <div className="bg-white border border-[#E2E8F0] shadow-sm rounded-3xl p-6 mb-8 relative overflow-hidden">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-[#4D5DFB] flex items-center justify-center text-xl font-bold">
                        $
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Total Presupuestado</p>
                        <h3 className="text-2xl font-extrabold text-[#0F172A] mt-1">{fmtMoney(totalBudgeted)}</h3>
                      </div>
                    </div>
  
                    <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-[#F1F5F9] pt-4 md:pt-0 md:pl-6">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold ${globalPercentage >= 100 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                        {globalPercentage >= 100 ? '🔥' : '📈'}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Total Gastado</p>
                        <h3 className="text-2xl font-extrabold text-[#0F172A] mt-1">{fmtMoney(totalSpent)}</h3>
                      </div>
                    </div>
  
                    <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-[#F1F5F9] pt-4 md:pt-0 md:pl-6">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold ${remaining < 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                        💰
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Restante</p>
                        <h3 className={`text-2xl font-extrabold mt-1 ${remaining < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {fmtMoney(remaining)}
                        </h3>
                      </div>
                    </div>
                  </div>
                </div>
  ```

- [ ] **Step 2: Add quick navigation selectors for month/year period shifts**
  Modify: `frontend/src/pages/Budgets.tsx` to handle `handlePrevMonth` and `handleNextMonth` click navigation and date logic tracking.

- [ ] **Step 3: Implement status pill filter selectors**
  Modify: `frontend/src/pages/Budgets.tsx` to filter the budgets list on the client side according to the selected filter key ('Todos' | 'Saludable' | 'Por agotar' | 'Excedidos').

- [ ] **Step 4: Update BudgetCard styling to premium cards**
  Modify: `frontend/src/pages/Budgets.tsx` replacing inline elements with gradient progress-bars matching warning thresholds and border highlight markers.

- [ ] **Step 5: Verify build production bundle completes without errors**
  Run: `cmd /c npm run build` inside `frontend/`

- [ ] **Step 6: Commit changes**
  Run: `git commit -m "feat: complete premium budget layout grid design and time-range filtering"`

---
