from django.contrib import admin
from .models import SavingsGoal

@admin.register(SavingsGoal)
class SavingsGoalAdmin(admin.ModelAdmin):
    list_display = ["user", "name", "target_amount", "current_amount", "status", "deadline"]
    list_filter = ["status"]
    search_fields = ["name", "user__username"]
