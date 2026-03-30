"""
URLs – goals
Rutas de metas de ahorro.
"""
from django.urls import path
from . import views

app_name = "goals"

urlpatterns = [
    path("", views.goal_list, name="goal_list"),
    path("new/", views.goal_create, name="goal_create"),
    path("<int:pk>/", views.goal_detail, name="goal_detail"),
    path("<int:pk>/edit/", views.goal_update, name="goal_update"),
    path("<int:pk>/deposit/", views.goal_deposit, name="goal_deposit"),
]
