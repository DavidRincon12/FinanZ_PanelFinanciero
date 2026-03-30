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
