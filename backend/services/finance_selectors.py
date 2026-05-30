"""
Selectors – finance_selectors
Funciones de solo lectura para recuperar y agregar datos financieros.
Separa la lógica de consulta de la lógica de escritura (services).
"""
from __future__ import annotations

from decimal import Decimal
from typing import TYPE_CHECKING

from django.db.models import Sum, Q
from django.db.models.functions import TruncMonth

from apps.finance.models import Transaction, Category

if TYPE_CHECKING:
    from apps.users.models import CustomUser


def get_user_transactions(user: "CustomUser"):
    """Retorna todas las transacciones del usuario, ordenadas más recientes primero."""
    return Transaction.objects.filter(user=user).select_related("category")


def calculate_balance(user: "CustomUser") -> Decimal:
    """
    Calcula el balance actual del usuario:
      balance = Σ(ingresos) - Σ(egresos)
    """
    aggregation = Transaction.objects.filter(user=user).aggregate(
        total_income=Sum("amount", filter=Q(transaction_type=Transaction.INCOME)),
        total_expense=Sum("amount", filter=Q(transaction_type=Transaction.EXPENSE)),
    )
    income = aggregation["total_income"] or Decimal("0")
    expense = aggregation["total_expense"] or Decimal("0")
    return income - expense


def ensure_user_default_categories(user: "CustomUser") -> None:
    """
    Verifica si el usuario tiene categorías. Si no tiene,
    duplica las categorías del sistema (owner=None) para este usuario.
    También migra cualquier transacción o presupuesto que estuviera asociado a la de sistema.
    """
    if Category.objects.filter(owner=user).exists():
        return

    system_cats = Category.objects.filter(owner=None, category_type=Category.SYSTEM)
    if not system_cats.exists():
        from django.core.management import call_command
        try:
            call_command("seed_categories")
            system_cats = Category.objects.filter(owner=None, category_type=Category.SYSTEM)
        except Exception:
            pass

    from apps.budget.models import Budget

    for sys_cat in system_cats:
        user_cat, created = Category.objects.get_or_create(
            name=sys_cat.name,
            owner=user,
            defaults={
                "icon": sys_cat.icon,
                "category_type": Category.CUSTOM,
                "is_active": True,
            }
        )
        Transaction.objects.filter(user=user, category=sys_cat).update(category=user_cat)
        Budget.objects.filter(user=user, category=sys_cat).update(category=user_cat)


def get_user_categories(user: "CustomUser"):
    """Retorna las categorías disponibles para el usuario (solo personalizadas/propias)."""
    ensure_user_default_categories(user)
    return Category.objects.filter(
        owner=user,
        is_active=True,
    ).order_by("name")


def get_monthly_balance_series(user: "CustomUser") -> list[dict]:
    """
    Retorna series de datos mensuales para el gráfico de líneas de Chart.js.
    Formato: [{"month": "2026-01", "balance": 1500.00}, ...]
    """
    from datetime import date
    current_year = date.today().year

    # Pre-poblar los 12 meses del año actual con balance 0 para asegurar trazabilidad en el gráfico
    series: dict[str, Decimal] = {}
    for m in range(1, 13):
        key = f"{current_year}-{m:02d}"
        series[key] = Decimal("0")

    monthly = (
        Transaction.objects.filter(user=user)
        .annotate(month=TruncMonth("date"))
        .values("month", "transaction_type")
        .annotate(total=Sum("amount"))
        .order_by("month")
    )

    for row in monthly:
        key = row["month"].strftime("%Y-%m")
        amount = row["total"] or Decimal("0")
        if row["transaction_type"] == Transaction.INCOME:
            series[key] = series.get(key, Decimal("0")) + amount
        else:
            series[key] = series.get(key, Decimal("0")) - amount

    return [{"month": k, "balance": float(v)} for k, v in sorted(series.items())]


def get_expenses_by_category(user: "CustomUser") -> list[dict]:
    """
    Retorna la distribución de egresos por categoría para el gráfico de torta.
    Formato: [{"category": "Alimentación", "total": 350000.00}, ...]
    """
    data = (
        Transaction.objects.filter(user=user, transaction_type=Transaction.EXPENSE)
        .values("category__name")
        .annotate(total=Sum("amount"))
        .order_by("-total")
    )
    return [
        {"category": row["category__name"] or "Sin categoría", "total": float(row["total"])}
        for row in data
    ]


def get_category_spending_this_month(user: "CustomUser", category, year: int, month: int) -> Decimal:
    """
    Calcula el total gastado en una categoría durante el mes/año dado.
    Usado por budget_service para verificar umbrales de alerta.
    """
    total = Transaction.objects.filter(
        user=user,
        category=category,
        transaction_type=Transaction.EXPENSE,
        date__year=year,
        date__month=month,
    ).aggregate(total=Sum("amount"))["total"]
    return total or Decimal("0")
