"""
App: budget
Control de presupuestos mensuales por categoría y sistema de alertas
preventivas (80% / 100% del límite).
"""
from django.apps import AppConfig


class BudgetConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.budget"
    verbose_name = "Presupuestos"

    def ready(self) -> None:
        import apps.budget.signals  # noqa: F401
