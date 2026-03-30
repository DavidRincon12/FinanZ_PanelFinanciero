"""
App: goals
Seguimiento de metas de ahorro con visualización de progreso.
Fórmula de progreso:
  progreso (%) = (ahorro_actual / meta_objetivo) * 100
"""
from django.apps import AppConfig


class GoalsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.goals"
    verbose_name = "Metas de Ahorro"
