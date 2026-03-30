from django.contrib import admin
from .models import Budget, Notification

@admin.register(Budget)
class BudgetAdmin(admin.ModelAdmin):
    list_display = ["user", "category", "limit_amount", "month", "year", "alerted_80", "alerted_100"]
    list_filter = ["year", "month"]

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ["user", "level", "title", "is_read", "created_at"]
    list_filter = ["level", "is_read"]
