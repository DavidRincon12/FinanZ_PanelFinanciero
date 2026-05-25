"""
URLs – goals
Rutas de metas de ahorro: legacy + API REST.
"""
from django.urls import path
from . import views

app_name = "goals"

urlpatterns = [
    # Legacy / Template Views
    path("", views.goal_list, name="goal_list"),
    path("new/", views.goal_create, name="goal_create"),
    path("<int:pk>/", views.goal_detail, name="goal_detail"),
    path("<int:pk>/edit/", views.goal_update, name="goal_update"),
    path("<int:pk>/deposit/", views.goal_deposit, name="goal_deposit"),

    # API REST endpoints (React frontend)
    path("api/goals/", views.goal_list_api, name="goal_list_api"),
    path("api/goals/create/", views.goal_create_api, name="goal_create_api"),
    path("api/goals/<int:pk>/update/", views.goal_update_api, name="goal_update_api"),
    path("api/goals/<int:pk>/deposit/", views.goal_deposit_api, name="goal_deposit_api"),
    path("api/goals/<int:pk>/delete/", views.goal_delete_api, name="goal_delete_api"),
]
