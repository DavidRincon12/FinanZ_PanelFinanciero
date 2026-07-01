from django.contrib import admin
from .models import Category, Transaction, Subscription

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ["name", "icon", "category_type", "owner", "is_active"]
    list_filter = ["category_type", "is_active"]
    search_fields = ["name"]

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ["user", "amount", "transaction_type", "category", "date"]
    list_filter = ["transaction_type", "date"]
    search_fields = ["description", "user__username"]
    date_hierarchy = "date"

@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'amount', 'frequency', 'next_billing_date', 'is_active', 'auto_pay')
    list_filter = ('is_active', 'auto_pay', 'frequency')
    search_fields = ('name', 'user__username')
