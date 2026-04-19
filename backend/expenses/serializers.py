from django.contrib.auth.models import User
from rest_framework import serializers

from .models import Category, Expense


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password')
        extra_kwargs = {'email': {'required': False, 'allow_blank': True}}

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ('id', 'name')


class ExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        fields = (
            'id',
            'category',
            'amount',
            'currency',
            'spent_at',
            'note',
        )
        read_only_fields = ('id',)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get('request')
        if request and getattr(request.user, 'is_authenticated', False):
            self.fields['category'] = serializers.PrimaryKeyRelatedField(
                queryset=Category.objects.filter(user=request.user),
                allow_null=True,
                required=False,
            )
