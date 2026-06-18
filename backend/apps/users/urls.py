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
    
    # Endpoints AJAX / API
    path("api/firebase-login/", views.firebase_login, name="firebase_login"),
    path("api/login/", views.login_api, name="login_api"),
    path("api/register/", views.register_api, name="register_api"),
    path("api/logout/", views.logout_api, name="logout_api"),
    path("api/me/", views.me_api, name="me_api"),
    path("api/profile/update/", views.profile_update_api, name="profile_update_api"),
]
