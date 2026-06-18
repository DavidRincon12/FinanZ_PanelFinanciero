from rest_framework import serializers
from .models import SavingsGoal


class SavingsGoalSerializer(serializers.ModelSerializer):
    progress_percent = serializers.FloatField(read_only=True)
    remaining_amount = serializers.FloatField(read_only=True)
    # Return decimals as floats so the frontend doesn't get strings
    target_amount  = serializers.FloatField()
    current_amount = serializers.FloatField(read_only=True)

    class Meta:
        model = SavingsGoal
        fields = [
            'id', 'name', 'description', 'icon',
            'target_amount', 'current_amount', 'remaining_amount',
            'progress_percent', 'deadline', 'status',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['current_amount', 'status', 'created_at', 'updated_at']
