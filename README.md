# FinanZ – Panel Financiero Personal

> **Control inteligente de tus finanzas personales. Gratis. Sin excusas.**

FinanZ es una plataforma de gestión financiera personal construida con una arquitectura cliente-servidor desacoplada, combinando **React 19 + TypeScript** en el frontend y **Python 3.12 + Django 5** en el backend. Nace para combatir la fragmentación financiera y ofrecer un tutor financiero activo mediante alertas preventivas inteligentes.

---

## 🏗️ Arquitectura

```
FinanZ_PanelFinanciero/
├── backend/
│   ├── apps/           → Módulos (users, finance, budget, goals)
│   ├── config/         → Settings multi-entorno (base/local/production)
│   ├── core/           → Validators, Middleware
│   ├── services/       → Lógica de negocio pura (Service Layer)
│   └── requirements/   → Dependencias por entorno
├── frontend/
│   ├── src/
│   │   ├── components/ → Componentes reutilizables
│   │   ├── pages/      → Vistas (Dashboard, Transacciones, Presupuestos, Metas…)
│   │   ├── services/   → Cliente HTTP (api.ts)
│   │   ├── context/    → AuthContext (Firebase)
│   │   └── utils/      → Helpers y utilidades
│   └── public/         → Activos estáticos
└── docs/mockups/       → Diseños y flujos UX
```

---

## 🚀 Inicio Rápido (Desarrollo)

### Backend (Django)

```bash
# 1. Clonar repositorio
git clone https://github.com/DavidRincon12/FinanZ_PanelFinanciero
cd FinanZ_PanelFinanciero

# 2. Crear y activar entorno virtual
python -m venv .venv
.venv\Scripts\activate   # Windows
# source .venv/bin/activate  # Linux/Mac

# 3. Instalar dependencias de desarrollo
pip install -r backend/requirements/local.txt

# 4. Configurar variables de entorno
cp .env.example .env   # Completar con tus credenciales

# 5. Aplicar migraciones
cd backend
python manage.py migrate

# 6. Correr servidor de desarrollo
python manage.py runserver
```

Accede a: `http://localhost:8000` | Admin: `http://localhost:8000/admin`

### Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

Accede a: `http://localhost:5173`

---

## ⚙️ Configuración Multi-Entorno

| Archivo | Uso |
|---|---|
| `config/settings/base.py` | Ajustes comunes (INSTALLED_APPS, AUTH_USER_MODEL) |
| `config/settings/local.py` | Desarrollo (DEBUG=True, SQLite, consola de email) |
| `config/settings/production.py` | Producción (Neon PostgreSQL, Whitenoise, HTTPS) |

La variable `DJANGO_SETTINGS_MODULE` en `.env` controla el entorno activo.

---

## 🧱 Stack Tecnológico

| Capa | Tecnología |
|---|---|
| **Frontend** | React 19 + TypeScript |
| **Build Tool** | Vite |
| **Routing** | React Router DOM v7 |
| **Estilos** | Tailwind CSS v4 |
| **Animaciones** | Framer Motion |
| **Gráficos** | Recharts |
| **Backend** | Python 3.12 + Django 5.x |
| **API REST** | Django REST Framework |
| **Base de Datos (dev)** | SQLite |
| **Base de Datos (prod)** | PostgreSQL (Neon Serverless) |
| **Autenticación** | Firebase Authentication (Google OAuth 2.0) |
| **Servidor WSGI** | Gunicorn |
| **Estáticos (prod)** | Whitenoise |
| **Hosting Frontend** | Vercel |
| **Hosting Backend** | Render |

---

## 📦 Módulos

- **`apps/users`** – Autenticación con Firebase, `CustomUser` con perfil financiero
- **`apps/finance`** – Transacciones, categorías, balance dinámico
- **`apps/budget`** – Presupuestos mensuales + alertas al 80 % y 100 % de consumo
- **`apps/goals`** – Metas de ahorro con seguimiento de progreso

---

## 🌐 Despliegue

| Servicio | Plataforma | Descripción |
|---|---|---|
| **Frontend** | Vercel | Despliegue continuo desde `main`, CDN global. El `vercel.json` redirige las peticiones `/api/*`, `/finance/*`, `/budget/*`, `/goals/*` al backend en Render |
| **Backend** | Render | Configurado via `render.yaml` con Python 3.12, Gunicorn y variables de entorno seguras |
| **Base de Datos** | Neon PostgreSQL | Conexión serverless con `sslmode=require` vía `DATABASE_URL` |

---

## 🔒 Seguridad

- Variables sensibles en `.env` (nunca en Git, excluidas por `.gitignore`)
- Consultas vía ORM de Django (anti-inyección SQL)
- CORS configurado explícitamente con `django-cors-headers`
- HTTPS forzado en producción
- Credenciales de Firebase gestionadas como variables de entorno en Render
- Rutas del frontend protegidas con `ProtectedRoute` (requieren sesión activa)

---

## 📋 Estado del Proyecto

- [x] **Fase 1** – Arquitectura base y entorno multi-entorno
- [x] **Fase 2** – Autenticación con Firebase y base de datos en la nube (Neon)
- [x] **Fase 3** – Motor de transacciones (ingresos, egresos, categorías, balance)
- [x] **Fase 4** – Presupuestos con alertas y metas de ahorro con seguimiento
- [x] **Fase 5** – Dashboard visual con gráficos (Recharts) y perfil de usuario
- [x] **Fase 6** – Despliegue a producción (Vercel + Render + Neon, costo cero)

---

*Desarrollado siguiendo el plan estratégico "Hoja de Ruta FinanZ 2026".*
