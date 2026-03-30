"""
Service – finance_service
Operaciones de escritura sobre el modelo Transaction.
Contiene toda la lógica de validación financiera.
Las vistas llaman a estas funciones; nunca manipulan modelos directamente.
"""
from __future__ import annotations

import logging
from decimal import Decimal
from typing import TYPE_CHECKING

from django.db import transaction as db_transaction
from django.utils import timezone

from apps.finance.models import Transaction, Category

if TYPE_CHECKING:
    from apps.users.models import CustomUser

logger = logging.getLogger(__name__)


def transaction_create(user: "CustomUser", data: dict) -> Transaction:
    """
    Crea una nueva transacción financiera para el usuario.

    Args:
        user: El usuario propietario de la transacción.
        data: Diccionario con campos (amount, transaction_type, category_id, description, date).

    Returns:
        La instancia de Transaction creada.

    Raises:
        ValueError: Si el monto es inválido o los datos de tipo son incorrectos.
    """
    amount = _parse_amount(data.get("amount"))
    transaction_type = _validate_transaction_type(data.get("transaction_type"))
    category_id = data.get("category_id")
    description = data.get("description", "").strip()
    date = data.get("date") or timezone.now().date()

    category = None
    if category_id:
        try:
            category = Category.objects.get(pk=category_id)
        except Category.DoesNotExist:
            raise ValueError(f"La categoría con ID {category_id} no existe.")

    with db_transaction.atomic():
        instance = Transaction.objects.create(
            user=user,
            amount=amount,
            transaction_type=transaction_type,
            category=category,
            description=description,
            date=date,
        )

    logger.info("Transaction created: id=%s user=%s amount=%s type=%s",
                instance.pk, user.pk, amount, transaction_type)
    return instance


def transaction_update(instance: Transaction, data: dict) -> Transaction:
    """
    Actualiza una transacción existente con los datos proporcionados.

    Args:
        instance: La instancia de Transaction a actualizar.
        data: Diccionario con los campos a actualizar.

    Returns:
        La instancia de Transaction actualizada.
    """
    if "amount" in data:
        instance.amount = _parse_amount(data["amount"])
    if "transaction_type" in data:
        instance.transaction_type = _validate_transaction_type(data["transaction_type"])
    if "description" in data:
        instance.description = data["description"].strip()
    if "date" in data:
        instance.date = data["date"]
    if "category_id" in data:
        try:
            instance.category = Category.objects.get(pk=data["category_id"])
        except Category.DoesNotExist:
            raise ValueError(f"La categoría con ID {data['category_id']} no existe.")

    instance.save()
    logger.info("Transaction updated: id=%s", instance.pk)
    return instance


# ---------------------------------------------------------------------------
# Helpers privados
# ---------------------------------------------------------------------------

def _parse_amount(raw_amount) -> Decimal:
    """Convierte y valida el monto. Lanza ValueError si es inválido."""
    try:
        amount = Decimal(str(raw_amount))
    except Exception:
        raise ValueError(f"El monto '{raw_amount}' no es un número válido.")
    if amount <= 0:
        raise ValueError("El monto debe ser mayor que cero.")
    return amount


def _validate_transaction_type(transaction_type: str) -> str:
    """Valida que el tipo de transacción sea income o expense."""
    valid_types = {Transaction.INCOME, Transaction.EXPENSE}
    if transaction_type not in valid_types:
        raise ValueError(
            f"Tipo de transacción inválido: '{transaction_type}'. "
            f"Los valores permitidos son: {valid_types}"
        )
    return transaction_type
