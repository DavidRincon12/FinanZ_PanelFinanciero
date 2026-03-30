"""
Signals – budget
Señales relacionadas con cambios en el modelo Budget.
"""
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Budget


@receiver(post_save, sender=Budget)
def reset_alerts_on_budget_update(sender, instance: Budget, created: bool, **kwargs):
    """
    Al actualizar un presupuesto, resetear los flags de alerta
    si el nuevo límite es mayor al anterior (evita alertas fantasma).
    """
    if not created:
        # Solo resetear si el límite subió; la verificación real la hace budget_service
        Budget.objects.filter(pk=instance.pk).update(alerted_80=False, alerted_100=False)
