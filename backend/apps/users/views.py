"""
Views – users
Autenticación, registro y perfil de usuario.
"""
from django.shortcuts import render, redirect
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
import logging

from services.auth_service import verify_firebase_token, get_or_create_user_from_firebase

logger = logging.getLogger(__name__)


from django.conf import settings

def login_view(request):
    """Vista visual de inicio de sesión."""
    if request.user.is_authenticated:
        return redirect("users:dashboard")
    
    context = {
        "FIREBASE_API_KEY": settings.FIREBASE_API_KEY,
        "FIREBASE_AUTH_DOMAIN": settings.FIREBASE_AUTH_DOMAIN,
        "FIREBASE_PROJECT_ID": settings.FIREBASE_PROJECT_ID,
        "FIREBASE_STORAGE_BUCKET": settings.FIREBASE_STORAGE_BUCKET,
        "FIREBASE_MESSAGING_SENDER_ID": settings.FIREBASE_MESSAGING_SENDER_ID,
        "FIREBASE_APP_ID": settings.FIREBASE_APP_ID,
        "FIREBASE_MEASUREMENT_ID": settings.FIREBASE_MEASUREMENT_ID,
        "GOOGLE_CLIENT_ID": settings.GOOGLE_CLIENT_ID,
    }
    return render(request, "users/login.html", context)

@csrf_exempt
def firebase_login(request):
    """
    Endpoint AJAX (/api/firebase-login/).
    Toma el idToken via POST JSON, lo verifica con Firebase Admin, 
    crea o busca al CustomUser y establece la sesión de Django.
    """
    if request.method != "POST":
        return JsonResponse({"error": "Método no permitido"}, status=405)
    
    try:
        body = json.loads(request.body)
        id_token = body.get("idToken")
        
        if not id_token:
            return JsonResponse({"error": "idToken es requerido"}, status=400)
            
        # Llamar a nuestra capa de servicios (aisla la lógica de Firebase)
        decoded_token = verify_firebase_token(id_token)
        user = get_or_create_user_from_firebase(decoded_token)
        
        # Validar el login en el request de Django (crear la cookie de sesión)
        # specify backend as CustomUser has no explicit backend set by authenticate() here
        login(request, user, backend='django.contrib.auth.backends.ModelBackend')
        
        return JsonResponse({"status": "success", "message": "Autenticado con Google exitosamente."})
        
    except ValueError as e:
        logger.warning(f"Error de validación de token: {e}")
        return JsonResponse({"error": str(e)}, status=401)
    except Exception as e:
        logger.error(f"Error interno en login con Firebase: {e}")
        return JsonResponse({"error": "Error interno del servidor"}, status=500)


def logout_view(request):
    """Vista de cierre de sesión."""
    logout(request)
    return redirect("users:login")




@login_required
def dashboard(request):
    """Dashboard principal – punto de entrada autenticado."""
    return render(request, "users/dashboard.html", {"user": request.user})


@login_required
def profile_view(request):
    """Perfil y configuración de alertas del usuario."""
    return render(request, "users/profile.html", {"user": request.user})
