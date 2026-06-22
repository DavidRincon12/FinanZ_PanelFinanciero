"""
FinanZ – Settings Local (Desarrollo)
Extiende base.py con configuración para desarrollo local.
DEBUG=True, SQLite por defecto, herramientas de debugging habilitadas.
"""
from .base import *  # noqa: F401, F403

# ---------------------------------------------------------------------------
# Debug
# ---------------------------------------------------------------------------
DEBUG = env.bool("DEBUG", default=True)

# ---------------------------------------------------------------------------
# Base de datos – SQLite para desarrollo rápido
# Cambia a postgresql://... en .env si prefieres Postgres local
# ---------------------------------------------------------------------------
DATABASES = {
    "default": env.db(
        "DATABASE_URL",
        default=f"sqlite:///{BASE_DIR / 'db.sqlite3'}",
    )
}

# ---------------------------------------------------------------------------
# Seguridad relajada para desarrollo
# ---------------------------------------------------------------------------
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True

CSRF_TRUSTED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

# Permitir cookies de sesión en peticiones same-site (compatibles con el proxy de Vite en HTTP)
SESSION_COOKIE_SAMESITE = 'Lax'
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SAMESITE = 'Lax'
CSRF_COOKIE_SECURE = False

# Evitar que CSRF bloquee peticiones AJAX en desarrollo
# (Alternativa: usar @csrf_exempt en las vistas de la API)

# ---------------------------------------------------------------------------
# Caché simple en memoria (sin Redis en local)
# ---------------------------------------------------------------------------
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
    }
}

# ---------------------------------------------------------------------------
# Email – mostrar en consola por defecto, configurable vía .env
# ---------------------------------------------------------------------------
EMAIL_BACKEND = env("EMAIL_BACKEND", default="django.core.mail.backends.console.EmailBackend")
EMAIL_HOST = env("EMAIL_HOST", default="smtp-relay.sendinblue.com")
EMAIL_PORT = env.int("EMAIL_PORT", default=587)
EMAIL_HOST_USER = env("EMAIL_HOST_USER", default="")
EMAIL_HOST_PASSWORD = env("EMAIL_HOST_PASSWORD", default="")
EMAIL_USE_TLS = env.bool("EMAIL_USE_TLS", default=True)

# ---------------------------------------------------------------------------
# django-debug-toolbar (instalar con: pip install django-debug-toolbar)
# Descomenta cuando lo tengas instalado
# ---------------------------------------------------------------------------
# INSTALLED_APPS += ["debug_toolbar"]
# MIDDLEWARE = ["debug_toolbar.middleware.DebugToolbarMiddleware"] + MIDDLEWARE
# INTERNAL_IPS = ["127.0.0.1"]

# ---------------------------------------------------------------------------
# Logging básico en desarrollo
# ---------------------------------------------------------------------------
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {
        "console": {"class": "logging.StreamHandler"},
    },
    "root": {
        "handlers": ["console"],
        "level": "DEBUG",
    },
}
