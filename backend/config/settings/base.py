"""
FinanZ – Settings Base
Configuración común a todos los entornos.
No incluye secretos ni credenciales. Usa django-environ para leer .env
"""
import environ
from pathlib import Path

# ---------------------------------------------------------------------------
# Rutas
# BASE_DIR apunta a backend/  (donde vive manage.py)
# ROOT_DIR apunta a la raíz del repositorio
# ---------------------------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent.parent.parent   # backend/
ROOT_DIR = BASE_DIR.parent                                  # FinanZ_PanelFinanciero/

# Inicializar environ y leer el archivo .env de la raíz
env = environ.Env()
environ.Env.read_env(ROOT_DIR / ".env")

# ---------------------------------------------------------------------------
# Inicialización de Firebase Admin SDK para Autenticación
# ---------------------------------------------------------------------------
import firebase_admin
from firebase_admin import credentials
import logging
logger = logging.getLogger(__name__)

# En desarrollo leemos un archivo JSON local.
# En producción (Render) lo podríamos pasar vía base64 o como variable de entorno
FIREBASE_CREDENTIALS_PATH = env("FIREBASE_CREDENTIALS_PATH", default=str(ROOT_DIR / "firebase-credentials.json"))

try:
    if not firebase_admin._apps:
        cred = credentials.Certificate(FIREBASE_CREDENTIALS_PATH)
        firebase_admin.initialize_app(cred)
        logger.info("Firebase Admin inicializado correctamente.")
except Exception as e:
    logger.warning("No se pudo inicializar Firebase Admin (probablemente falte el archivo JSON).")
    logger.warning(f"Error: {e}")

# ---------------------------------------------------------------------------
# Seguridad
# ---------------------------------------------------------------------------
SECRET_KEY = env("SECRET_KEY")

# Evitar bloqueos de popups de Google y Firebase (COOP)
SECURE_CROSS_ORIGIN_OPENER_POLICY = 'same-origin-allow-popups'

# Permitir a Google GSI leer nuestro localhost (origin mismatch bypass)
SECURE_REFERRER_POLICY = 'no-referrer-when-downgrade'

ALLOWED_HOSTS = env.list("ALLOWED_HOSTS", default=["localhost", "127.0.0.1"])

# ---------------------------------------------------------------------------
# Aplicaciones instaladas
# ---------------------------------------------------------------------------
DJANGO_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
]

THIRD_PARTY_APPS = [
    # Añadir librerías externas aquí según se instalen
]

LOCAL_APPS = [
    "apps.users",
    "apps.finance",
    "apps.budget",
    "apps.goals",
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

# ---------------------------------------------------------------------------
# Middleware
# ---------------------------------------------------------------------------
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

# ---------------------------------------------------------------------------
# Templates – apunta al directorio frontend/templates/
# ---------------------------------------------------------------------------
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [ROOT_DIR / "frontend" / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

# ---------------------------------------------------------------------------
# Modelo de usuario personalizado (CRÍTICO: definir desde el inicio)
# ---------------------------------------------------------------------------
AUTH_USER_MODEL = "users.CustomUser"

# ---------------------------------------------------------------------------
# Validadores de contraseña
# ---------------------------------------------------------------------------
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# ---------------------------------------------------------------------------
# Configuración de Autenticación / Rutas
# ---------------------------------------------------------------------------
LOGIN_URL = "users:login"
LOGIN_REDIRECT_URL = "users:dashboard"
LOGOUT_REDIRECT_URL = "users:login"

# ---------------------------------------------------------------------------
# Internacionalización
# ---------------------------------------------------------------------------
LANGUAGE_CODE = "es-co"
TIME_ZONE = "America/Bogota"
USE_I18N = True
USE_TZ = True

# ---------------------------------------------------------------------------
# Archivos estáticos y media – apuntan al directorio frontend/
# ---------------------------------------------------------------------------
STATIC_URL = "/static/"
STATICFILES_DIRS = [ROOT_DIR / "frontend" / "static"]
STATIC_ROOT = BASE_DIR / "staticfiles"   # destino para collectstatic en producción

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

# ---------------------------------------------------------------------------
# Clave primaria por defecto
# ---------------------------------------------------------------------------
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ---------------------------------------------------------------------------
# Email – valores base (sobreescritos en local.py / production.py)
# ---------------------------------------------------------------------------
EMAIL_BACKEND = env(
    "EMAIL_BACKEND",
    default="django.core.mail.backends.console.EmailBackend",
)
EMAIL_HOST = env("EMAIL_HOST", default="")
EMAIL_PORT = env.int("EMAIL_PORT", default=587)
EMAIL_HOST_USER = env("EMAIL_HOST_USER", default="")
EMAIL_HOST_PASSWORD = env("EMAIL_HOST_PASSWORD", default="")
EMAIL_USE_TLS = env.bool("EMAIL_USE_TLS", default=True)
DEFAULT_FROM_EMAIL = env("DEFAULT_FROM_EMAIL", default="FinanZ <noreply@finanz.app>")
