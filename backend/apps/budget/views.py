"""
Views – budget
Gestión de presupuestos y notificaciones in-app.
"""
from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages

from .models import Budget, Notification


@login_required
def budget_list(request):
    budgets = Budget.objects.filter(user=request.user).select_related("category")
    return render(request, "budget/budget_list.html", {"budgets": budgets})


@login_required
def budget_create(request):
    if request.method == "POST":
        # TODO (Fase 3): Implementar BudgetForm
        messages.success(request, "Presupuesto creado.")
        return redirect("budget:budget_list")
    return render(request, "budget/budget_form.html")


@login_required
def budget_update(request, pk: int):
    budget = get_object_or_404(Budget, pk=pk, user=request.user)
    if request.method == "POST":
        # TODO (Fase 3): Implementar BudgetForm
        messages.success(request, "Presupuesto actualizado.")
        return redirect("budget:budget_list")
    return render(request, "budget/budget_form.html", {"budget": budget})


@login_required
def notification_list(request):
    notifications = Notification.objects.filter(user=request.user)
    return render(request, "budget/notification_list.html", {"notifications": notifications})


@login_required
def mark_notification_read(request, pk: int):
    notification = get_object_or_404(Notification, pk=pk, user=request.user)
    notification.is_read = True
    notification.save(update_fields=["is_read"])
    return redirect("budget:notification_list")
