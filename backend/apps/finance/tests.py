# -*- coding: utf-8 -*-
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
            amount="10.00",
            transaction_type=Transaction.EXPENSE,
            category=self.cat1,
            description="Almuerzo de trabajo",
            date=datetime.date(2026, 6, 1)
        )
        self.tx2 = Transaction.objects.create(
            user=self.user,
            amount="20.00",
            transaction_type=Transaction.EXPENSE,
            category=self.cat2,
            description="Uber al aeropuerto",
            date=datetime.date(2026, 6, 10)
        )
        self.tx3 = Transaction.objects.create(
            user=self.user,
            amount="100.00",
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

    def test_filter_by_invalid_date_format(self):
        # API should clean invalid date formats and not crash
        response = self.client.get(self.api_url, {"start_date": "invalid-date", "end_date": "2026-13-45"})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        # Fallback to None returns all transactions of user
        self.assertEqual(len(data), 3)


class TransactionBulkCreateTestCase(TestCase):
    def setUp(self):
        User = get_user_model()
        self.user = User.objects.create_user(username="testuser", email="test@test.com", password="pass")
        self.cat1 = Category.objects.create(name="Alimentación", owner=self.user)
        
        self.client = Client()
        self.client.login(username="testuser", password="pass")

    def test_bulk_create_atomic(self):
        # Start with 0 transactions
        self.assertEqual(Transaction.objects.filter(user=self.user).count(), 0)
        
        payload = [
            {"amount": 100, "transaction_type": "expense", "description": "Row 1", "date": "2026-06-01"},
            {"amount": -50, "transaction_type": "expense", "description": "Invalid Row", "date": "invalid-date"}
        ]
        url = reverse("finance:transaction_bulk_create_api")
        response = self.client.post(url, payload, content_type="application/json")
        self.assertEqual(response.status_code, 400)
        self.assertEqual(Transaction.objects.filter(user=self.user).count(), 0) # remains original count, no partial inserts

    def test_bulk_create_success(self):
        self.assertEqual(Transaction.objects.filter(user=self.user).count(), 0)
        
        payload = [
            {"amount": "100.00", "transaction_type": "expense", "description": "Row 1", "date": "2026-06-01", "category_id": self.cat1.id},
            {"amount": "50.00", "transaction_type": "income", "description": "Row 2", "date": "2026-06-02"}
        ]
        url = reverse("finance:transaction_bulk_create_api")
        response = self.client.post(url, payload, content_type="application/json")
        self.assertEqual(response.status_code, 201)
        
        # Verify both transactions were created and belong to the correct user
        self.assertEqual(Transaction.objects.filter(user=self.user).count(), 2)
        
        tx1 = Transaction.objects.get(description="Row 1", user=self.user)
        self.assertEqual(tx1.amount, 100)
        self.assertEqual(tx1.category, self.cat1)
        
        tx2 = Transaction.objects.get(description="Row 2", user=self.user)
        self.assertEqual(tx2.amount, 50)
        self.assertIsNone(tx2.category)


from django.test import TestCase
from django.contrib.auth import get_user_model
from apps.finance.models import Category, Subscription
import datetime

User = get_user_model()

class SubscriptionModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="testuser", email="test@test.com", password="password")
        self.category = Category.objects.create(name="Streaming", icon="🎬", category_type=Category.SYSTEM)

    def test_subscription_creation(self):
        subscription = Subscription.objects.create(
            user=self.user,
            name="Netflix",
            amount=44900.00,
            category=self.category,
            frequency="monthly",
            start_date=datetime.date(2026, 6, 1),
            next_billing_date=datetime.date(2026, 7, 1),
            is_active=True,
            auto_pay=False,
            alert_days_before=3
        )
        self.assertEqual(subscription.name, "Netflix")
        self.assertEqual(str(subscription), "Netflix - $44900.00 (Mensual)")


from services import finance_service

class SubscriptionServiceTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="testservice", email="service@test.com", password="password")
        self.category = Category.objects.create(name="Entertainment", icon="🍿", category_type=Category.SYSTEM)

    def test_calculate_next_billing_date(self):
        start = datetime.date(2026, 6, 1)
        self.assertEqual(finance_service.calculate_next_billing_date(start, 'weekly'), datetime.date(2026, 6, 8))
        self.assertEqual(finance_service.calculate_next_billing_date(start, 'monthly'), datetime.date(2026, 7, 1))
        self.assertEqual(finance_service.calculate_next_billing_date(start, 'quarterly'), datetime.date(2026, 9, 1))
        self.assertEqual(finance_service.calculate_next_billing_date(start, 'semiannually'), datetime.date(2026, 12, 1))
        self.assertEqual(finance_service.calculate_next_billing_date(start, 'annually'), datetime.date(2027, 6, 1))

    def test_subscription_create_service(self):
        data = {
            "name": "HBO Max",
            "amount": 24900.00,
            "category_id": self.category.id,
            "frequency": "monthly",
            "start_date": "2026-06-01",
            "auto_pay": False,
            "alert_days_before": 2
        }
        sub = finance_service.subscription_create(self.user, data)
        self.assertEqual(sub.name, "HBO Max")
        self.assertEqual(sub.next_billing_date, datetime.date(2026, 6, 1))

    def test_subscription_confirm_service(self):
        sub = Subscription.objects.create(
            user=self.user, name="Spotify", amount=14900.00, category=self.category,
            frequency="monthly", start_date=datetime.date(2026, 6, 1),
            next_billing_date=datetime.date(2026, 6, 1), is_active=True, auto_pay=False
        )
        # Confirming the subscription should register a transaction and advance the next billing date
        tx = finance_service.subscription_confirm(self.user, sub.id)
        self.assertIsNotNone(tx)
        self.assertEqual(tx.amount, 14900.00)
        sub.refresh_from_db()
        self.assertEqual(sub.next_billing_date, datetime.date(2026, 7, 1))
        self.assertEqual(sub.last_processed_date, datetime.date(2026, 6, 1))

    def test_subscription_skip_service(self):
        sub = Subscription.objects.create(
            user=self.user, name="Spotify", amount=14900.00, category=self.category,
            frequency="monthly", start_date=datetime.date(2026, 6, 1),
            next_billing_date=datetime.date(2026, 6, 1), is_active=True, auto_pay=False
        )
        finance_service.subscription_skip(self.user, sub.id)
        sub.refresh_from_db()
        self.assertEqual(sub.next_billing_date, datetime.date(2026, 7, 1))
        self.assertEqual(sub.last_processed_date, datetime.date(2026, 6, 1))


