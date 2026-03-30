"""
Models – users
CustomUser extiende AbstractUser para incluir campos de perfil financiero.
Definir desde el inicio es CRÍTICO para evitar migraciones complejas.
"""
from django.contrib.auth.models import AbstractUser
from django.db import models


class CustomUser(AbstractUser):
    """
    Usuario personalizado de FinanZ.
    Extiende AbstractUser con campos financieros básicos.
    """
    # Presupuesto mensual global del usuario
    monthly_budget = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        verbose_name="Presupuesto mensual",
    )
    # Configuración de alertas
    alert_at_80_percent = models.BooleanField(
        default=True,
        verbose_name="Alerta al 80% del presupuesto",
    )
    alert_at_100_percent = models.BooleanField(
        default=True,
        verbose_name="Alerta al 100% del presupuesto",
    )
    # Zona horaria del usuario (por defecto Colombia)
    timezone = models.CharField(
        max_length=50,
        default="America/Bogota",
        verbose_name="Zona horaria",
    )

    class Meta:
        verbose_name = "Usuario"
        verbose_name_plural = "Usuarios"

    def __str__(self) -> str:
        return self.get_full_name() or self.username
