"""
FinanZ – ASGI entry point
Preparado para soporte asíncrono (WebSockets, Django Channels en el futuro).
"""
import os
from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.local")
application = get_asgi_application()
