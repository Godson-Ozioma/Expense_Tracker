from datetime import datetime

from django.utils import timezone
from django.contrib.auth.models import User
from rest_framework import generics, permissions, viewsets

from .models import Category, Expense
from .serializers import (
    CategorySerializer,
    ExpenseSerializer,
    RegisterSerializer,
)


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Category.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ExpenseViewSet(viewsets.ModelViewSet):
    serializer_class = ExpenseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Expense.objects.filter(user=self.request.user).select_related(
            'category'
        )
        category_id = self.request.query_params.get('category')
        if category_id is not None and category_id != '':
            qs = qs.filter(category_id=category_id)
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        if date_from:
            qs = qs.filter(spent_at__gte=_parse_datetime_start(date_from))
        if date_to:
            qs = qs.filter(spent_at__lte=_parse_datetime_end(date_to))
        return qs

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def perform_update(self, serializer):
        serializer.save()


def _parse_datetime_start(value: str):
    dt = datetime.fromisoformat(value.replace('Z', '+00:00'))
    if timezone.is_naive(dt):
        dt = timezone.make_aware(dt, timezone.get_current_timezone())
    return dt


def _parse_datetime_end(value: str):
    dt = datetime.fromisoformat(value.replace('Z', '+00:00'))
    if timezone.is_naive(dt):
        dt = timezone.make_aware(dt, timezone.get_current_timezone())
    return dt
