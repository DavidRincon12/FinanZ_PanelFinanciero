from rest_framework import serializers
from .models import Transaction, Category

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
