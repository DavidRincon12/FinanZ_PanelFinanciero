"""
URLs – users
Rutas de autenticación y gestión de perfil.
"""
from django.urls import path
from . import views

app_name = "users"

urlpatterns = [
    path("", views.dashboard, name="dashboard"),
    path("login/", views.login_view, name="login"),
    path("logout/", views.logout_view, name="logout"),
    path("register/", views.register_view, name="register"),
    path("profile/", views.profile_view, name="profile"),
]
