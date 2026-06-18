#!/usr/bin/env bash
# ============================================================
# FinanZ – Script de Build para Render
# Se ejecuta automáticamente en cada deploy.
# ============================================================
set -o errexit   # Detener si un comando falla

echo "==> Instalando dependencias de producción..."
pip install --upgrade pip
pip install -r requirements/production.txt

echo "==> Recopilando archivos estáticos..."
python manage.py collectstatic --no-input

echo "==> Aplicando migraciones..."
python manage.py migrate --no-input

echo "==> Build completado exitosamente ✅"
