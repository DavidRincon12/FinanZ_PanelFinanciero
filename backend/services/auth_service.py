"""
Service – auth_service
Verifica tokens de Firebase provistos por el cliente y coordina
la creación asincrónica (signup automático) o búsqueda del CustomUser en Django.
"""
from __future__ import annotations

import logging
import time
from typing import TYPE_CHECKING
from django.contrib.auth import get_user_model

# Manejo de error limpio si firebase_admin no está instalado en este momento local del entorno
try:
    from firebase_admin import auth
except ImportError:
    auth = None

if TYPE_CHECKING:
    from apps.users.models import CustomUser

logger = logging.getLogger(__name__)
User = get_user_model()


def verify_firebase_token(id_token: str) -> dict:
    """
    Verifica el JWT de Firebase con los servidores de Google.
    Retorna el diccionario de claims si es válido.
    Lanza ValueError si falla la verificación o firebase-admin no está listo.
    """
    if not auth:
        raise ValueError("firebase-admin no está importado o configurado correctamente.")

    max_retries = 3
    for attempt in range(max_retries):
        try:
            decoded_token = auth.verify_id_token(id_token)
            return decoded_token
        except Exception as exc:
            exc_str = str(exc)
            # Si el reloj de la máquina local está ligeramente atrasado respecto al de Google,
            # esperamos un breve instante y reintentamos.
            if "Token used too early" in exc_str and attempt < max_retries - 1:
                logger.warning(
                    "Desincronización de reloj detectada (%s). Reintentando en 1 segundo...",
                    exc_str
                )
                time.sleep(1)
                continue
            
            logger.error("Token de Firebase inválido o expirado: %s", exc)
            raise ValueError("No se pudo verificar el token de Google.") from exc


def get_or_create_user_from_firebase(decoded_token: dict) -> "CustomUser":
    """
    Toma los claims básicos de un token verificado de Firebase (email, uid, name)
    y busca un CustomUser existente por email. Si no existe, crea uno nuevo.
    """
    email = decoded_token.get("email")
    if not email:
        raise ValueError("El token de Google no contiene una dirección de correo válida.")

    uid = decoded_token.get("uid")
    name = decoded_token.get("name", "")
    picture = decoded_token.get("picture", "")

    # Dividir el nombre extraído de Google en First/Last si es posible
    first_name = name
    last_name = ""
    if " " in name:
        parts = name.split(" ", 1)
        first_name = parts[0]
        last_name = parts[1]

    # Intentamos obtener al usuario por correo electrónico
    user, created = User.objects.get_or_create(
        email=email,
        defaults={
            "username": uid,          # Usamos el UID de Firebase como username único base
            "first_name": first_name,
            "last_name": last_name,
        }
    )

    if created:
        logger.info("Nuevo usuario creado automáticamente desde Google: %s", email)
        # Seteamos una contraseña inusable para bloquear login clásico
        user.set_unusable_password()
        user.save(update_fields=["password"])
    
    return user
