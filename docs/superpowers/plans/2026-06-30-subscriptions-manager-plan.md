# Gestor de Suscripciones y Pagos Recurrentes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the database model, business logic, endpoints, cron/lazy-fallback engine, and React page for managing personal finance subscriptions with automatic or manual confirmation workflows and email alerts.

**Architecture:** Extend the `finance` Django app with a new `Subscription` model, implement writing/processing operations in the Service Layer (`finance_service.py`), expose REST APIs in Django REST Framework, protect the cron trigger endpoint via token verification, and build a compact table view in React `/subscriptions` using Tailwind CSS v4 and Lucide icons.

**Tech Stack:** Python 3.12, Django 5.x, Django REST Framework, SQLite (dev) / Neon PostgreSQL (prod), React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Framer Motion.

## Global Constraints
- Target directories: `backend/` and `frontend/`.
- Maintain docstrings and comments in untouched sections.
- Keep components modular and responsive.
- Verify correctness by running tests after every task.
- Commit frequently with descriptive messages.

---

### Task 1: Backend Database Model (`Subscription`)

**Files:**
- Create: None
- Modify:
  - `backend/apps/finance/models.py`
  - `backend/apps/finance/admin.py`
  - `backend/apps/finance/tests.py`

**Interfaces:**
- Consumes: `Category` model from `apps.finance.models`
- Produces: `Subscription` database model

- [ ] **Step 1: Write the failing test for the Subscription model**
  Modify `backend/apps/finance/tests.py` (append at the end of the file):
  ```python
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
  ```

- [ ] **Step 2: Run tests to verify it fails**
  Run: `python backend/manage.py test apps.finance.tests.SubscriptionModelTest`
  Expected: FAIL (ImportError or NameError because Subscription does not exist)

- [ ] **Step 3: Implement Subscription model in `models.py`**
  Modify `backend/apps/finance/models.py` by adding the model after the `Transaction` class:
  ```python
  class Subscription(models.Model):
      FREQUENCY_CHOICES = [
          ('weekly', 'Semanal'),
          ('monthly', 'Mensual'),
          ('quarterly', 'Trimestral'),
          ('semiannually', 'Semestral'),
          ('annually', 'Anual'),
      ]

      user = models.ForeignKey(
          settings.AUTH_USER_MODEL,
          on_delete=models.CASCADE,
          related_name="subscriptions",
          verbose_name="Usuario"
      )
      name = models.CharField(max_length=100, verbose_name="Nombre del Servicio")
      amount = models.DecimalField(max_digits=12, decimal_places=2, verbose_name="Costo")
      category = models.ForeignKey(
          Category,
          on_delete=models.SET_NULL,
          null=True,
          blank=True,
          related_name="subscriptions",
          verbose_name="Categoría"
      )
      frequency = models.CharField(
          max_length=15,
          choices=FREQUENCY_CHOICES,
          default='monthly',
          verbose_name="Frecuencia de Pago"
      )
      start_date = models.DateField(verbose_name="Fecha de Inicio")
      next_billing_date = models.DateField(verbose_name="Próxima Fecha de Pago")
      is_active = models.BooleanField(default=True, verbose_name="¿Activa?")
      auto_pay = models.BooleanField(default=False, verbose_name="¿Pago Automático?")
      alert_days_before = models.PositiveIntegerField(
          default=3,
          verbose_name="Días de Alerta Anticipada"
      )
      last_processed_date = models.DateField(
          null=True,
          blank=True,
          verbose_name="Última Fecha Procesada"
      )
      created_at = models.DateTimeField(auto_now_add=True)
      updated_at = models.DateTimeField(auto_now=True)

      class Meta:
          verbose_name = "Suscripción"
          verbose_name_plural = "Suscripciones"
          ordering = ["next_billing_date"]

      def __str__(self):
          return f"{self.name} - ${self.amount:.2f} ({self.get_frequency_display()})"
  ```

- [ ] **Step 4: Register model in django admin**
  Modify `backend/apps/finance/admin.py` to register the new model:
  ```python
  from django.contrib import admin
  from .models import Category, Transaction, Subscription

  @admin.register(Subscription)
  class SubscriptionAdmin(admin.ModelAdmin):
      list_display = ('name', 'user', 'amount', 'frequency', 'next_billing_date', 'is_active', 'auto_pay')
      list_filter = ('is_active', 'auto_pay', 'frequency')
      search_fields = ('name', 'user__username')
  ```

- [ ] **Step 5: Create and run migrations**
  Run: `python backend/manage.py makemigrations finance`
  Run: `python backend/manage.py migrate`

- [ ] **Step 6: Run tests to verify it passes**
  Run: `python backend/manage.py test apps.finance.tests.SubscriptionModelTest`
  Expected: PASS

- [ ] **Step 7: Commit**
  Run: `git add backend/apps/finance/models.py backend/apps/finance/admin.py backend/apps/finance/tests.py`
  Run: `git commit -m "feat(backend): add Subscription model and migrations"`

---

### Task 2: Service Layer & Business Logic (`finance_service.py`)

**Files:**
- Create: None
- Modify:
  - `backend/services/finance_service.py`
  - `backend/apps/finance/tests.py`

**Interfaces:**
- Consumes: `Subscription` and `Transaction` models
- Produces: Service functions `calculate_next_billing_date`, `subscription_create`, `subscription_confirm`, `subscription_skip`

- [ ] **Step 1: Write failing tests for service operations**
  Modify `backend/apps/finance/tests.py` (append to tests file):
  ```python
  from services import finance_service
  import datetime

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
  ```

- [ ] **Step 2: Run tests to verify they fail**
  Run: `python backend/manage.py test apps.finance.tests.SubscriptionServiceTest`
  Expected: FAIL (AttributeError because service functions are not defined)

- [ ] **Step 3: Implement functions in `backend/services/finance_service.py`**
  Modify `backend/services/finance_service.py` (add helpers at the end):
  ```python
  from apps.finance.models import Subscription
  from django.shortcuts import get_object_or_404
  from django.utils.dateparse import parse_date

  def calculate_next_billing_date(current_date: datetime.date, frequency: str) -> datetime.date:
      """Calcula la siguiente fecha de vencimiento según la frecuencia."""
      if frequency == 'weekly':
          return current_date + datetime.timedelta(days=7)
      elif frequency == 'monthly':
          # Sumar un mes de forma robusta
          year = current_date.year + (current_date.month // 12)
          month = (current_date.month % 12) + 1
          day = min(current_date.day, [31, 29 if year % 4 == 0 and (year % 100 != 0 or year % 400 == 0) else 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1])
          return datetime.date(year, month, day)
      elif frequency == 'quarterly':
          # Sumar 3 meses
          year = current_date.year + ((current_date.month + 2) // 12)
          month = ((current_date.month + 2) % 12) + 1
          day = min(current_date.day, [31, 29 if year % 4 == 0 and (year % 100 != 0 or year % 400 == 0) else 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1])
          return datetime.date(year, month, day)
      elif frequency == 'semiannually':
          # Sumar 6 meses
          year = current_date.year + ((current_date.month + 5) // 12)
          month = ((current_date.month + 5) % 12) + 1
          day = min(current_date.day, [31, 29 if year % 4 == 0 and (year % 100 != 0 or year % 400 == 0) else 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1])
          return datetime.date(year, month, day)
      elif frequency == 'annually':
          # Sumar 1 año
          year = current_date.year + 1
          day = min(current_date.day, 29 if year % 4 == 0 and (year % 100 != 0 or year % 400 == 0) else 28) if current_date.month == 2 and current_date.day == 29 else current_date.day
          return datetime.date(year, current_date.month, day)
      return current_date

  def subscription_create(user: CustomUser, data: dict) -> Subscription:
      """Crea y guarda una nueva suscripción."""
      name = data.get("name", "").strip()
      amount = Decimal(str(data.get("amount", 0)))
      category_id = data.get("category_id")
      category = Category.objects.filter(id=category_id).first() if category_id else None
      frequency = data.get("frequency", "monthly")
      start_date_raw = data.get("start_date")
      start_date = parse_date(str(start_date_raw)) if start_date_raw else timezone.now().date()
      auto_pay = bool(data.get("auto_pay", False))
      alert_days_before = int(data.get("alert_days_before", 3))

      sub = Subscription.objects.create(
          user=user,
          name=name,
          amount=amount,
          category=category,
          frequency=frequency,
          start_date=start_date,
          next_billing_date=start_date, # Inicialmente el vencimiento es la fecha de inicio
          is_active=True,
          auto_pay=auto_pay,
          alert_days_before=alert_days_before
      )
      return sub

  def subscription_confirm(user: CustomUser, subscription_id: int) -> Transaction:
      """Confirma un pago pendiente, registra una transacción y avanza el ciclo."""
      with db_transaction.atomic():
          sub = get_object_or_404(Subscription, id=subscription_id, user=user)
          # Crear transacción de egreso
          tx = Transaction.objects.create(
              user=user,
              amount=sub.amount,
              transaction_type=Transaction.EXPENSE,
              category=sub.category,
              description=f"Pago: {sub.name}",
              date=sub.next_billing_date
          )
          # Actualizar fecha de cobro y última procesada
          sub.last_processed_date = sub.next_billing_date
          sub.next_billing_date = calculate_next_billing_date(sub.next_billing_date, sub.frequency)
          sub.save()
          return tx

  def subscription_skip(user: CustomUser, subscription_id: int) -> None:
      """Omite el cobro del periodo actual y avanza la fecha al siguiente vencimiento."""
      sub = get_object_or_404(Subscription, id=subscription_id, user=user)
      sub.last_processed_date = sub.next_billing_date
      sub.next_billing_date = calculate_next_billing_date(sub.next_billing_date, sub.frequency)
      sub.save()
  ```

- [ ] **Step 4: Run tests to verify they pass**
  Run: `python backend/manage.py test apps.finance.tests.SubscriptionServiceTest`
  Expected: PASS

- [ ] **Step 5: Commit**
  Run: `git add backend/services/finance_service.py backend/apps/finance/tests.py`
  Run: `git commit -m "feat(backend): implement Subscription service methods and tests"`

---

### Task 3: REST API Views and Serializers

**Files:**
- Create: None
- Modify:
  - `backend/apps/finance/serializers.py`
  - `backend/apps/finance/views.py`
  - `backend/apps/finance/urls.py`
  - `backend/apps/finance/tests.py`

**Interfaces:**
- Consumes: Django rest framework viewsets and authentication layers
- Produces: JSON CRUD endpoints for `/api/subscriptions/` and custom actions

- [ ] **Step 1: Write failing tests for API endpoints**
  Modify `backend/apps/finance/tests.py` (append to file):
  ```python
  from rest_framework.test import APITestCase
  from rest_framework import status

  class SubscriptionAPITest(APITestCase):
      def setUp(self):
          self.user = User.objects.create_user(username="apiuser", email="api@test.com", password="password")
          self.client.force_authenticate(user=self.user)
          self.category = Category.objects.create(name="Streaming", icon="🎬")

      def test_crud_endpoints(self):
          # Create
          data = {
              "name": "Prime Video", "amount": "17900.00", "category_id": self.category.id,
              "frequency": "monthly", "start_date": "2026-06-01", "auto_pay": True
          }
          response = self.client.post("/api/subscriptions/", data, format="json")
          self.assertEqual(response.status_code, status.HTTP_201_CREATED)
          sub_id = response.data["id"]

          # List
          response = self.client.get("/api/subscriptions/")
          self.assertEqual(response.status_code, status.HTTP_200_OK)
          self.assertTrue(len(response.data) > 0)

          # Skip
          response = self.client.post(f"/api/subscriptions/{sub_id}/skip/")
          self.assertEqual(response.status_code, status.HTTP_200_OK)

          # Confirm
          response = self.client.post(f"/api/subscriptions/{sub_id}/confirm/")
          self.assertEqual(response.status_code, status.HTTP_200_OK)
  ```

- [ ] **Step 2: Run tests to verify failure**
  Run: `python backend/manage.py test apps.finance.tests.SubscriptionAPITest`
  Expected: FAIL (404 status code or route mismatch)

- [ ] **Step 3: Implement Serializers**
  Modify `backend/apps/finance/serializers.py` (append at the end):
  ```python
  from .models import Subscription

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
  ```

- [ ] **Step 4: Implement ViewSet in `backend/apps/finance/views.py`**
  Modify `backend/apps/finance/views.py` (add import and ViewSet at the end):
  ```python
  from rest_framework import viewsets
  from rest_framework.decorators import action
  from rest_framework.response import Response
  from .models import Subscription
  from .serializers import SubscriptionSerializer

  class SubscriptionViewSet(viewsets.ModelModelViewSet): # Wait, ModelViewSet
  ```
  *Corrección del import:* En `backend/apps/finance/views.py`:
  ```python
  from rest_framework.viewsets import ModelViewSet

  class SubscriptionViewSet(ModelViewSet):
      serializer_class = SubscriptionSerializer
      queryset = Subscription.objects.all()

      def get_queryset(self):
          return Subscription.objects.filter(user=self.request.user)

      @action(detail=True, methods=['post'])
      def confirm(self, request, pk=None):
          tx = finance_service.subscription_confirm(request.user, pk)
          return Response({"status": "confirmed", "transaction_id": tx.id})

      @action(detail=True, methods=['post'])
      def skip(self, request, pk=None):
          finance_service.subscription_skip(request.user, pk)
          return Response({"status": "skipped"})
  ```

- [ ] **Step 5: Register URL routing**
  Modify `backend/apps/finance/urls.py` (register routes in default router):
  ```python
  from django.urls import path, include
  from rest_framework.routers import DefaultRouter
  from .views import CategoryViewSet, TransactionViewSet, SubscriptionViewSet # Add SubscriptionViewSet

  router = DefaultRouter()
  router.register(r'categories', CategoryViewSet, basename='category')
  router.register(r'transactions', TransactionViewSet, basename='transaction')
  router.register(r'subscriptions', SubscriptionViewSet, basename='subscription') # Register subscription

  urlpatterns = [
      path('', include(router.urls)),
  ]
  ```

- [ ] **Step 6: Run tests to verify API endpoints**
  Run: `python backend/manage.py test apps.finance.tests.SubscriptionAPITest`
  Expected: PASS

- [ ] **Step 7: Commit**
  Run: `git add backend/apps/finance/serializers.py backend/apps/finance/views.py backend/apps/finance/urls.py`
  Run: `git commit -m "feat(backend): add Subscription REST endpoints and API tests"`

---

### Task 4: Cron Processor Engine & Lazy-Checking Fallback

**Files:**
- Create: None
- Modify:
  - `backend/services/finance_service.py`
  - `backend/apps/finance/views.py`
  - `backend/apps/finance/urls.py`
  - `backend/apps/finance/tests.py`
  - `backend/apps/users/views.py` (or dashboard check logic)

**Interfaces:**
- Consumes: `CRON_SECRET` env var header
- Produces: Daily billing and alert dispatch endpoint, fallback checking process

- [ ] **Step 1: Write test for processing cron logic**
  Modify `backend/apps/finance/tests.py` (append):
  ```python
  from django.core import mail

  class SubscriptionCronTest(APITestCase):
      def setUp(self):
          self.user = User.objects.create_user(username="cronuser", email="cron@test.com", password="password")
          self.category = Category.objects.create(name="Streaming", icon="🎬")
          self.sub_auto = Subscription.objects.create(
              user=self.user, name="Netflix", amount=44900.00, category=self.category,
              frequency="monthly", start_date=datetime.date(2026, 6, 1),
              next_billing_date=timezone.now().date(), is_active=True, auto_pay=True
          )
          self.sub_manual = Subscription.objects.create(
              user=self.user, name="Spotify", amount=14900.00, category=self.category,
              frequency="monthly", start_date=datetime.date(2026, 6, 1),
              next_billing_date=timezone.now().date(), is_active=True, auto_pay=False
          )

      def test_cron_unauthorized(self):
          response = self.client.post("/api/subscriptions/process-cron/")
          self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

      def test_cron_authorized_execution(self):
          import os
          os.environ["CRON_SECRET"] = "super-secret-token"
          self.client.credentials(HTTP_AUTHORIZATION="Bearer super-secret-token")
          
          response = self.client.post("/api/subscriptions/process-cron/")
          self.assertEqual(response.status_code, status.HTTP_200_OK)
          
          # Auto-pay should create a transaction
          self.sub_auto.refresh_from_db()
          self.assertEqual(self.sub_auto.last_processed_date, timezone.now().date())
          self.assertTrue(Transaction.objects.filter(user=self.user, amount=44900.00).exists())
          
          # Manual pay should not create a transaction automatically
          self.assertFalse(Transaction.objects.filter(user=self.user, amount=14900.00).exists())
  ```

- [ ] **Step 2: Run tests to verify failure**
  Run: `python backend/manage.py test apps.finance.tests.SubscriptionCronTest`
  Expected: FAIL (404/403 discrepancies)

- [ ] **Step 3: Implement global subscription processing logic in `services/finance_service.py`**
  Modify `backend/services/finance_service.py` (add implementation):
  ```python
  from django.core.mail import send_mail
  from django.conf import settings

  def process_all_due_subscriptions(specific_user=None) -> dict:
      """Procesa suscripciones vencidas. Envía correos de confirmación o de alerta anticipada."""
      today = timezone.now().date()
      results = {"processed_auto": 0, "alerts_sent": 0}
      
      # 1. Procesar cobros vencidos o actuales (next_billing_date <= today)
      due_filter = models.Q(is_active=True, next_billing_date__lte=today)
      if specific_user:
          due_filter &= models.Q(user=specific_user)
          
      due_subscriptions = Subscription.objects.filter(due_filter)
      for sub in due_subscriptions:
          # Doble facturación check
          if sub.last_processed_date == sub.next_billing_date:
              continue
              
          if sub.auto_pay:
              # Crear transacción de egreso
              Transaction.objects.create(
                  user=sub.user,
                  amount=sub.amount,
                  transaction_type=Transaction.EXPENSE,
                  category=sub.category,
                  description=f"Pago Automático: {sub.name}",
                  date=sub.next_billing_date
              )
              sub.last_processed_date = sub.next_billing_date
              sub.next_billing_date = calculate_next_billing_date(sub.next_billing_date, sub.frequency)
              sub.save()
              results["processed_auto"] += 1
              
              # Enviar correo informativo
              try:
                  send_mail(
                      subject=f"FinanZ: Pago registrado - {sub.name}",
                      message=f"Hola {sub.user.username},\n\nSe ha registrado automáticamente el pago de tu suscripción a {sub.name} por un monto de ${sub.amount}.\n\nTu saldo y presupuestos han sido actualizados.",
                      from_email=settings.DEFAULT_FROM_EMAIL,
                      recipient_list=[sub.user.email],
                      fail_silently=True
                  )
              except Exception:
                  pass
          else:
              # Enviar recordatorio para confirmación manual
              try:
                  send_mail(
                      subject=f"FinanZ: Recordatorio de Pago Pendiente - {sub.name}",
                      message=f"Hola {sub.user.username},\n\nTu suscripción a {sub.name} por un monto de ${sub.amount} está pendiente de pago. Recuerda confirmarla o descartarla ingresando a tu panel en FinanZ.",
                      from_email=settings.DEFAULT_FROM_EMAIL,
                      recipient_list=[sub.user.email],
                      fail_silently=True
                  )
              except Exception:
                  pass
                  
      # 2. Enviar recordatorios preventivos (next_billing_date - alert_days_before == today)
      alert_filter = models.Q(is_active=True)
      if specific_user:
          alert_filter &= models.Q(user=specific_user)
      active_subs = Subscription.objects.filter(alert_filter)
      for sub in active_subs:
          alert_date = sub.next_billing_date - datetime.timedelta(days=sub.alert_days_before)
          if alert_date == today:
              results["alerts_sent"] += 1
              try:
                  send_mail(
                      subject=f"FinanZ: Próximo cobro - {sub.name}",
                      message=f"Hola {sub.user.username},\n\nTe recordamos que en {sub.alert_days_before} días se renovará tu suscripción a {sub.name} por un valor de ${sub.amount}.\n\nPara modificarla o pausarla, ingresa a FinanZ.",
                      from_email=settings.DEFAULT_FROM_EMAIL,
                      recipient_list=[sub.user.email],
                      fail_silently=True
                  )
              except Exception:
                  pass
                  
      return results
  ```

- [ ] **Step 4: Implement Cron API View in `backend/apps/finance/views.py`**
  Modify `backend/apps/finance/views.py` (add imports and view):
  ```python
  import os
  from rest_framework.views import APIView
  from rest_framework.permissions import AllowAny
  from rest_framework.exceptions import PermissionDenied

  class SubscriptionsProcessCronView(APIView):
      permission_classes = [AllowAny]

      def post(self, request):
          auth_header = request.headers.get("Authorization", "")
          expected_token = os.environ.get("CRON_SECRET")
          
          if not expected_token or auth_header != f"Bearer {expected_token}":
              raise PermissionDenied("Token no válido o ausente.")
              
          results = finance_service.process_all_due_subscriptions()
          return Response({"status": "success", "results": results})
  ```

- [ ] **Step 5: Register Cron URL path**
  Modify `backend/apps/finance/urls.py` (add path):
  ```python
  from .views import SubscriptionsProcessCronView

  # En urlpatterns append:
  urlpatterns += [
      path('subscriptions/process-cron/', SubscriptionsProcessCronView.as_view(), name='subscriptions-cron'),
  ]
  ```

- [ ] **Step 6: Add lazy fallback checking to user Profile/Dashboard API**
  Modify `backend/apps/users/views.py` (or another core view like Dashboard data endpoint) to run `finance_service.process_all_due_subscriptions(request.user)` whenever a user accesses their account.
  Let's add it to `apps.users.views` or the dashboard info view:
  ```python
  from services import finance_service
  # Dentro de la vista del Perfil del usuario o del Dashboard (GET):
  finance_service.process_all_due_subscriptions(request.user)
  ```

- [ ] **Step 7: Run tests to verify the cron passes**
  Run: `python backend/manage.py test apps.finance.tests.SubscriptionCronTest`
  Expected: PASS

- [ ] **Step 8: Commit**
  Run: `git add backend/services/finance_service.py backend/apps/finance/views.py backend/apps/finance/urls.py backend/apps/finance/tests.py`
  Run: `git commit -m "feat(backend): add cron processing engine and security middleware"`

---

### Task 5: Frontend API client methods

**Files:**
- Create: None
- Modify:
  - `frontend/src/services/api.ts`

**Interfaces:**
- Consumes: REST endpoints of `/api/subscriptions/`
- Produces: Typescript interfaces and api requests (`getSubscriptions`, `createSubscription`, `updateSubscription`, `deleteSubscription`, `confirmSubscription`, `skipSubscription`)

- [ ] **Step 1: Implement interfaces and fetch methods in `frontend/src/services/api.ts`**
  Modify `frontend/src/services/api.ts` (add interfaces and export functions):
  ```typescript
  export interface Subscription {
    id: number;
    name: string;
    amount: number;
    category: number | null;
    category_id?: number | null;
    category_name?: string | null;
    category_icon?: string | null;
    frequency: 'weekly' | 'monthly' | 'quarterly' | 'semiannually' | 'annually';
    start_date: string;
    next_billing_date: string;
    is_active: boolean;
    auto_pay: boolean;
    alert_days_before: number;
    last_processed_date: string | null;
    created_at: string;
  }

  export const subscriptionApi = {
    getAll: async (): Promise<Subscription[]> => {
      const response = await fetch(`${API_BASE_URL}/api/subscriptions/`, {
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Error al cargar suscripciones');
      return response.json();
    },

    create: async (data: Partial<Subscription>): Promise<Subscription> => {
      const response = await fetch(`${API_BASE_URL}/api/subscriptions/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Error al crear suscripción');
      return response.json();
    },

    update: async (id: number, data: Partial<Subscription>): Promise<Subscription> => {
      const response = await fetch(`${API_BASE_URL}/api/subscriptions/${id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Error al actualizar suscripción');
      return response.json();
    },

    delete: async (id: number): Promise<void> => {
      const response = await fetch(`${API_BASE_URL}/api/subscriptions/${id}/`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Error al eliminar suscripción');
    },

    confirm: async (id: number): Promise<{ status: string }> => {
      const response = await fetch(`${API_BASE_URL}/api/subscriptions/${id}/confirm/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Error al confirmar pago');
      return response.json();
    },

    skip: async (id: number): Promise<{ status: string }> => {
      const response = await fetch(`${API_BASE_URL}/api/subscriptions/${id}/skip/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Error al omitir pago');
      return response.json();
    }
  };
  ```

- [ ] **Step 2: Commit**
  Run: `git add frontend/src/services/api.ts`
  Run: `git commit -m "feat(frontend): add subscription api client methods"`

---

### Task 6: Frontend Routing & Sidebar Navigation

**Files:**
- Create: None
- Modify:
  - `frontend/src/App.tsx`
  - `frontend/src/components/Sidebar.tsx`

**Interfaces:**
- Consumes: React router routing tags
- Produces: Menu links and routes for `/subscriptions`

- [ ] **Step 1: Add subscriptions route link in `frontend/src/components/Sidebar.tsx`**
  Modify `frontend/src/components/Sidebar.tsx` (import `CreditCard` and place NavItem before `Ajustes`):
  ```typescript
  // Import:
  import { LayoutDashboard, ArrowLeftRight, PiggyBank, Target, LogOut, Wallet, Tag, Settings, CreditCard } from 'lucide-react';

  // Navigation menu links:
  <NavItem icon={<Target size={20} />} label="Metas" to="/goals" />
  <NavItem icon={<CreditCard size={20} />} label="Suscripciones" to="/subscriptions" />
  <NavItem icon={<Settings size={20} />} label="Ajustes" to="/profile" />
  ```

- [ ] **Step 2: Declare Route in `frontend/src/App.tsx`**
  Modify `frontend/src/App.tsx` (lazy import or direct import Subscriptions page and add route):
  ```typescript
  import Subscriptions from './pages/Subscriptions';

  // Inside Routes paths, add:
  <Route 
    path="/subscriptions" 
    element={
      <ProtectedRoute>
        <Subscriptions />
      </ProtectedRoute>
    } 
  />
  ```

- [ ] **Step 3: Commit**
  Run: `git add frontend/src/App.tsx frontend/src/components/Sidebar.tsx`
  Run: `git commit -m "feat(frontend): configure routing and navigation sidebar link"`

---

### Task 7: Subscriptions Page Component (`Subscriptions.tsx`)

**Files:**
- Create: `frontend/src/pages/Subscriptions.tsx`
- Modify: None

**Interfaces:**
- Consumes: `subscriptionApi` methods, tailwind visual grid components, Lucide icons
- Produces: Core interactive Subscriptions page dashboard view with modal form

- [ ] **Step 1: Create `frontend/src/pages/Subscriptions.tsx`**
  Write a clean layout with:
  * Top metrics grid: Projected Monthly, Total Count, Next due.
  * Pending charges list: Highlighted in amber cards for payments that need confirmation with actions "Confirmar" and "Omitir".
  * Subscriptions Table: Columns Name, Category, Cost/Cycle, Next Due Date (with countdown), Auto-Pay Toggle, Status Toggle, Actions (Edit, Delete).
  * Subscription Form Modal (for creation/edition).

  Let's draft the core script:
  ```typescript
  import React, { useState, useEffect } from 'react';
  import Layout from '../components/Layout';
  import AnimatedPage from '../components/AnimatedPage';
  import { Plus, CreditCard, Calendar, RefreshCw, EyeOff, Check, AlertCircle, Edit, Trash2 } from 'lucide-react';
  import { subscriptionApi, Subscription, Category } from '../services/api';
  // ... (Include state management, fetching categories, fetching subscriptions, handlers for skip/confirm, and the modal form)
  ```
  Write the full file `frontend/src/pages/Subscriptions.tsx` with tailwind styling, form validation, error toasts, and confirmation alerts.

- [ ] **Step 2: Verify page compilation**
  Run development server: `npm --prefix frontend run build` to ensure no Typescript compilation errors exist.

- [ ] **Step 3: Commit**
  Run: `git add frontend/src/pages/Subscriptions.tsx`
  Run: `git commit -m "feat(frontend): implement Subscriptions page and form modal UI"`
