"""
Views – finance
Vistas de transacciones usando la capa de servicios.
Las vistas son delgadas: solo manejan HTTP y delegan al servicio.
"""
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages

from .models import Transaction
from services import finance_service, finance_selectors


@login_required
def transaction_list(request):
    """Listado de transacciones del usuario autenticado."""
    transactions = finance_selectors.get_user_transactions(user=request.user)
    balance = finance_selectors.calculate_balance(user=request.user)
    return render(request, "finance/transaction_list.html", {
        "transactions": transactions,
        "balance": balance,
    })


@login_required
def transaction_create(request):
    """Registro rápido de una nueva transacción (< 10 segundos desde móvil)."""
    if request.method == "POST":
        try:
            finance_service.transaction_create(user=request.user, data=request.POST)
            messages.success(request, "Transacción registrada correctamente.")
            return redirect("finance:transaction_list")
        except ValueError as e:
            messages.error(request, str(e))
    return render(request, "finance/transaction_form.html")


@login_required
def transaction_update(request, pk: int):
    """Edición de una transacción existente."""
    transaction = get_object_or_404(Transaction, pk=pk, user=request.user)
    if request.method == "POST":
        try:
            finance_service.transaction_update(instance=transaction, data=request.POST)
            messages.success(request, "Transacción actualizada.")
            return redirect("finance:transaction_list")
        except ValueError as e:
            messages.error(request, str(e))
    return render(request, "finance/transaction_form.html", {"transaction": transaction})


@login_required
def transaction_delete(request, pk: int):
    """Eliminación de una transacción."""
    transaction = get_object_or_404(Transaction, pk=pk, user=request.user)
    if request.method == "POST":
        transaction.delete()
        messages.success(request, "Transacción eliminada.")
        return redirect("finance:transaction_list")
    return render(request, "finance/transaction_confirm_delete.html", {"transaction": transaction})


@login_required
def category_list(request):
    """Listado y gestión de categorías del usuario."""
    categories = finance_selectors.get_user_categories(user=request.user)
    return render(request, "finance/category_list.html", {"categories": categories})


# -------------------------------------------------------------------
# Endpoints JSON para Chart.js (AJAX)
# -------------------------------------------------------------------

@login_required
def balance_api(request):
    """Devuelve el historial de balance mensual en formato JSON."""
    data = finance_selectors.get_monthly_balance_series(user=request.user)
    return JsonResponse({"data": data})


@login_required
def expenses_by_category_api(request):
    """Devuelve la distribución de gastos por categoría en formato JSON."""
    data = finance_selectors.get_expenses_by_category(user=request.user)
    return JsonResponse({"data": data})
