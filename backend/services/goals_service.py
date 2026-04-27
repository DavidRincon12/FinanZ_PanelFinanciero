"""
Service – goals_service
Lógica de escritura sobre el modelo SavingsGoal.
"""
from __future__ import annotations

import logging
from decimal import Decimal
from typing import TYPE_CHECKING

from apps.goals.models import SavingsGoal

if TYPE_CHECKING:
    from apps.users.models import CustomUser

logger = logging.getLogger(__name__)


def goal_create(user: "CustomUser", data: dict) -> SavingsGoal:
    """
    Crea una nueva meta de ahorro para el usuario.

    Args:
        user: Propietario de la meta.
        data: Diccionario con (name, target_amount, deadline, description, icon).

    Raises:
        ValueError: Si el nombre está vacío o el monto objetivo es inválido.
    """
    name = data.get("name", "").strip()
    if not name:
        raise ValueError("El nombre de la meta no puede estar vacío.")

    target_amount = _parse_positive_amount(data.get("target_amount"))
    deadline = data.get("deadline") or None
    description = data.get("description", "").strip()
    icon = data.get("icon", "🎯").strip() or "🎯"

    goal = SavingsGoal.objects.create(
        user=user,
        name=name,
        target_amount=target_amount,
        current_amount=Decimal("0"),
        deadline=deadline,
        description=description,
        icon=icon,
        status=SavingsGoal.ACTIVE,
    )
    logger.info("SavingsGoal created: id=%s user=%s name=%s", goal.pk, user.pk, name)
    return goal


def goal_deposit(goal: SavingsGoal, amount_raw) -> SavingsGoal:
    """
    Registra un aporte a una meta de ahorro.
    Marca la meta como COMPLETED si el aporte cubre el objetivo.

    Args:
        goal: La instancia de SavingsGoal a actualizar.
        amount_raw: Monto del aporte (string o número).

    Raises:
        ValueError: Si el monto es inválido o la meta ya está completada.
    """
    if goal.status == SavingsGoal.COMPLETED:
        raise ValueError("Esta meta ya fue completada.")

    amount = _parse_positive_amount(amount_raw)
    goal.current_amount += amount

    if goal.current_amount >= goal.target_amount:
        goal.current_amount = goal.target_amount
        goal.status = SavingsGoal.COMPLETED

    goal.save(update_fields=["current_amount", "status", "updated_at"])
    logger.info("SavingsGoal deposit: id=%s amount=%s progress=%.1f%%",
                goal.pk, amount, goal.progress_percent)
    return goal


def goal_update(goal: SavingsGoal, data: dict) -> SavingsGoal:
    """Actualiza los datos editables de una meta."""
    if "name" in data:
        name = data["name"].strip()
        if not name:
            raise ValueError("El nombre de la meta no puede estar vacío.")
        goal.name = name
    if "target_amount" in data:
        goal.target_amount = _parse_positive_amount(data["target_amount"])
    if "deadline" in data:
        goal.deadline = data["deadline"] or None
    if "description" in data:
        goal.description = data["description"].strip()
    if "icon" in data:
        goal.icon = data["icon"].strip() or "🎯"
    if "status" in data:
        valid_statuses = {SavingsGoal.ACTIVE, SavingsGoal.PAUSED, SavingsGoal.COMPLETED}
        if data["status"] in valid_statuses:
            goal.status = data["status"]
    goal.save()
    return goal


# ---------------------------------------------------------------------------
# Helpers privados
# ---------------------------------------------------------------------------

def _parse_positive_amount(raw) -> Decimal:
    """Valida y convierte un monto positivo."""
    try:
        amount = Decimal(str(raw))
    except Exception:
        raise ValueError(f"'{raw}' no es un monto válido.")
    if amount <= 0:
        raise ValueError("El monto debe ser mayor que cero.")
    return amount
