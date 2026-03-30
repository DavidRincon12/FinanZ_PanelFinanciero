# Plan de Desarrollo - FinanZ

Este documento define la hoja de ruta técnica y las fases de desarrollo para el proyecto FinanZ. Está diseñado bajo los principios de coste cero de infraestructura, arquitectura modular, y alta disponibilidad (24/7).

---

## 🏗️ Fase 1: Arquitectura Base y Entorno (✅ Completada)

El objetivo de esta fase fue establecer los cimientos del proyecto utilizando las mejores prácticas de ingeniería de software moderno para facilitar la escalabilidad.

*   **Configuración del Entorno:** Entorno virtual, instalación de Django y manejo seguro de secretos con `django-environ` (`.env`).
*   **Estructura Modular (Apps):** Separación del sistema en bloques independientes:
    *   `users`: Identidad y perfil.
    *   `finance`: Motor de transacciones y categorías.
    *   `budget`: Control de límites visuales y alertas preventivas.
    *   `goals`: Seguimiento a metas de ahorro.
*   **Configuración Multi-Entorno:** Archivos `settings` divididos (`base.py`, `local.py`, `production.py`). La BD actual (SQLite) se configuró en `local.py` **exclusivamente para pruebas rápidas de desarrollo**.
*   **Modelado de Datos:** Definición de `CustomUser`, Tablas transaccionales, metas y notificaciones.
*   **Capa de Servicios:** Aislamiento de la lógica de negocio (consultas agregadas, validaciones de saldo) separada de las vistas HTTP.

---

## 🔐 Fase 2: Autenticación Social y Base de Datos Externa en la Nube

Para garantizar que el sistema esté disponible 24/7 sin dependencias locales y mantener el coste en $0, esta fase conecta el proyecto a la nube.

*   **Migración a Base de Datos Externa (PostgreSQL):**
    *   Creación de un clúster de base de datos en **Neon (Serverless Postgres)**: 100% gratuito, siempre disponible y escalable.
    *   Conexión de Django a la nueva base de datos mediante la variable `DATABASE_URL`.
    *   Ejecución de migraciones en la nube (la base de datos local dejará de ser la principal).
*   **Autenticación con Google (Firebase):**
    *   Configuración de un proyecto en **Firebase Console**.
    *   Implementación de identidad federada (Login con Google) para acceso rápido de un clic.
    *   Sincronización del token de Google con el modelo `CustomUser` de Django (creación de cuenta automática al iniciar sesión con Google).

---

## 💸 Fase 3: El Motor de Transacciones (Core MVP)

En esta fase el usuario ya podrá empezar a registrar dinero.

*   **Semilla de Datos (Seed data):** Categorías del sistema adaptadas a Colombia (Salud, Alimentación, Transporte, Arriendo, etc).
*   **Vistas de Registro Rápido:** Formularios optimizados para móviles para registrar gastos e ingresos en menos de 10 segundos.
*   **Gestión de Categorías:** Posibilidad para el usuario de crear categorías personalizadas con íconos emojis.
*   **Cálculo Dinámico:** Lógica que procese ingresos menos egresos en tiempo real usando selectores de base de datos. Puesta a punto de la lista (historial) de movimientos.

---

## 🎯 Fase 4: Inteligencia de Presupuestos y Metas

FinanZ deja de ser un "registro de gastos" y se convierte en una herramienta preventiva.

*   **Creación de Presupuestos:** Interfaces para definir topes mensuales máximos por categoría (Ej: Máximo $500,000 en Alimentación para Septiembre).
*   **Seguimiento de Metas:** Módulo donde el usuario crea proyectos de ahorro (Ej: "Viaje", "Fondo de Emergencia"), se le asigna un valor objetivo y se muestra una barra de progreso.

---

## 🚨 Fase 5: Automatización de Alertas y Dashboard Visual

El sistema toma un rol activo en la vida financiera del usuario, "empujándolo" (nudging) a tomar mejores decisiones mediante advertencias a tiempo.

*   **Despachador de Alertas (Signals):** Cada vez que se registra un gasto, el sistema verifica internamente el nivel del presupuesto.
*   **Notificaciones In-App y Email:**
    *   Al llegar al 80% del límite de presupuesto, se lanza advertencia preventiva.
    *   A llegar al 100%, se lanza advertencia crítica.
    *   Integración de proveedor SMTP (Brevo o Resend) con capa gratuita generosa para enviar correos transaccionales reales.
*   **Dashboard Financiero (Chart.js):**
    *   Gráfico de Torta: Distribución de gastos mensuales divididos por categoría.
    *   Gráfico de Líneas: Evolución mensual del balance general.

---

## 🚀 Fase 6: Despliegue a Producción (Costo Cero)

Se saca la aplicación al internet público, dejándola funcional, segura y lista para usarse desde cualquier celular.

*   **Hosting del Servidor:** Despliegue del código backend en **Render** (Capa gratuita para servicios web).
*   **Gestión de Archivos Estáticos:** Configuración de `WhiteNoise` para que Django sirva correctamente el CSS, JS y librerías de interfaz sin necesidad de Nginx u otros servidores de pago.
*   **Seguimiento y Ajustes Finales:** Forzado de protocolo HTTPS y verificación del flujo completo de inicio de sesión con Google en producción.
