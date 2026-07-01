"""
Models – finance
Modelos de Categoría y Transacción.
El balance no es un campo estático: se calcula dinámicamente
mediante selectores agregados sobre las transacciones.
"""
from decimal import Decimal
from django.conf import settings
from django.db import models


class Category(models.Model):
    """
    Categoría de transacción. Puede ser del sistema o personalizada.
    Sistema: Arriendo, Alimentación, Transporte, Salud, etc.
    """
    SYSTEM = "system"
    CUSTOM = "custom"
    TYPE_CHOICES = [(SYSTEM, "Sistema"), (CUSTOM, "Personalizada")]

    name = models.CharField(max_length=100, verbose_name="Nombre")
    icon = models.CharField(max_length=50, default="💰", verbose_name="Ícono")
    category_type = models.CharField(
        max_length=10, choices=TYPE_CHOICES, default=SYSTEM
    )
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="categories",
        verbose_name="Propietario",
        help_text="Null para categorías del sistema, usuario para personalizadas.",
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Categoría"
        verbose_name_plural = "Categorías"
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


class Transaction(models.Model):
    """
    Registro de cada movimiento financiero del usuario.
    amount siempre es positivo; el tipo (INCOME/EXPENSE) define la dirección.
    """
    INCOME = "income"
    EXPENSE = "expense"
    TYPE_CHOICES = [(INCOME, "Ingreso"), (EXPENSE, "Egreso")]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="transactions",
        verbose_name="Usuario",
    )
    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        verbose_name="Monto",
    )
    transaction_type = models.CharField(
        max_length=10,
        choices=TYPE_CHOICES,
        verbose_name="Tipo",
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="transactions",
        verbose_name="Categoría",
    )
    description = models.CharField(
        max_length=255,
        blank=True,
        verbose_name="Descripción / Nota",
    )
    date = models.DateField(verbose_name="Fecha")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Transacción"
        verbose_name_plural = "Transacciones"
        ordering = ["-date", "-created_at"]

    def __str__(self) -> str:
        sign = "+" if self.transaction_type == self.INCOME else "-"
        return f"{sign}${self.amount} – {self.category} ({self.date})"

    @property
    def signed_amount(self) -> Decimal:
        """Monto con signo para cálculos de balance."""
        return self.amount if self.transaction_type == self.INCOME else -self.amount


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
