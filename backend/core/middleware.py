"""
Core – middleware
Middleware personalizado para FinanZ.
"""
import logging

logger = logging.getLogger(__name__)


class RequestLoggingMiddleware:
    """
    Middleware ligero que registra cada request en modo DEBUG.
    Solo activo en entorno de desarrollo.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        logger.debug("→ %s %s [user=%s]", request.method, request.path,
                     request.user if request.user.is_authenticated else "anonymous")
        response = self.get_response(request)
        logger.debug("← %s %s [status=%s]", request.method, request.path, response.status_code)
        return response
