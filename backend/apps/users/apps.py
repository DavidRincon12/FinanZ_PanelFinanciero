"""
App: users
Gestión de identidad, autenticación y perfiles financieros de usuario.
"""
from django.apps import AppConfig


class UsersConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.users"
    verbose_name = "Usuarios"
