# FinanZ – Panel Financiero Personal

> **Control inteligente de tus finanzas personales. Gratis. Sin excusas.**

FinanZ es una plataforma de gestión financiera personal construida con **Django 5** y principios
de arquitectura limpia. Nace para combatir la fragmentación financiera y ofrecer un tutor
financiero activo mediante alertas preventivas inteligentes.

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
│   ├── templates/      → HTML por módulo
│   └── static/         → CSS, JS, Chart.js
└── docs/mockups/       → Diseños y flujos UX
```

## 🚀 Inicio Rápido (Desarrollo)

```bash
# 1. Clonar repositorio
git clone https://github.com/tu-usuario/FinanZ_PanelFinanciero
cd FinanZ_PanelFinanciero

# 2. Crear y activar entorno virtual
python -m venv .venv
.venv\Scripts\activate   # Windows
# source .venv/bin/activate  # Linux/Mac

# 3. Instalar dependencias de desarrollo
pip install -r backend/requirements/local.txt

# 4. Sincronizar Base de datois NeonDB
python manage.py makemigrations
python manage.py migrate

# 5. Correr servidor de desarrollo
python manage.py runserver
```

Accede a: `http://localhost:8000`  |  Admin: `http://localhost:8000/admin`

---

## ⚙️ Configuración Multi-Entorno

| Archivo | Uso |
|---|---|
| `config/settings/base.py` | Ajustes comunes (INSTALLED_APPS, TEMPLATES, AUTH_USER_MODEL) |
| `config/settings/local.py` | Desarrollo (DEBUG=True, SQLite, console email) |
| `config/settings/production.py` | Producción (Neon Postgres, Whitenoise, HTTPS) |

La variable `DJANGO_SETTINGS_MODULE` en `.env` controla el entorno activo.

---

## 🧱 Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Backend | Python 3.12 + Django 5.x |
| Base de Datos (dev) | SQLite |
| Base de Datos (prod) | PostgreSQL (Neon Serverless) |
| Hosting | Render (free tier) |
| Estáticos | Whitenoise + Cloudflare |
| Autenticación | Google Auth (Firebase) |
| Email | Brevo SMTP (300/día gratis) |
| Gráficos | Chart.js |
| Estilos | Bootstrap 5 |

---

## 📦 Módulos

- **`apps/users`** – Autenticación, `CustomUser` con perfil financiero
- **`apps/finance`** – Transacciones, categorías, balance dinámico
- **`apps/budget`** – Presupuestos mensuales + alertas 80%/100%
- **`apps/goals`** – Metas de ahorro con seguimiento de progreso

---

## 🔒 Seguridad

- Variables sensibles en `.env` (nunca en Git)
- Consultas via ORM (anti-inyección SQL)
- HTTPS forzado en producción
- Políticas de contraseña fuertes
- Expiración de sesión configurable

---

## 📋 Plan de Fases

- [x] **Fase 1** – Arquitectura Base y Entorno
- [ ] **Fase 2** – Autenticación Social y Base de Datos Externa en la Nube
- [ ] **Fase 3** – El Motor de Transacciones (Core MVP)
- [ ] **Fase 4** – Inteligencia de Presupuestos y Metas
- [ ] **Fase 5** – Automatización de Alertas y Dashboard Visual
- [ ] **Fase 6** – Despliegue a Producción (Costo Cero)

---

*Desarrollado siguiendo el plan estratégico "Hoja de Ruta FinanZ 2026".*
