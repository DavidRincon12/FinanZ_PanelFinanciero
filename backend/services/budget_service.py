"""
Service – budget_service (write operations)
Añadido: lógica de creación y actualización de presupuestos.
El servicio de verificación de umbrales ya existía y se conserva.
"""
from __future__ import annotations

import logging
from decimal import Decimal, InvalidOperation
from typing import TYPE_CHECKING

from django.core.mail import send_mail
from django.conf import settings

if TYPE_CHECKING:
    from apps.users.models import CustomUser
    from apps.finance.models import Category

logger = logging.getLogger(__name__)


def budget_create(user: "CustomUser", data: dict):
    """
    Crea un presupuesto mensual para una categoría del usuario.

    Args:
        user: Propietario del presupuesto.
        data: Diccionario con (category_id, limit_amount, month, year).

    Raises:
        ValueError: Si los datos son inválidos o ya existe un presupuesto para
                    ese usuario / categoría / mes / año.
    """
    from apps.budget.models import Budget
    from apps.finance.models import Category

    category_id = data.get("category_id")
    if not category_id:
        raise ValueError("Debes seleccionar una categoría.")

    try:
        category = Category.objects.get(pk=category_id)
    except Category.DoesNotExist:
        raise ValueError("La categoría seleccionada no existe.")

    limit_amount = _parse_positive_amount(data.get("limit_amount"))
    month = _parse_month(data.get("month"))
    year = _parse_year(data.get("year"))

    if Budget.objects.filter(user=user, category=category, month=month, year=year).exists():
        raise ValueError(
            f"Ya tienes un presupuesto para '{category.name}' en {month}/{year}."
        )

    budget = Budget.objects.create(
        user=user,
        category=category,
        limit_amount=limit_amount,
        month=month,
        year=year,
    )
    logger.info("Budget created: id=%s user=%s category=%s %s/%s",
                budget.pk, user.pk, category.name, month, year)
    return budget


def budget_update(budget, data: dict):
    """Actualiza el límite mensual de un presupuesto."""
    if "limit_amount" in data:
        budget.limit_amount = _parse_positive_amount(data["limit_amount"])
        # Resetear flags de alerta si el usuario sube el límite
        budget.alerted_80 = False
        budget.alerted_100 = False
    budget.save()
    return budget


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
        return

    current_spending = get_category_spending_this_month(
        user=user,
        category=category,
        year=transaction_date.year,
        month=transaction_date.month,
    )

    percentage = (current_spending / budget.limit_amount * 100) if budget.limit_amount > 0 else 0

    if percentage >= 80 and not budget.alerted_80 and user.alert_at_80_percent:
        _create_notification(
            user=user,
            level=Notification.WARNING,
            title=f"Advertencia: {category.name}",
            message=(
                f"Has utilizado el {percentage:.1f}% de tu presupuesto de "
                f"{category.name} este mes (${current_spending:,.2f} de ${budget.limit_amount:,.2f})."
            ),
        )
        _send_alert_email(user=user, category=category, percentage=percentage, is_critical=False)
        Budget.objects.filter(pk=budget.pk).update(alerted_80=True)

    if percentage >= 100 and not budget.alerted_100 and user.alert_at_100_percent:
        _create_notification(
            user=user,
            level=Notification.CRITICAL,
            title=f"Limite alcanzado: {category.name}",
            message=(
                f"Has superado el presupuesto de {category.name} este mes. "
                f"Gasto: ${current_spending:,.2f} / Limite: ${budget.limit_amount:,.2f}."
            ),
        )
        _send_alert_email(user=user, category=category, percentage=percentage, is_critical=True)
        Budget.objects.filter(pk=budget.pk).update(alerted_100=True)


# ---------------------------------------------------------------------------
# Helpers privados
# ---------------------------------------------------------------------------

def _create_notification(user, level: str, title: str, message: str) -> None:
    from apps.budget.models import Notification
    Notification.objects.create(user=user, level=level, title=title, message=message)


def _send_alert_email(user, category, percentage: Decimal, is_critical: bool) -> None:
    if not user.email:
        return
    subject = (
        f"FinanZ: Limite de presupuesto superado - {category.name}"
        if is_critical
        else f"FinanZ: Advertencia de presupuesto - {category.name}"
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


def _parse_positive_amount(raw) -> Decimal:
    try:
        amount = Decimal(str(raw))
    except (InvalidOperation, TypeError):
        raise ValueError(f"'{raw}' no es un monto válido.")
    if amount <= 0:
        raise ValueError("El monto debe ser mayor que cero.")
    return amount


def _parse_month(raw) -> int:
    try:
        month = int(raw)
    except (TypeError, ValueError):
        raise ValueError("El mes debe ser un número.")
    if not 1 <= month <= 12:
        raise ValueError("El mes debe estar entre 1 y 12.")
    return month


def _parse_year(raw) -> int:
    try:
        year = int(raw)
    except (TypeError, ValueError):
        raise ValueError("El año debe ser un número.")
    if year < 2000 or year > 2100:
        raise ValueError("El año no es válido.")
    return year
