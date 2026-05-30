from django.urls import path
from . import views

app_name = "finance"

urlpatterns = [
    # Legacy / Template Views
    path("transactions/", views.transaction_list, name="transaction_list"),
    path("transactions/new/", views.transaction_create, name="transaction_create"),
    path("transactions/<int:pk>/edit/", views.transaction_update, name="transaction_update"),
    path("transactions/<int:pk>/delete/", views.transaction_delete, name="transaction_delete"),
    path("categories/", views.category_list, name="category_list"),
    path("categories/new/", views.category_create, name="category_create"),
    
    # API Endpoints (DRF)
    path("api/transactions/", views.transaction_list_api, name="transaction_list_api"),
    path("api/transactions/create/", views.transaction_create_api, name="transaction_create_api"),
    path("api/transactions/<int:pk>/update/", views.transaction_update_api, name="transaction_update_api"),
    path("api/transactions/<int:pk>/delete/", views.transaction_delete_api, name="transaction_delete_api"),
    path("api/categories/", views.category_list_api, name="category_list_api"),
    path("api/categories/create/", views.category_create_api, name="category_create_api"),
    path("api/categories/<int:pk>/update/", views.category_update_api, name="category_update_api"),
    path("api/categories/<int:pk>/delete/", views.category_delete_api, name="category_delete_api"),
    path("api/balance/", views.balance_api, name="balance_api"),
    path("api/expenses-by-category/", views.expenses_by_category_api, name="expenses_by_category_api"),
    path("api/total-balance/", views.total_balance_api, name="total_balance_api"),
]
