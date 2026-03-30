"""
Views – goals
Gestión de metas de ahorro.
"""
from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages

from .models import SavingsGoal


@login_required
def goal_list(request):
    goals = SavingsGoal.objects.filter(user=request.user)
    return render(request, "goals/goal_list.html", {"goals": goals})


@login_required
def goal_create(request):
    if request.method == "POST":
        # TODO (Fase 3): Implementar SavingsGoalForm
        messages.success(request, "Meta creada correctamente.")
        return redirect("goals:goal_list")
    return render(request, "goals/goal_form.html")


@login_required
def goal_detail(request, pk: int):
    goal = get_object_or_404(SavingsGoal, pk=pk, user=request.user)
    return render(request, "goals/goal_detail.html", {"goal": goal})


@login_required
def goal_update(request, pk: int):
    goal = get_object_or_404(SavingsGoal, pk=pk, user=request.user)
    if request.method == "POST":
        messages.success(request, "Meta actualizada.")
        return redirect("goals:goal_list")
    return render(request, "goals/goal_form.html", {"goal": goal})


@login_required
def goal_deposit(request, pk: int):
    """Registra un aporte a una meta de ahorro."""
    goal = get_object_or_404(SavingsGoal, pk=pk, user=request.user)
    if request.method == "POST":
        # TODO (Fase 3): Implementar lógica de aporte con goals_service
        messages.success(request, "Aporte registrado.")
        return redirect("goals:goal_detail", pk=pk)
    return render(request, "goals/goal_deposit.html", {"goal": goal})
