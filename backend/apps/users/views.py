"""
Views – users
Autenticación, registro y perfil de usuario.
"""
from django.shortcuts import render, redirect
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.decorators import login_required
from django.contrib import messages


def login_view(request):
    """Vista de inicio de sesión."""
    if request.user.is_authenticated:
        return redirect("users:dashboard")
    if request.method == "POST":
        username = request.POST.get("username")
        password = request.POST.get("password")
        user = authenticate(request, username=username, password=password)
        if user:
            login(request, user)
            return redirect("users:dashboard")
        messages.error(request, "Credenciales inválidas.")
    return render(request, "users/login.html")


def logout_view(request):
    """Vista de cierre de sesión."""
    logout(request)
    return redirect("users:login")


def register_view(request):
    """Vista de registro de nuevo usuario."""
    # TODO (Fase 2): Implementar formulario de registro con CustomUserCreationForm
    return render(request, "users/register.html")


@login_required
def dashboard(request):
    """Dashboard principal – punto de entrada autenticado."""
    return render(request, "users/dashboard.html", {"user": request.user})


@login_required
def profile_view(request):
    """Perfil y configuración de alertas del usuario."""
    return render(request, "users/profile.html", {"user": request.user})
