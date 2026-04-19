from django.conf import settings
from django.db import models


class Category(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='expense_categories',
    )
    name = models.CharField(max_length=120)

    class Meta:
        ordering = ('name', 'pk')
        constraints = [
            models.UniqueConstraint(
                fields=('user', 'name'),
                name='expenses_category_user_name_uniq',
            ),
        ]
        verbose_name_plural = 'categories'

    def __str__(self):
        return self.name


class Expense(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='expenses',
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='expenses',
    )
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    currency = models.CharField(max_length=8, default='USD')
    spent_at = models.DateTimeField()
    note = models.TextField(blank=True)

    class Meta:
        ordering = ('-spent_at', '-pk')

    def __str__(self):
        return f'{self.amount} {self.currency} ({self.spent_at.date()})'
