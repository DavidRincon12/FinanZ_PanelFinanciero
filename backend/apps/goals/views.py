"""
Views – goals
Gestión de metas de ahorro.
"""
from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages

from .models import SavingsGoal
from services import goals_service


@login_required
def goal_list(request):
    """Lista todas las metas del usuario separadas por estado."""
    goals = SavingsGoal.objects.filter(user=request.user)
    active = goals.filter(status=SavingsGoal.ACTIVE)
    completed = goals.filter(status=SavingsGoal.COMPLETED)
    paused = goals.filter(status=SavingsGoal.PAUSED)
    return render(request, "goals/goal_list.html", {
        "active_goals": active,
        "completed_goals": completed,
        "paused_goals": paused,
    })


@login_required
def goal_create(request):
    """Crea una nueva meta de ahorro."""
    if request.method == "POST":
        try:
            goal = goals_service.goal_create(user=request.user, data=request.POST)
            messages.success(request, f"Meta '{goal.name}' creada correctamente.")
            return redirect("goals:goal_detail", pk=goal.pk)
        except ValueError as e:
            messages.error(request, str(e))
    return render(request, "goals/goal_form.html")


@login_required
def goal_detail(request, pk: int):
    """Detalle y progreso de una meta de ahorro."""
    goal = get_object_or_404(SavingsGoal, pk=pk, user=request.user)
    return render(request, "goals/goal_detail.html", {"goal": goal})


@login_required
def goal_update(request, pk: int):
    """Edita una meta existente."""
    goal = get_object_or_404(SavingsGoal, pk=pk, user=request.user)
    if request.method == "POST":
        try:
            goals_service.goal_update(goal=goal, data=request.POST)
            messages.success(request, "Meta actualizada.")
            return redirect("goals:goal_detail", pk=pk)
        except ValueError as e:
            messages.error(request, str(e))
    return render(request, "goals/goal_form.html", {"goal": goal})


@login_required
def goal_deposit(request, pk: int):
    """Registra un aporte a una meta de ahorro."""
    goal = get_object_or_404(SavingsGoal, pk=pk, user=request.user)
    if request.method == "POST":
        try:
            goals_service.goal_deposit(goal=goal, amount_raw=request.POST.get("amount"))
            if goal.status == SavingsGoal.COMPLETED:
                messages.success(request, f"¡Felicitaciones! Alcanzaste la meta '{goal.name}'.")
            else:
                messages.success(request, f"Aporte registrado. Progreso: {goal.progress_percent:.1f}%")
            return redirect("goals:goal_detail", pk=pk)
        except ValueError as e:
            messages.error(request, str(e))
    return render(request, "goals/goal_deposit.html", {"goal": goal})
