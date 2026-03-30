"""
URLs – finance
Rutas de transacciones y categorías.
"""
from django.urls import path
from . import views

app_name = "finance"

urlpatterns = [
    path("transactions/", views.transaction_list, name="transaction_list"),
    path("transactions/new/", views.transaction_create, name="transaction_create"),
    path("transactions/<int:pk>/edit/", views.transaction_update, name="transaction_update"),
    path("transactions/<int:pk>/delete/", views.transaction_delete, name="transaction_delete"),
    path("categories/", views.category_list, name="category_list"),
    # Endpoint JSON para Chart.js
    path("api/balance/", views.balance_api, name="balance_api"),
    path("api/expenses-by-category/", views.expenses_by_category_api, name="expenses_by_category_api"),
]
