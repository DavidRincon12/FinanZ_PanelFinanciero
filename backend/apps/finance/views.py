"""
Views – finance
Vistas de transacciones usando la capa de servicios.
Las vistas son delgadas: solo manejan HTTP y delegan al servicio.
"""
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .serializers import TransactionSerializer, CategorySerializer

from .models import Transaction, Category
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
    categories = finance_selectors.get_user_categories(user=request.user)
    if request.method == "POST":
        try:
            finance_service.transaction_create(user=request.user, data=request.POST)
            messages.success(request, "Transacción registrada correctamente.")
            return redirect("finance:transaction_list")
        except ValueError as e:
            messages.error(request, str(e))
    return render(request, "finance/transaction_form.html", {
        "categories": categories,
        "transaction_types": Transaction.TYPE_CHOICES,
    })


@login_required
def transaction_update(request, pk: int):
    """Edición de una transacción existente."""
    transaction = get_object_or_404(Transaction, pk=pk, user=request.user)
    categories = finance_selectors.get_user_categories(user=request.user)
    if request.method == "POST":
        try:
            finance_service.transaction_update(instance=transaction, data=request.POST)
            messages.success(request, "Transacción actualizada.")
            return redirect("finance:transaction_list")
        except ValueError as e:
            messages.error(request, str(e))
    return render(request, "finance/transaction_form.html", {
        "transaction": transaction,
        "categories": categories,
        "transaction_types": Transaction.TYPE_CHOICES,
    })


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


@login_required
def category_create(request):
    """Crea una categoría personalizada para el usuario autenticado."""
    if request.method == "POST":
        try:
            finance_service.category_create(user=request.user, data=request.POST)
            messages.success(request, "Categoría creada correctamente.")
            return redirect("finance:category_list")
        except ValueError as e:
            messages.error(request, str(e))
    return render(request, "finance/category_form.html")


# -------------------------------------------------------------------
# Endpoints API (DRF)
# -------------------------------------------------------------------

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def transaction_list_api(request):
    """Listado de transacciones en formato JSON."""
    transactions = finance_selectors.get_user_transactions(user=request.user)
    serializer = TransactionSerializer(transactions, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def transaction_create_api(request):
    """Crea una transacción mediante API JSON."""
    serializer = TransactionSerializer(data=request.data)
    if serializer.is_valid():
        validated_data = serializer.validated_data
        service_data = {
            "amount": validated_data["amount"],
            "transaction_type": validated_data["transaction_type"],
            "category_id": validated_data["category"].pk if validated_data.get("category") else None,
            "description": validated_data.get("description", ""),
            "date": validated_data.get("date"),
        }
        try:
            transaction = finance_service.transaction_create(user=request.user, data=service_data)
            out_serializer = TransactionSerializer(transaction)
            return Response(out_serializer.data, status=status.HTTP_201_CREATED)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def category_list_api(request):
    """Listado de categorías en formato JSON."""
    categories = finance_selectors.get_user_categories(user=request.user)
    serializer = CategorySerializer(categories, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def category_create_api(request):
    """Crea una categoría personalizada mediante API JSON."""
    try:
        category = finance_service.category_create(user=request.user, data=request.data)
        serializer = CategorySerializer(category)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    except ValueError as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def balance_api(request):
    """Obtiene el balance histórico del usuario para gráficas."""
    from services.finance_selectors import get_monthly_balance_series
    data = get_monthly_balance_series(user=request.user)
    return Response({"data": data})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def expenses_by_category_api(request):
    """Obtiene gastos agrupados por categoría para gráficas."""
    from services.finance_selectors import get_expenses_by_category
    data = get_expenses_by_category(user=request.user)
    return Response({"data": data})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def total_balance_api(request):
    """Devuelve el balance total real del usuario (ingresos - gastos acumulados)."""
    from services.finance_selectors import calculate_balance
    balance = calculate_balance(user=request.user)
    return Response({"balance": float(balance)})
