"""
Views – users
Autenticación, registro y perfil de usuario.
"""
from django.shortcuts import render, redirect
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt, ensure_csrf_cookie
import json
import logging
import random
from django.core.mail import send_mail

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
        
        # DEVELOPMENT BYPASS: Si es 'development_token' y estamos en DEBUG, saltamos verificación
        if settings.DEBUG and id_token == "development_token":
            from django.contrib.auth import get_user_model
            User = get_user_model()
            user, _ = User.objects.get_or_create(
                email="dev@example.com",
                defaults={"username": "dev_user", "first_name": "Dev", "last_name": "User"}
            )
            login(request, user, backend='django.contrib.auth.backends.ModelBackend')
            return JsonResponse({"status": "success", "message": "Autenticado en modo desarrollo."})

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
    """Dashboard principal con datos financieros reales."""
    from services.finance_selectors import (
        calculate_balance,
        get_user_transactions,
        get_expenses_by_category,
        get_monthly_balance_series,
    )
    from apps.budget.models import Notification

    balance = calculate_balance(user=request.user)
    recent_transactions = get_user_transactions(user=request.user)[:5]
    unread_notifications = Notification.objects.filter(
        user=request.user, is_read=False
    ).count()

    return render(request, "users/dashboard.html", {
        "user": request.user,
        "balance": balance,
        "recent_transactions": recent_transactions,
        "unread_notifications": unread_notifications,
    })


@login_required
def profile_view(request):
    """Perfil y configuración de alertas del usuario."""
    return render(request, "users/profile.html", {"user": request.user})


@csrf_exempt
def login_api(request):
    """API de inicio de sesión con email y contraseña."""
    if request.method != "POST":
        return JsonResponse({"error": "Método no permitido"}, status=405)
    try:
        data = json.loads(request.body)
        email = data.get("email")
        password = data.get("password")
        
        if not email or not password:
            return JsonResponse({"error": "Faltan campos requeridos"}, status=400)
        
        from django.contrib.auth import get_user_model
        User = get_user_model()
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return JsonResponse({"error": "Credenciales inválidas"}, status=401)
            
        # Check password first
        if not user.check_password(password):
            return JsonResponse({"error": "Credenciales inválidas"}, status=401)
            
        # If user password is correct but they are not active, send verification code
        if not user.is_active:
            code = f"{random.randint(100000, 999999)}"
            user.verification_code = code
            user.save(update_fields=["verification_code"])
            
            # Send code to console/email
            send_mail(
                subject="Código de verificación - FinanZ",
                message=f"Hola {user.first_name or user.username},\n\nTu cuenta requiere verificación para iniciar sesión. Tu código de verificación es: {code}\n\nIntroduce este código en la pantalla de verificación para activar tu cuenta.",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=True
            )
            return JsonResponse({
                "status": "verification_required",
                "email": user.email,
                "message": "Tu cuenta requiere verificación. Te hemos enviado un nuevo código."
            })

        from django.contrib.auth import authenticate
        authenticated_user = authenticate(request, username=user.username, password=password)
        
        if authenticated_user is not None:
            login(request, authenticated_user)
            return JsonResponse({
                "status": "success",
                "user": {
                    "id": str(authenticated_user.id),
                    "email": authenticated_user.email,
                    "name": authenticated_user.get_full_name() or authenticated_user.username,
                }
            })
        else:
            return JsonResponse({"error": "Credenciales inválidas"}, status=401)
    except Exception as e:
        logger.error(f"Error en login_api: {e}")
        return JsonResponse({"error": "Error interno del servidor"}, status=500)


@csrf_exempt
def register_api(request):
    """API de registro para nuevos usuarios."""
    if request.method != "POST":
        return JsonResponse({"error": "Método no permitido"}, status=405)
    try:
        data = json.loads(request.body)
        email = data.get("email")
        password = data.get("password")
        name = data.get("name", "")
        
        if not email or not password:
            return JsonResponse({"error": "Faltan campos requeridos"}, status=400)
            
        from django.contrib.auth import get_user_model
        User = get_user_model()
        if User.objects.filter(email=email).exists():
            existing_user = User.objects.get(email=email)
            if not existing_user.is_active:
                code = f"{random.randint(100000, 999999)}"
                existing_user.verification_code = code
                existing_user.save(update_fields=["verification_code"])
                send_mail(
                    subject="Código de verificación - FinanZ",
                    message=f"Hola {existing_user.first_name or existing_user.username},\n\nTu cuenta requiere verificación para iniciar sesión. Tu código de verificación es: {code}\n\nIntroduce este código en la pantalla de verificación para activar tu cuenta.",
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[existing_user.email],
                    fail_silently=True
                )
                return JsonResponse({
                    "status": "verification_required",
                    "email": email,
                    "message": "Este correo ya está registrado pero requiere verificación. Se ha enviado un nuevo código."
                })
            return JsonResponse({"error": "El correo electrónico ya está registrado"}, status=400)
            
        username = email.split('@')[0]
        base_username = username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}_{counter}"
            counter += 1
            
        first_name = name
        last_name = ""
        if " " in name:
            parts = name.split(" ", 1)
            first_name = parts[0]
            last_name = parts[1]
            
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name
        )
        user.is_active = False
        code = f"{random.randint(100000, 999999)}"
        user.verification_code = code
        user.save()
        
        # Enviar email
        send_mail(
            subject="Verificación de cuenta - FinanZ",
            message=f"Hola {user.first_name or user.username},\n\nGracias por registrarte en FinanZ. Tu código de verificación es: {code}\n\nIntroduce este código en la aplicación para activar tu cuenta.",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=True
        )
        
        return JsonResponse({
            "status": "verification_required",
            "email": email,
            "message": "Registro exitoso. Introduce el código enviado a tu correo."
        })
    except Exception as e:
        logger.error(f"Error en register_api: {e}")
        return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
def verify_email_api(request):
    """API para verificar el código de correo y activar la cuenta."""
    if request.method != "POST":
        return JsonResponse({"error": "Método no permitido"}, status=405)
    try:
        data = json.loads(request.body)
        email = data.get("email")
        code = data.get("code")
        
        if not email or not code:
            return JsonResponse({"error": "Correo y código son requeridos"}, status=400)
            
        from django.contrib.auth import get_user_model
        User = get_user_model()
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return JsonResponse({"error": "Usuario no encontrado"}, status=404)
            
        if user.is_active:
            return JsonResponse({"error": "Esta cuenta ya está verificada"}, status=400)
            
        if user.verification_code == str(code).strip():
            user.is_active = True
            user.verification_code = None
            user.save(update_fields=["is_active", "verification_code"])
            
            # Autologin
            login(request, user)
            
            return JsonResponse({
                "status": "success",
                "user": {
                    "id": str(user.id),
                    "email": user.email,
                    "name": user.get_full_name() or user.username,
                }
            })
        else:
            return JsonResponse({"error": "Código de verificación incorrecto"}, status=400)
    except Exception as e:
        logger.error(f"Error en verify_email_api: {e}")
        return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
def resend_code_api(request):
    """API para reenviar el código de verificación por correo."""
    if request.method != "POST":
        return JsonResponse({"error": "Método no permitido"}, status=405)
    try:
        data = json.loads(request.body)
        email = data.get("email")
        
        if not email:
            return JsonResponse({"error": "El correo es requerido"}, status=400)
            
        from django.contrib.auth import get_user_model
        User = get_user_model()
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return JsonResponse({"error": "Usuario no encontrado"}, status=404)
            
        if user.is_active:
            return JsonResponse({"error": "Esta cuenta ya está verificada"}, status=400)
            
        code = f"{random.randint(100000, 999999)}"
        user.verification_code = code
        user.save(update_fields=["verification_code"])
        
        # Enviar email
        send_mail(
            subject="Código de verificación - FinanZ",
            message=f"Hola {user.first_name or user.username},\n\nTu nuevo código de verificación es: {code}\n\nIntroduce este código en la aplicación para activar tu cuenta.",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=True
        )
        
        return JsonResponse({
            "status": "success",
            "message": "Código reenviado correctamente"
        })
    except Exception as e:
        logger.error(f"Error en resend_code_api: {e}")
        return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
def logout_api(request):
    """API de cierre de sesión."""
    logout(request)
    return JsonResponse({"status": "success", "message": "Sesión cerrada correctamente."})


@ensure_csrf_cookie
def me_api(request):
    """Verifica si el usuario está autenticado y retorna sus datos."""
    if request.user.is_authenticated:
        return JsonResponse({
            "authenticated": True,
            "user": {
                "id": str(request.user.id),
                "email": request.user.email,
                "name": request.user.get_full_name() or request.user.username,
                "monthly_budget": float(request.user.monthly_budget),
                "alert_at_80_percent": request.user.alert_at_80_percent,
                "alert_at_100_percent": request.user.alert_at_100_percent,
                "timezone": request.user.timezone,
                "personal_activity": request.user.personal_activity,
                "tastes": request.user.tastes,
                "monthly_income": float(request.user.monthly_income),
                "is_survey_completed": request.user.is_survey_completed,
            }
        })
    return JsonResponse({"authenticated": False}, status=401)


@csrf_exempt
@login_required
def profile_update_api(request):
    """
    API para actualizar la configuración de perfil del usuario.
    """
    if request.method != "POST":
        return JsonResponse({"error": "Método no permitido"}, status=405)
    
    try:
        data = json.loads(request.body)
        user = request.user
        
        if "monthly_budget" in data:
            try:
                from decimal import Decimal
                val = Decimal(str(data["monthly_budget"]))
                if val < 0:
                    return JsonResponse({"error": "El presupuesto mensual no puede ser menor a 0"}, status=400)
                user.monthly_budget = val
            except Exception:
                return JsonResponse({"error": "Presupuesto mensual inválido"}, status=400)
                
        if "alert_at_80_percent" in data:
            user.alert_at_80_percent = bool(data["alert_at_80_percent"])
            
        if "alert_at_100_percent" in data:
            user.alert_at_100_percent = bool(data["alert_at_100_percent"])
            
        if "timezone" in data:
            user.timezone = str(data["timezone"])
            
        survey_updated = False

        if "personal_activity" in data:
            activity = data["personal_activity"]
            valid_choices = ["student", "employee", "freelancer", "unemployed", "retired"]
            if activity not in valid_choices and activity is not None and activity != "":
                return JsonResponse({"error": "Actividad personal inválida"}, status=400)
            user.personal_activity = activity if activity != "" else None
            survey_updated = True

        if "tastes" in data:
            user.tastes = str(data["tastes"])
            survey_updated = True

        if "monthly_income" in data:
            try:
                from decimal import Decimal
                income = Decimal(str(data["monthly_income"]))
                if income < 0:
                    return JsonResponse({"error": "Los ingresos mensuales no pueden ser menores a 0"}, status=400)
                user.monthly_income = income
                survey_updated = True
            except Exception:
                return JsonResponse({"error": "Ingresos mensuales inválidos"}, status=400)

        if "is_survey_completed" in data:
            user.is_survey_completed = bool(data["is_survey_completed"])
        elif survey_updated:
            user.is_survey_completed = True

        user.save()
        
        return JsonResponse({
            "status": "success",
            "user": {
                "id": str(user.id),
                "email": user.email,
                "name": user.get_full_name() or user.username,
                "monthly_budget": float(user.monthly_budget),
                "alert_at_80_percent": user.alert_at_80_percent,
                "alert_at_100_percent": user.alert_at_100_percent,
                "timezone": user.timezone,
                "personal_activity": user.personal_activity,
                "tastes": user.tastes,
                "monthly_income": float(user.monthly_income),
                "is_survey_completed": user.is_survey_completed,
            }
        })
    except Exception as e:
        logger.error(f"Error en profile_update_api: {e}")
        return JsonResponse({"error": str(e)}, status=500)
