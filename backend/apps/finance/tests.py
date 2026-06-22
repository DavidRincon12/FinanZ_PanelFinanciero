from django.test import TestCase, Client
from django.urls import reverse
from django.contrib.auth import get_user_model
from apps.finance.models import Transaction, Category
from services.finance_selectors import get_user_transactions
import datetime

class TransactionFilterTestCase(TestCase):
    def setUp(self):
        User = get_user_model()
        self.user = User.objects.create_user(username="testuser", email="test@test.com", password="pass")
        self.cat1 = Category.objects.create(name="Alimentación", owner=self.user)
        self.cat2 = Category.objects.create(name="Transporte", owner=self.user)
        
        # Create some transactions
        self.tx1 = Transaction.objects.create(
            user=self.user,
            amount=10.00,
            transaction_type=Transaction.EXPENSE,
            category=self.cat1,
            description="Almuerzo de trabajo",
            date=datetime.date(2026, 6, 1)
        )
        self.tx2 = Transaction.objects.create(
            user=self.user,
            amount=20.00,
            transaction_type=Transaction.EXPENSE,
            category=self.cat2,
            description="Uber al aeropuerto",
            date=datetime.date(2026, 6, 10)
        )
        self.tx3 = Transaction.objects.create(
            user=self.user,
            amount=100.00,
            transaction_type=Transaction.INCOME,
            category=self.cat1,
            description="Reembolso de viáticos",
            date=datetime.date(2026, 6, 15)
        )

        self.client = Client()
        self.client.login(username="testuser", password="pass")
        self.api_url = reverse("finance:transaction_list_api")

    def test_filter_by_search(self):
        # Selector
        txs = get_user_transactions(self.user, search="Uber")
        self.assertEqual(txs.count(), 1)
        self.assertEqual(txs[0].description, "Uber al aeropuerto")
        
        # API
        response = self.client.get(self.api_url, {"search": "Uber"})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["description"], "Uber al aeropuerto")

    def test_filter_by_category(self):
        # Selector
        txs = get_user_transactions(self.user, category_id=self.cat1.id)
        self.assertEqual(txs.count(), 2)
        
        # API
        response = self.client.get(self.api_url, {"category_id": self.cat1.id})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data), 2)

    def test_filter_by_transaction_type(self):
        # Selector
        txs = get_user_transactions(self.user, transaction_type=Transaction.EXPENSE)
        self.assertEqual(txs.count(), 2)
        
        # API
        response = self.client.get(self.api_url, {"transaction_type": Transaction.EXPENSE})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data), 2)

    def test_filter_by_date_range(self):
        # Selector
        txs = get_user_transactions(self.user, start_date="2026-06-05", end_date="2026-06-12")
        self.assertEqual(txs.count(), 1)
        self.assertEqual(txs[0].description, "Uber al aeropuerto")
        
        # API
        response = self.client.get(self.api_url, {"start_date": "2026-06-05", "end_date": "2026-06-12"})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["description"], "Uber al aeropuerto")

    def test_filter_by_combined_parameters(self):
        # Selector
        txs = get_user_transactions(
            self.user,
            search="Almuerzo",
            category_id=self.cat1.id,
            transaction_type=Transaction.EXPENSE
        )
        self.assertEqual(txs.count(), 1)
        self.assertEqual(txs[0].description, "Almuerzo de trabajo")
        
        # API
        response = self.client.get(self.api_url, {
            "search": "Almuerzo",
            "category_id": self.cat1.id,
            "transaction_type": Transaction.EXPENSE
        })
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["description"], "Almuerzo de trabajo")
