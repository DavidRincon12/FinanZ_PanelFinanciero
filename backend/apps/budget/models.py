"""
Models – budget
Presupuesto mensual por categoría y registro de notificaciones in-app.
"""
from django.conf import settings
from django.db import models

from apps.finance.models import Category


class Budget(models.Model):
    """
    Límite de gasto mensual por categoría.
    El sistema monitorea el gasto acumulado y dispara alertas
    al alcanzar los umbrales del 80% y 100%.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="budgets",
        verbose_name="Usuario",
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.CASCADE,
        related_name="budgets",
        verbose_name="Categoría",
    )
    limit_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        verbose_name="Límite mensual",
    )
    month = models.PositiveSmallIntegerField(verbose_name="Mes (1-12)")
    year = models.PositiveSmallIntegerField(verbose_name="Año")

    # Flags para controlar si ya se envió la alerta (evita spam)
    alerted_80 = models.BooleanField(default=False, verbose_name="Alerta advertencia enviada")
    alerted_100 = models.BooleanField(default=False, verbose_name="Alerta crítica enviada")

    # Umbrales de alerta personalizados
    warning_threshold = models.PositiveSmallIntegerField(
        default=80,
        verbose_name="Umbral de advertencia (%)",
    )
    critical_threshold = models.PositiveSmallIntegerField(
        default=100,
        verbose_name="Umbral crítico (%)",
    )

    class Meta:
        verbose_name = "Presupuesto"
        verbose_name_plural = "Presupuestos"
        unique_together = [("user", "category", "month", "year")]

    def __str__(self) -> str:
        return f"{self.user} | {self.category} | {self.month}/{self.year}"


class Notification(models.Model):
    """
    Notificación in-app generada por el sistema de alertas.
    """
    WARNING = "warning"
    CRITICAL = "critical"
    INFO = "info"
    LEVEL_CHOICES = [
        (WARNING, "Advertencia (80%)"),
        (CRITICAL, "Crítica (100%)"),
        (INFO, "Información"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
        verbose_name="Usuario",
    )
    level = models.CharField(
        max_length=10, choices=LEVEL_CHOICES, default=INFO
    )
    title = models.CharField(max_length=150, verbose_name="Título")
    message = models.TextField(verbose_name="Mensaje")
    is_read = models.BooleanField(default=False, verbose_name="Leída")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Notificación"
        verbose_name_plural = "Notificaciones"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"[{self.level}] {self.title} → {self.user}"
