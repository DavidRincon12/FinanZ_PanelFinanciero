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

from django.db import models, transaction as db_transaction
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

    # Convertir la fecha del formulario (str "YYYY-MM-DD") a objeto date real
    raw_date = data.get("date")
    if raw_date:
        from django.utils.dateparse import parse_date
        date = parse_date(str(raw_date)) or timezone.now().date()
    else:
        date = timezone.now().date()

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


def category_create(user: "CustomUser", data: dict) -> Category:
    """
    Crea una categoría personalizada para el usuario.

    Args:
        user: El propietario de la nueva categoría.
        data: Diccionario con campos (name, icon).

    Returns:
        La instancia de Category creada.

    Raises:
        ValueError: Si el nombre está vacío o ya existe una categoría con ese
                    nombre para este usuario.
    """
    name = data.get("name", "").strip()
    icon = data.get("icon", "📦").strip() or "📦"

    if not name:
        raise ValueError("El nombre de la categoría no puede estar vacío.")

    # Verificar que no exista ya (sistema o personalizada) con ese nombre para el usuario
    already_exists = Category.objects.filter(
        name__iexact=name,
    ).filter(
        models.Q(category_type=Category.SYSTEM) | models.Q(owner=user)
    ).exists()

    if already_exists:
        raise ValueError(f"Ya existe una categoría llamada '{name}'.")

    category = Category.objects.create(
        name=name,
        icon=icon,
        category_type=Category.CUSTOM,
        owner=user,
    )
    logger.info("Category created: id=%s user=%s name=%s", category.pk, user.pk, name)
    return category


def category_update(instance: Category, data: dict) -> Category:
    """
    Actualiza una categoría existente (nombre, ícono).
    """
    if "name" in data:
        name = data["name"].strip()
        if not name:
            raise ValueError("El nombre de la categoría no puede estar vacío.")
        
        # Verificar que no exista otra categoría con el mismo nombre para este usuario
        already_exists = Category.objects.filter(
            owner=instance.owner,
            name__iexact=name,
            is_active=True,
        ).exclude(pk=instance.pk).exists()
        
        if already_exists:
            raise ValueError(f"Ya tienes una categoría llamada '{name}'.")
        
        instance.name = name
        
    if "icon" in data:
        instance.icon = data["icon"].strip() or "📦"
        
    instance.save()
    logger.info("Category updated: id=%s name=%s", instance.pk, instance.name)
    return instance


def category_delete(instance: Category) -> None:
    """
    Desactiva una categoría existente (marcando is_active=False).
    """
    instance.is_active = False
    instance.save()
    logger.info("Category deleted (deactivated): id=%s", instance.pk)


def transactions_bulk_create(user: "CustomUser", data_list: list[dict]) -> list[Transaction]:
    """
    Crea múltiples transacciones en un solo bloque atómico.
    Valida montos, tipos, categorías y formatos de fecha.
    """
    from django.utils.dateparse import parse_date

    # Extraer todos los IDs únicos de categoría
    category_ids = set()
    for item in data_list:
        cat_id = item.get("category_id")
        if cat_id:
            try:
                category_ids.add(int(cat_id))
            except (ValueError, TypeError):
                pass

    # Consultar las categorías en una sola consulta
    categories = {}
    if category_ids:
        db_categories = Category.objects.filter(
            pk__in=category_ids
        ).filter(
            models.Q(owner=user) | models.Q(owner__isnull=True)
        )
        categories = {cat.pk: cat for cat in db_categories}

    transactions_to_create = []
    with db_transaction.atomic():
        for item in data_list:
            amount = _parse_amount(item.get("amount"))
            transaction_type = _validate_transaction_type(item.get("transaction_type"))

            category_id = item.get("category_id")
            category = None
            if category_id:
                try:
                    lookup_id = int(category_id)
                except (ValueError, TypeError):
                    lookup_id = None

                category = categories.get(lookup_id) if lookup_id is not None else None
                if not category:
                    raise ValueError(f"La categoría con ID {category_id} no existe.")

            raw_date = item.get("date")
            if raw_date:
                date = parse_date(str(raw_date))
                if not date:
                    raise ValueError(f"Formato de fecha inválido: '{raw_date}'")
            else:
                date = timezone.now().date()

            tx = Transaction(
                user=user,
                amount=amount,
                transaction_type=transaction_type,
                category=category,
                description=item.get("description", "").strip(),
                date=date,
            )
            tx.full_clean()
            transactions_to_create.append(tx)

        created_transactions = Transaction.objects.bulk_create(transactions_to_create)
        logger.info("Bulk created %d transactions for user %s", len(created_transactions), user.pk)
        return created_transactions

