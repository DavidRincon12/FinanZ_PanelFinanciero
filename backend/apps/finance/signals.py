"""
Signals – finance
Disparadores post_save y post_delete en Transaction para monitorear presupuestos.
La lógica de alerta reside en services/budget_service.py (no aquí).
"""
from django.db.models.signals import post_save, post_delete
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

    from services import budget_service
    budget_service.check_budget_thresholds(
        user=instance.user,
        category=instance.category,
        transaction_date=instance.date,
    )


@receiver(post_delete, sender=Transaction)
def reset_budget_flags_on_transaction_delete(sender, instance: Transaction, **kwargs):
    """
    Después de eliminar un egreso, resetea los flags de alerta del presupuesto
    correspondiente para que el sistema pueda re-evaluar el estado real del gasto.
    Esto evita que una alerta quede "pegada" aunque el gasto real haya bajado.
    """
    if instance.transaction_type != Transaction.EXPENSE:
        return
    if instance.category is None:
        return

    try:
        from apps.budget.models import Budget
        Budget.objects.filter(
            user=instance.user,
            category=instance.category,
            month=instance.date.month,
            year=instance.date.year,
        ).update(alerted_80=False, alerted_100=False)
    except Exception:
        pass  # Si no hay presupuesto, no hay nada que resetear
