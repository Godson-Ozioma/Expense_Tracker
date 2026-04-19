from django.contrib.auth.models import User
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Category, Expense


class ExpenseApiTests(APITestCase):
    def setUp(self):
        self.user_a = User.objects.create_user(
            username='alice',
            password='testpass123',
        )
        self.user_b = User.objects.create_user(
            username='bob',
            password='testpass123',
        )

    def _auth(self, user):
        self.client.force_authenticate(user=user)

    def test_register_and_token(self):
        res = self.client.post(
            '/api/v1/auth/register/',
            {
                'username': 'carol',
                'password': 'testpass123',
            },
            format='json',
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        tok = self.client.post(
            '/api/v1/auth/token/',
            {'username': 'carol', 'password': 'testpass123'},
            format='json',
        )
        self.assertEqual(tok.status_code, status.HTTP_200_OK)
        self.assertIn('access', tok.data)

    def test_expense_isolation(self):
        cat_a = Category.objects.create(user=self.user_a, name='Food')
        when = timezone.now()
        exp = Expense.objects.create(
            user=self.user_a,
            category=cat_a,
            amount='12.50',
            spent_at=when,
            note='lunch',
        )
        self._auth(self.user_b)
        r = self.client.get('/api/v1/expenses/')
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertEqual(r.data.get('count', len(r.data.get('results', []))), 0)

        self._auth(self.user_a)
        r = self.client.get(f'/api/v1/expenses/{exp.pk}/')
        self.assertEqual(r.status_code, status.HTTP_200_OK)

    def test_crud_expense_and_category(self):
        self._auth(self.user_a)
        c = self.client.post(
            '/api/v1/categories/',
            {'name': 'Transport'},
            format='json',
        )
        self.assertEqual(c.status_code, status.HTTP_201_CREATED)
        cid = c.data['id']
        spent = timezone.now()
        e = self.client.post(
            '/api/v1/expenses/',
            {
                'category': cid,
                'amount': '25.00',
                'currency': 'USD',
                'spent_at': spent.isoformat(),
                'note': 'taxi',
            },
            format='json',
        )
        self.assertEqual(e.status_code, status.HTTP_201_CREATED)
        eid = e.data['id']
        r = self.client.get('/api/v1/expenses/')
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(r.data['count'], 1)

        patch = self.client.patch(
            f'/api/v1/expenses/{eid}/',
            {'note': 'uber'},
            format='json',
        )
        self.assertEqual(patch.status_code, status.HTTP_200_OK)

        cat_b = Category.objects.create(user=self.user_b, name='Food')
        self.client.force_authenticate(user=self.user_a)
        bad = self.client.post(
            '/api/v1/expenses/',
            {
                'category': cat_b.pk,
                'amount': '1.00',
                'spent_at': spent.isoformat(),
            },
            format='json',
        )
        self.assertEqual(bad.status_code, status.HTTP_400_BAD_REQUEST)
