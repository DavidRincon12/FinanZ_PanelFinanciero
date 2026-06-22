# -*- coding: utf-8 -*-
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
    search = request.query_params.get('search') or None
    category_id = request.query_params.get('category_id') or None
    transaction_type = request.query_params.get('transaction_type') or None
    start_date = request.query_params.get('start_date') or None
    end_date = request.query_params.get('end_date') or None
    
    if category_id:
        try:
            category_id = int(category_id)
        except ValueError:
            category_id = None

    from datetime import datetime
    if start_date:
        try:
            datetime.strptime(start_date, '%Y-%m-%d')
        except ValueError:
            start_date = None

    if end_date:
        try:
            datetime.strptime(end_date, '%Y-%m-%d')
        except ValueError:
            end_date = None

    transactions = finance_selectors.get_user_transactions(
        user=request.user,
        search=search,
        category_id=category_id,
        transaction_type=transaction_type,
        start_date=start_date,
        end_date=end_date
    )
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


@api_view(['POST', 'PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def transaction_update_api(request, pk: int):
    """Actualiza una transacción mediante API JSON."""
    transaction = get_object_or_404(Transaction, pk=pk, user=request.user)
    serializer = TransactionSerializer(transaction, data=request.data, partial=True)
    if serializer.is_valid():
        validated_data = serializer.validated_data
        service_data = {}
        if "amount" in validated_data:
            service_data["amount"] = validated_data["amount"]
        if "transaction_type" in validated_data:
            service_data["transaction_type"] = validated_data["transaction_type"]
        if "category" in validated_data:
            service_data["category_id"] = validated_data["category"].pk if validated_data["category"] else None
        elif "category" in request.data:
            service_data["category_id"] = None
        if "description" in validated_data:
            service_data["description"] = validated_data["description"]
        if "date" in validated_data:
            service_data["date"] = validated_data["date"]

        try:
            updated_tx = finance_service.transaction_update(instance=transaction, data=service_data)
            out_serializer = TransactionSerializer(updated_tx)
            return Response(out_serializer.data)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST', 'DELETE'])
@permission_classes([IsAuthenticated])
def transaction_delete_api(request, pk: int):
    """Elimina una transacción mediante API JSON."""
    transaction = get_object_or_404(Transaction, pk=pk, user=request.user)
    transaction.delete()
    return Response({"status": "ok", "message": "Transacción eliminada correctamente."})

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


@api_view(['POST', 'PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def category_update_api(request, pk: int):
    """Actualiza una categoría mediante API JSON."""
    category = get_object_or_404(Category, pk=pk, owner=request.user)
    try:
        updated_category = finance_service.category_update(instance=category, data=request.data)
        serializer = CategorySerializer(updated_category)
        return Response(serializer.data)
    except ValueError as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST', 'DELETE'])
@permission_classes([IsAuthenticated])
def category_delete_api(request, pk: int):
    """Desactiva (elimina) una categoría mediante API JSON."""
    category = get_object_or_404(Category, pk=pk, owner=request.user)
    finance_service.category_delete(instance=category)
    return Response({"status": "ok", "message": "Categoría eliminada correctamente."})

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
    """Devuelve el balance total real del usuario e ingresos/egresos del mes corriente."""
    from django.db.models import Sum, Q
    from apps.finance.models import Transaction
    from decimal import Decimal
    from datetime import date

    user = request.user
    today = date.today()

    # Balance total acumulado (todos los tiempos)
    agg_all = Transaction.objects.filter(user=user).aggregate(
        total_income=Sum("amount", filter=Q(transaction_type=Transaction.INCOME)),
        total_expense=Sum("amount", filter=Q(transaction_type=Transaction.EXPENSE)),
    )
    balance = (agg_all["total_income"] or Decimal("0")) - (agg_all["total_expense"] or Decimal("0"))

    # Ingresos y egresos del mes actual
    agg_month = Transaction.objects.filter(
        user=user,
        date__year=today.year,
        date__month=today.month
    ).aggregate(
        month_income=Sum("amount", filter=Q(transaction_type=Transaction.INCOME)),
        month_expense=Sum("amount", filter=Q(transaction_type=Transaction.EXPENSE)),
    )
    month_income = agg_month["month_income"] or Decimal("0")
    month_expense = agg_month["month_expense"] or Decimal("0")

    return Response({
        "balance": float(balance),
        "month_income": float(month_income),
        "month_expense": float(month_expense),
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def transaction_bulk_create_api(request):
    """Crea múltiples transacciones de forma masiva y atómica."""
    try:
        transactions = finance_service.transactions_bulk_create(user=request.user, data_list=request.data)
        serializer = TransactionSerializer(transactions, many=True)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

