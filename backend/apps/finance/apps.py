"""
App: finance
Núcleo de transacciones, balances y categorías.
Contiene la lógica de cálculo de balance dinámico:
  balance = Σ(ingresos) - Σ(egresos)
"""
from django.apps import AppConfig


class FinanceConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.finance"
    verbose_name = "Finanzas"

    def ready(self) -> None:
        # Importar signals al iniciar la app
        import apps.finance.signals  # noqa: F401
