"""
Models – goals
Metas de ahorro con seguimiento de progreso.
Fórmula: progreso (%) = (current_amount / target_amount) * 100
"""
from django.conf import settings
from django.db import models


class SavingsGoal(models.Model):
    """
    Meta de ahorro con monto objetivo y fecha límite.
    El progreso se actualiza automáticamente al registrar aportes.
    """
    ACTIVE = "active"
    COMPLETED = "completed"
    PAUSED = "paused"
    STATUS_CHOICES = [
        (ACTIVE, "Activa"),
        (COMPLETED, "Completada"),
        (PAUSED, "Pausada"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="savings_goals",
        verbose_name="Usuario",
    )
    name = models.CharField(max_length=150, verbose_name="Nombre de la meta")
    description = models.TextField(blank=True, verbose_name="Descripción")
    target_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        verbose_name="Monto objetivo",
    )
    current_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        verbose_name="Monto acumulado",
    )
    deadline = models.DateField(
        null=True, blank=True, verbose_name="Fecha límite"
    )
    status = models.CharField(
        max_length=10, choices=STATUS_CHOICES, default=ACTIVE
    )
    icon = models.CharField(max_length=50, default="🎯", verbose_name="Ícono")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Meta de Ahorro"
        verbose_name_plural = "Metas de Ahorro"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.name} ({self.progress_percent:.1f}%)"

    @property
    def progress_percent(self) -> float:
        """Porcentaje de progreso hacia la meta."""
        if self.target_amount <= 0:
            return 0.0
        return float(self.current_amount / self.target_amount * 100)

    @property
    def remaining_amount(self):
        """Monto restante para alcanzar la meta."""
        return max(self.target_amount - self.current_amount, 0)
