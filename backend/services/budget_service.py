"""
Service – budget_service
Lógica de verificación de umbrales de presupuesto y generación de alertas.
Disparado por la señal post_save de Transaction.
"""
from __future__ import annotations

import logging
from decimal import Decimal
from typing import TYPE_CHECKING

from django.core.mail import send_mail
from django.conf import settings

if TYPE_CHECKING:
    from apps.users.models import CustomUser
    from apps.finance.models import Category

logger = logging.getLogger(__name__)


def check_budget_thresholds(user: "CustomUser", category: "Category", transaction_date) -> None:
    """
    Verifica si el gasto mensual en una categoría ha alcanzado
    los umbrales del 80% o 100% del presupuesto definido.
    Crea notificaciones in-app y envía correo si corresponde.
    """
    from apps.budget.models import Budget, Notification
    from services.finance_selectors import get_category_spending_this_month

    if category is None:
        return

    try:
        budget = Budget.objects.get(
            user=user,
            category=category,
            month=transaction_date.month,
            year=transaction_date.year,
        )
    except Budget.DoesNotExist:
        return  # No hay presupuesto definido para esta categoría/mes

    current_spending = get_category_spending_this_month(
        user=user,
        category=category,
        year=transaction_date.year,
        month=transaction_date.month,
    )

    percentage = (current_spending / budget.limit_amount * 100) if budget.limit_amount > 0 else 0

    # --- Alerta al 80% ---
    if percentage >= 80 and not budget.alerted_80 and user.alert_at_80_percent:
        _create_notification(
            user=user,
            level=Notification.WARNING,
            title=f"⚠️ Advertencia: {category.name}",
            message=(
                f"Has utilizado el {percentage:.1f}% de tu presupuesto de "
                f"{category.name} este mes (${current_spending:,.2f} de ${budget.limit_amount:,.2f})."
            ),
        )
        _send_alert_email(user=user, category=category, percentage=percentage, is_critical=False)
        Budget.objects.filter(pk=budget.pk).update(alerted_80=True)
        logger.warning("Budget 80%% alert: user=%s category=%s", user.pk, category)

    # --- Alerta al 100% ---
    if percentage >= 100 and not budget.alerted_100 and user.alert_at_100_percent:
        _create_notification(
            user=user,
            level=Notification.CRITICAL,
            title=f"🚨 Límite alcanzado: {category.name}",
            message=(
                f"Has superado el presupuesto de {category.name} este mes. "
                f"Gasto: ${current_spending:,.2f} / Límite: ${budget.limit_amount:,.2f}."
            ),
        )
        _send_alert_email(user=user, category=category, percentage=percentage, is_critical=True)
        Budget.objects.filter(pk=budget.pk).update(alerted_100=True)
        logger.error("Budget 100%% alert: user=%s category=%s", user.pk, category)


def _create_notification(user, level: str, title: str, message: str) -> None:
    """Crea una notificación in-app."""
    from apps.budget.models import Notification
    Notification.objects.create(user=user, level=level, title=title, message=message)


def _send_alert_email(user, category, percentage: Decimal, is_critical: bool) -> None:
    """Envía un correo de alerta al usuario via Brevo SMTP."""
    if not user.email:
        return
    subject = (
        f"🚨 FinanZ: Límite de presupuesto superado – {category.name}"
        if is_critical
        else f"⚠️ FinanZ: Advertencia de presupuesto – {category.name}"
    )
    try:
        send_mail(
            subject=subject,
            message=f"Has utilizado el {percentage:.1f}% de tu presupuesto en '{category.name}'.",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=True,
        )
    except Exception as exc:
        logger.exception("Failed to send budget alert email: %s", exc)
