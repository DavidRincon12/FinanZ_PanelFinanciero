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
CORS_ALLOW_ALL_ORIGINS = True   # si se añade django-cors-headers

# ---------------------------------------------------------------------------
# Caché simple en memoria (sin Redis en local)
# ---------------------------------------------------------------------------
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
    }
}

# ---------------------------------------------------------------------------
# Email – mostrar en consola durante desarrollo
# ---------------------------------------------------------------------------
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

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
