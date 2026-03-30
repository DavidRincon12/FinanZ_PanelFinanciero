"""
FinanZ – URL Configuration raíz
Cada app registrará sus propias URLs usando include().
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path("admin/", admin.site.urls),

    # ---- Módulos de la aplicación ----
    path("", include("apps.users.urls", namespace="users")),
    path("finance/", include("apps.finance.urls", namespace="finance")),
    path("budget/", include("apps.budget.urls", namespace="budget")),
    path("goals/", include("apps.goals.urls", namespace="goals")),
]

# Servir media en desarrollo
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
