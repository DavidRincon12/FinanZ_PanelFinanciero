from django.urls import path
from . import views

app_name = "budget"

urlpatterns = [
    # Legacy / Template Views
    path("", views.budget_list, name="budget_list"),
    path("new/", views.budget_create, name="budget_create"),
    path("<int:pk>/edit/", views.budget_update, name="budget_update"),
    path("<int:pk>/delete/", views.budget_delete, name="budget_delete"),
    path("notifications/", views.notification_list, name="notification_list"),
    path("notifications/clear/", views.notification_clear_all, name="notification_clear_all"),
    path("notifications/<int:pk>/read/", views.mark_notification_read, name="mark_notification_read"),
    path("notifications/<int:pk>/delete/", views.notification_delete, name="notification_delete"),
    
    # API Endpoints (DRF)
    path("api/budgets/", views.budget_list_api, name="budget_list_api"),
    path("api/notifications/", views.notification_list_api, name="notification_list_api"),
    path("api/notifications/<int:pk>/read/", views.mark_notification_read_api, name="mark_notification_read_api"),
]
