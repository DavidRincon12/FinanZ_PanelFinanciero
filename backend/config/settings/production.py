"""
FinanZ – Settings Production (Render + Neon PostgreSQL)
Extiende base.py con configuración endurecida para producción.
DEBUG=False, Postgres via DATABASE_URL, Whitenoise para estáticos.
"""
from .base import *  # noqa: F401, F403

# ---------------------------------------------------------------------------
# Debug
# ---------------------------------------------------------------------------
DEBUG = False

# ---------------------------------------------------------------------------
# Base de datos – PostgreSQL Neon (Serverless)
# Requiere: DATABASE_URL=postgresql://user:pass@host/dbname?sslmode=require
# ---------------------------------------------------------------------------
DATABASES = {
    "default": env.db("DATABASE_URL")
}

# Configuración extra para PostgreSQL (timeouts, pool)
DATABASES["default"]["CONN_MAX_AGE"] = 60
DATABASES["default"]["OPTIONS"] = {"sslmode": "require"}

# ---------------------------------------------------------------------------
# Whitenoise – servir archivos estáticos sin servidor de archivos externo
# ---------------------------------------------------------------------------
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",   # justo después de SecurityMiddleware
] + MIDDLEWARE[1:]  # type: ignore[name-defined]

STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

# ---------------------------------------------------------------------------
# Seguridad endurecida (HTTPS)
# ---------------------------------------------------------------------------
SECURE_HSTS_SECONDS = 31536000           # 1 año
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"

# ---------------------------------------------------------------------------
# Email – Brevo SMTP transaccional
# ---------------------------------------------------------------------------
EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = env("EMAIL_HOST", default="smtp-relay.brevo.com")
EMAIL_PORT = env.int("EMAIL_PORT", default=587)
EMAIL_HOST_USER = env("EMAIL_HOST_USER")
EMAIL_HOST_PASSWORD = env("EMAIL_HOST_PASSWORD")
EMAIL_USE_TLS = True

# ---------------------------------------------------------------------------
# Caché (añadir Redis si escala)
# ---------------------------------------------------------------------------
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
    }
}

# ---------------------------------------------------------------------------
# Logging en producción (errores y warnings)
# ---------------------------------------------------------------------------
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "{levelname} {asctime} {module} {message}",
            "style": "{",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "verbose",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": "WARNING",
    },
    "loggers": {
        "django": {
            "handlers": ["console"],
            "level": "ERROR",
            "propagate": False,
        },
    },
}
