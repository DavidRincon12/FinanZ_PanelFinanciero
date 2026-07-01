from rest_framework import serializers
from .models import Transaction, Category, Subscription
from services import finance_service

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'icon']

class TransactionSerializer(serializers.ModelSerializer):
    category_name = serializers.ReadOnlyField(source='category.name')
    category_icon = serializers.ReadOnlyField(source='category.icon')
    type = serializers.CharField(source='transaction_type')
    
    class Meta:
        model = Transaction
        fields = ['id', 'user', 'type', 'amount', 'category', 'category_name', 'category_icon', 'description', 'date', 'created_at']
        read_only_fields = ['user', 'created_at']


class SubscriptionSerializer(serializers.ModelSerializer):
    category_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_icon = serializers.CharField(source='category.icon', read_only=True)

    class Meta:
        model = Subscription
        fields = [
            'id', 'name', 'amount', 'category', 'category_id', 'category_name', 'category_icon',
            'frequency', 'start_date', 'next_billing_date', 'is_active', 'auto_pay',
            'alert_days_before', 'last_processed_date', 'created_at'
        ]
        read_only_fields = ['id', 'next_billing_date', 'last_processed_date', 'created_at']

    def create(self, validated_data):
        user = self.context['request'].user
        category_id = validated_data.pop('category_id', None)
        if category_id:
            validated_data['category'] = Category.objects.get(id=category_id)
        return finance_service.subscription_create(user, validated_data)

    def update(self, instance, validated_data):
        category_id = validated_data.pop('category_id', None)
        if category_id is not None:
            instance.category = Category.objects.filter(id=category_id).first()
        elif 'category_id' in self.initial_data and self.initial_data['category_id'] is None:
            instance.category = None
        return super().update(instance, validated_data)

