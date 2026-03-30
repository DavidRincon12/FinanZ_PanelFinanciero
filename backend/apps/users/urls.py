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
    path("profile/", views.profile_view, name="profile"),
    
    # Endpoint AJAX
    path("api/firebase-login/", views.firebase_login, name="firebase_login"),
]
