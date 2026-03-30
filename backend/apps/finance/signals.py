"""
Signals – finance
Disparadores post_save en Transaction para monitorear presupuestos.
La lógica de alerta reside en services/budget_service.py (no aquí).
"""
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Transaction


@receiver(post_save, sender=Transaction)
def check_budget_on_transaction_save(sender, instance: Transaction, created: bool, **kwargs):
    """
    Después de guardar una transacción de tipo EXPENSE,
    verifica si se han alcanzado los umbrales de presupuesto (80% / 100%).
    """
    if instance.transaction_type != Transaction.EXPENSE:
        return  # Solo monitorear egresos

    # Importación diferida para evitar circular imports
    from services import budget_service
    budget_service.check_budget_thresholds(
        user=instance.user,
        category=instance.category,
        transaction_date=instance.date,
    )
