"""
Views – budget
Gestión de presupuestos y notificaciones in-app.
"""
from datetime import date

from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .serializers import BudgetSerializer, NotificationSerializer

from .models import Budget, Notification
from services import budget_service
from services.finance_selectors import get_user_categories


@login_required
def budget_list(request):
    """Lista los presupuestos del mes actual por defecto."""
    today = date.today()
    budgets = (
        Budget.objects.filter(user=request.user)
        .select_related("category")
        .order_by("-year", "-month")
    )
    return render(request, "budget/budget_list.html", {
        "budgets": budgets,
        "current_month": today.month,
        "current_year": today.year,
    })


@login_required
def budget_create(request):
    """Crea un nuevo presupuesto mensual por categoría."""
    categories = get_user_categories(user=request.user)
    today = date.today()

    if request.method == "POST":
        try:
            budget_service.budget_create(user=request.user, data=request.POST)
            messages.success(request, "Presupuesto creado correctamente.")
            return redirect("budget:budget_list")
        except ValueError as e:
            messages.error(request, str(e))

    return render(request, "budget/budget_form.html", {
        "categories": categories,
        "current_month": today.month,
        "current_year": today.year,
        "months": range(1, 13),
        "years": range(today.year, today.year + 3),
    })


@login_required
def budget_update(request, pk: int):
    """Edita el límite de un presupuesto existente."""
    budget = get_object_or_404(Budget, pk=pk, user=request.user)

    if request.method == "POST":
        try:
            budget_service.budget_update(budget=budget, data=request.POST)
            messages.success(request, "Presupuesto actualizado.")
            return redirect("budget:budget_list")
        except ValueError as e:
            messages.error(request, str(e))

    return render(request, "budget/budget_form.html", {"budget": budget})


@login_required
def budget_delete(request, pk: int):
    """Elimina un presupuesto definitivamente junto con sus notificaciones asociadas."""
    budget = get_object_or_404(Budget, pk=pk, user=request.user)
    if request.method == "POST":
        category_name = budget.category.name
        # Eliminar también las notificaciones relacionadas con ese presupuesto
        Notification.objects.filter(
            user=request.user,
            title__icontains=category_name,
        ).delete()
        budget.delete()
        messages.success(request, f"Presupuesto de '{category_name}' eliminado.")
        return redirect("budget:budget_list")
    return render(request, "budget/budget_confirm_delete.html", {"budget": budget})


@login_required
def notification_list(request):
    """Lista todas las notificaciones del usuario, marcando las nuevas."""
    notifications = Notification.objects.filter(user=request.user)
    unread_count = notifications.filter(is_read=False).count()
    return render(request, "budget/notification_list.html", {
        "notifications": notifications,
        "unread_count": unread_count,
    })


@login_required
def notification_delete(request, pk: int):
    """Elimina una notificación definitivamente."""
    notification = get_object_or_404(Notification, pk=pk, user=request.user)
    if request.method == "POST":
        notification.delete()
        messages.success(request, "Notificación eliminada.")
    return redirect("budget:notification_list")


@login_required
def notification_clear_all(request):
    """Elimina TODAS las notificaciones del usuario."""
    if request.method == "POST":
        count = Notification.objects.filter(user=request.user).delete()[0]
        messages.success(request, f"{count} notificación(es) eliminadas.")
    return redirect("budget:notification_list")


@login_required
def mark_notification_read(request, pk: int):
    notification = get_object_or_404(Notification, pk=pk, user=request.user)
# -------------------------------------------------------------------
# Endpoints API (DRF)
# -------------------------------------------------------------------

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def budget_list_api(request):
    """Listado de presupuestos en formato JSON."""
    budgets = Budget.objects.filter(user=request.user).select_related("category")
    serializer = BudgetSerializer(budgets, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def notification_list_api(request):
    """Listado de notificaciones en formato JSON."""
    notifications = Notification.objects.filter(user=request.user)
    serializer = NotificationSerializer(notifications, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_notification_read_api(request, pk: int):
    """Marca una notificación como leída mediante API."""
    notification = get_object_or_404(Notification, pk=pk, user=request.user)
    notification.is_read = True
    notification.save(update_fields=["is_read"])
    return Response({"status": "ok"})
