"""
Core – validators
Validadores financieros reutilizables en toda la aplicación.
"""
from decimal import Decimal
from django.core.exceptions import ValidationError


def validate_positive_amount(value: Decimal) -> None:
    """Valida que un monto sea positivo."""
    if value <= 0:
        raise ValidationError(
            "El monto debe ser mayor que cero. Valor recibido: %(value)s",
            params={"value": value},
        )


def validate_budget_limit(limit: Decimal, minimum: Decimal = Decimal("1000")) -> None:
    """Valida que el límite de presupuesto sea razonable (> $1.000 COP)."""
    if limit < minimum:
        raise ValidationError(
            f"El límite de presupuesto mínimo es ${minimum:,.0f}. Valor recibido: ${limit:,.0f}"
        )


def validate_savings_goal_amount(target: Decimal, current: Decimal) -> None:
    """Valida que el monto actual no supere el objetivo de la meta."""
    if current > target:
        raise ValidationError(
            f"El monto aportado (${current:,.2f}) no puede superar la meta (${target:,.2f})."
        )
