# Plan de Implementación: Personalización, Concientización Financiera y Rediseño de Presupuestos

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement full personalization of the financial profile, a monthly overspending panel with alert history, a premium budget dashboard layout, and fix all browser console warnings in FinanZ.

**Architecture:** Extend Django's CustomUser model to persist profile fields. Update the REST authentication context. Design a step-by-step React modal on first Dashboard visit. Build responsive dashboard recommendations and overspending Recharts bar charts. Restructure the Budgets UI into a modular grid with visual summary widgets and interactive period filters.

**Tech Stack:** React 19, TypeScript, Django 5.x, SQLite, Tailwind CSS v4, Recharts, Framer Motion, Lucide Icons.

## Global Constraints
- Target workspace directories: `frontend/` and `backend/`.
- Maintain docstrings and comments in untouched sections.
- Keep components modular and responsive.
- Always perform verification check steps after edits.

---

### Task 1: Depuración Técnica (Consola)

**Files:**
- Create: (None)
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
- Produces: Correctly configured Tailwind v4 build, autocomplete attributes, single Google SDK GSI initialization, and warning-free Recharts container heights.

- [ ] **Step 1: Install @tailwindcss/vite**
  Run: `npm install -D @tailwindcss/vite` in `C:/Users/David/Documents/GitHub/FinanZ_PanelFinanciero/frontend`

- [ ] **Step 2: Add Tailwind CSS plugin to Vite config**
  Modify: `frontend/vite.config.ts` to load the tailwindcss plugin.
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

- [ ] **Step 3: Add @import to index.css**
  Modify: `frontend/src/index.css` to add `@import "tailwindcss";` at line 1.

- [ ] **Step 4: Clean up index.html**
  Modify: `frontend/index.html` to remove `<script src="https://cdn.tailwindcss.com"></script>` and the `tailwind.config` block.

- [ ] **Step 5: Add autocomplete to password inputs**
  Modify: `frontend/src/pages/Login.tsx` around lines 202-210:
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
  Modify: `frontend/src/pages/Register.tsx` to add `autoComplete="new-password"` to password and confirmPassword inputs.

- [ ] **Step 6: Prevent duplicate Google SDK initialization**
  Modify: `frontend/src/pages/Login.tsx` to guard initialization with `window.googleInitialized`:
  ```typescript
        if (!window.googleInitialized) {
          window.google!.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: (response: GoogleCredentialResponse) => {
              if (window.handleCredentialResponse) {
                window.handleCredentialResponse(response);
              }
            },
          });
          window.googleInitialized = true;
        }
  ```

- [ ] **Step 7: Fix Recharts ResponsiveContainer warnings**
  Modify: `frontend/src/pages/Dashboard.tsx` to add `minWidth={0}` and `minHeight={0}` on all `<ResponsiveContainer>` tags.

- [ ] **Step 8: Verify console errors are fixed**
  Verify: Compile the frontend by running `npm run build` inside `frontend/`. Check that build completes successfully.

- [ ] **Step 9: Commit changes**
  Run: `git add .` and `git commit -m "chore: fix console warnings and setup native tailwind v4"`

---

### Task 2: Backend - Modificar Modelo CustomUser y APIs

**Files:**
- Modify:
  - `backend/apps/users/models.py`
  - `backend/apps/users/views.py`

**Interfaces:**
- Consumes: Django authentication models.
- Produces: SQLite schema with new user fields, updated JSON response from `/api/me/`, and profile updates via `/api/profile/update/`.

- [ ] **Step 1: Add new fields to CustomUser**
  Modify: `backend/apps/users/models.py` to add `personal_activity`, `tastes`, `monthly_income` and `is_survey_completed`.

- [ ] **Step 2: Generate Django Migrations**
  Run: `python manage.py makemigrations` in `C:/Users/David/Documents/GitHub/FinanZ_PanelFinanciero/backend` using the active environment.

- [ ] **Step 3: Apply migrations to SQLite**
  Run: `python manage.py migrate` in `C:/Users/David/Documents/GitHub/FinanZ_PanelFinanciero/backend`.

- [ ] **Step 4: Update APIs in users views**
  Modify: `backend/apps/users/views.py`:
  - Update `me_api` to include:
    ```python
    "personal_activity": request.user.personal_activity,
    "tastes": request.user.tastes,
    "monthly_income": float(request.user.monthly_income),
    "is_survey_completed": request.user.is_survey_completed,
    ```
  - Update `profile_update_api` to parse:
    - `personal_activity`, `tastes`, `monthly_income` (Decimal), and update `is_survey_completed` to `True` if these fields are provided.

- [ ] **Step 5: Verify backend APIs**
  Verify: Run Django development server and check endpoint results.

- [ ] **Step 6: Commit changes**
  Run: `git add .` and `git commit -m "backend: add personalization fields to user model and apis"`

---

### Task 3: Frontend - Modal de Encuesta en Dashboard

**Files:**
- Modify:
  - `frontend/src/services/api.ts`
  - `frontend/src/pages/Dashboard.tsx`

**Interfaces:**
- Consumes: `api.updateProfile` from `api.ts`.
- Produces: An interactive step-by-step survey modal for users that haven't completed their profile survey.

- [ ] **Step 1: Update API typescript definitions**
  Modify: `frontend/src/services/api.ts` to add `personal_activity`, `tastes`, `monthly_income`, and `is_survey_completed` to user profile methods.

- [ ] **Step 2: Implement SurveyModal Component**
  Modify: `frontend/src/pages/Dashboard.tsx` to add a new `SurveyModal` React component with 3 steps (Ocupación selection, Tastes checkboxes, Income numeric field) and Framer Motion layout animations.

- [ ] **Step 3: Inject SurveyModal render**
  Modify: `frontend/src/pages/Dashboard.tsx` around rendering container, showing `SurveyModal` if `user.is_survey_completed` is false.

- [ ] **Step 4: Verify saving profile**
  Verify: Complete the modal and see if profile updates successfully via network call.

- [ ] **Step 5: Commit changes**
  Run: `git commit -m "feat: implement step-by-step financial survey modal"`

---

### Task 4: Frontend - Consejos Dinámicos y Banner 50/30/20

**Files:**
- Modify:
  - `frontend/src/pages/Dashboard.tsx`

**Interfaces:**
- Consumes: Updated User state.
- Produces: Personalization tips container and automatic 50/30/20 budget setup button.

- [ ] **Step 1: Write Dynamic Recommendation Logic**
  Modify: `frontend/src/pages/Dashboard.tsx` to include advice generation helper functions that return custom tips based on `user.personal_activity` (student, employee, etc.) and `user.tastes` (technology, food, etc.).

- [ ] **Step 2: Implement dynamic recommendations card**
  Modify: `frontend/src/pages/Dashboard.tsx` to render a modern glassmorphic card on the dashboard with the dynamic tip.

- [ ] **Step 3: Implement 50/30/20 recommendations banner**
  Modify: `frontend/src/pages/Dashboard.tsx` to render an actionable banner if the user has no budgets set, offering to automatically pre-fill categories using 50% needs, 30% wants, 20% savings calculated from `user.monthly_income`.

- [ ] **Step 4: Commit changes**
  Run: `git commit -m "feat: add dynamic advice engine and automatic budget suggestions"`

---

### Task 5: Frontend - Panel de Concientización y Historial de Sobregasto

**Files:**
- Modify:
  - `frontend/src/pages/Budgets.tsx`

**Interfaces:**
- Consumes: Historical transaction sums per month, and alert lists from backend `Notification` objects.
- Produces: Visual historical spending bar chart and comparative alert log section.

- [ ] **Step 1: Implement Historical Spending Comparison Chart**
  Modify: `frontend/src/pages/Budgets.tsx` to render a comparison chart of the past 6 months comparing actual total monthly expenses vs budgeted monthly limit. If actual > limit, color the bar red.

- [ ] **Step 2: Render Historical Alerts and comparative logs**
  Modify: `frontend/src/pages/Budgets.tsx` to display lists of past overspending notifications from the user's alerts. Add a comparative sentence comparing this month's overgasto count vs last month's count.

- [ ] **Step 3: Commit changes**
  Run: `git commit -m "feat: add historical overspending charts and alert log panel"`

---

### Task 6: Frontend - Rediseño Premium de la Página de Presupuestos

**Files:**
- Modify:
  - `frontend/src/pages/Budgets.tsx`

**Interfaces:**
- Consumes: Current budget lists and month state.
- Produces: Completely redesigned premium grid layout with header summaries, month navigation selectors, and filter chips.

- [ ] **Step 1: Build Top Summary Card**
  Modify: `frontend/src/pages/Budgets.tsx` to implement the summary container showing total budgeted, total spent, remaining balance, and global progress bar.

- [ ] **Step 2: Add quick filter pills**
  Modify: `frontend/src/pages/Budgets.tsx` to include interactive filters: "Todos", "Saludable", "Por agotar", "Excedidos".

- [ ] **Step 3: Add period navigation selectors**
  Modify: `frontend/src/pages/Budgets.tsx` to support month and year state modifications, updating calculations dynamically.

- [ ] **Step 4: Redesign budget cards**
  Modify: `frontend/src/pages/Budgets.tsx` to render responsive cards with glassmorphic styles, progress-bar gradients, and click/hover scales.

- [ ] **Step 5: Run final build and verification tests**
  Verify: Run `npm run build` and ensure everything builds with zero compiler or layout errors.

- [ ] **Step 6: Commit changes**
  Run: `git commit -m "feat: finalize premium budget grid layout and historical filters"`
