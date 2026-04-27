"""
Management Command – seed_categories
Carga las categorías del sistema predeterminadas (localizadas para Colombia).
Uso: python manage.py seed_categories
Es idempotente: no crea duplicados si se ejecuta varias veces.
"""
from django.core.management.base import BaseCommand
from apps.finance.models import Category


SYSTEM_CATEGORIES = [
    {"name": "Arriendo",        "icon": "🏠"},
    {"name": "Alimentación",    "icon": "🛒"},
    {"name": "Transporte",      "icon": "🚌"},
    {"name": "Salud",           "icon": "🩺"},
    {"name": "Servicios",       "icon": "⚡"},
    {"name": "Educación",       "icon": "📚"},
    {"name": "Ocio",            "icon": "🎮"},
    {"name": "Ropa",            "icon": "👕"},
    {"name": "Tecnología",      "icon": "💻"},
    {"name": "Mascotas",        "icon": "🐾"},
    {"name": "Deudas",          "icon": "💳"},
    {"name": "Ahorros",         "icon": "🏦"},
    {"name": "Salario",         "icon": "💼"},
    {"name": "Freelance",       "icon": "🛠️"},
    {"name": "Inversiones",     "icon": "📈"},
    {"name": "Otros",           "icon": "📦"},
]


class Command(BaseCommand):
    help = "Puebla la base de datos con las categorías del sistema predeterminadas."

    def handle(self, *args, **kwargs):
        created_count = 0
        skipped_count = 0

        for cat in SYSTEM_CATEGORIES:
            obj, created = Category.objects.get_or_create(
                name=cat["name"],
                category_type=Category.SYSTEM,
                owner=None,
                defaults={"icon": cat["icon"], "is_active": True},
            )
            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f"  [NUEVA]  {cat['name']}"))
            else:
                skipped_count += 1
                self.stdout.write(f"  [EXISTE] {cat['name']}")

        self.stdout.write(
            self.style.SUCCESS(
                f"\nSemilla completada: {created_count} creadas, {skipped_count} omitidas."
            )
        )
