from rest_framework import serializers
from .models import Budget, Notification

class BudgetSerializer(serializers.ModelSerializer):
    category_name = serializers.ReadOnlyField(source='category.name')
    category_icon = serializers.ReadOnlyField(source='category.icon')
    amount = serializers.DecimalField(source='limit_amount', max_digits=12, decimal_places=2)
    spent = serializers.SerializerMethodField()
    percentage = serializers.SerializerMethodField()

    class Meta:
        model = Budget
        fields = [
            'id', 'user', 'category', 'category_name', 'category_icon', 
            'amount', 'spent', 'percentage', 'month', 'year', 
            'warning_threshold', 'critical_threshold'
        ]
        read_only_fields = ['user', 'spent', 'percentage']

    def get_spent(self, obj) -> float:
        from apps.finance.models import Transaction
        from django.db.models import Sum
        total = Transaction.objects.filter(
            user=obj.user,
            category=obj.category,
            transaction_type=Transaction.EXPENSE,
            date__year=obj.year,
            date__month=obj.month,
        ).aggregate(total=Sum("amount"))["total"] or 0
        return float(total)

    def get_percentage(self, obj) -> float:
        spent = self.get_spent(obj)
        limit = float(obj.limit_amount)
        if limit <= 0:
            return 0.0
        return (spent / limit) * 100.0

class NotificationSerializer(serializers.ModelSerializer):
    type = serializers.CharField(source='level', read_only=True)

    class Meta:
        model = Notification
        fields = ['id', 'user', 'title', 'message', 'type', 'is_read', 'created_at']
        read_only_fields = ['user', 'created_at']
