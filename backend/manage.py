#!/usr/bin/env python
"""
FinanZ – Django management utility.
El entorno se controla con la variable DJANGO_SETTINGS_MODULE en el archivo .env
que django-environ carga automáticamente desde base.py.
"""
import os
import sys


def main():
    # Por defecto usa settings de desarrollo local
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.local")
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "No se pudo importar Django. ¿El entorno virtual está activado?\n"
            "Actívalo con:  .venv\\Scripts\\activate  (Windows)\n"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == "__main__":
    main()
