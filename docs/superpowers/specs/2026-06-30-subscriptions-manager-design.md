# Documento de Diseño: Gestor de Suscripciones y Pagos Recurrentes para FinanZ

**Fecha:** 2026-06-30  
**Autor:** Antigravity  
**Estado:** Aprobado por el usuario  

---

## 1. Introducción y Contexto

Este documento especifica el diseño y la implementación del **Gestor de Suscripciones y Pagos Recurrentes** para la plataforma **FinanZ**. El objetivo es permitir que los usuarios tengan un control proactivo de sus gastos fijos y recurrentes (servicios de streaming, alquileres, mensualidades de gimnasios, etc.), proyecten su flujo de caja y reciban notificaciones automatizadas antes de que se realicen los cobros.

La implementación constará de una extensión del backend de Django (`apps/finance`) para el modelo de datos, controladores de negocio y envío de correos, y una nueva página dedicada (`/subscriptions`) en el frontend de React para la administración e interacción del usuario con sus suscripciones en formato de tabla compacta y widgets interactivos.

---

## 2. Requerimientos

### 2.1 Requerimientos Funcionales
1. **Gestión de Suscripciones (CRUD):**
   * Crear, ver, actualizar y eliminar suscripciones.
   * Campos a registrar: Nombre del servicio, Monto, Categoría asociada, Frecuencia, Fecha de Inicio, Fecha del siguiente cobro, Tipo de pago (Automático o Manual) y Días de aviso anticipado.
2. **Ciclos de Facturación Múltiples:**
   * Soportar las frecuencias: *Semanal, Mensual, Trimestral, Semestral y Anual*.
3. **Flujo de Ejecución Dual:**
   * **Pago Automático (Auto-pay):** El sistema crea el registro de gasto (`Transaction`) automáticamente en la fecha de pago y actualiza el saldo del usuario.
   * **Confirmación Manual (Manual Pay):** El sistema muestra el cobro como "Pendiente" y requiere que el usuario haga clic en un botón para registrar el gasto en su historial.
4. **Controles Flexibles:**
   * **Pausar/Reanudar:** Detener temporalmente el procesamiento de una suscripción sin eliminarla de la base de datos.
   * **Omitir Pago (Skip):** Saltar el cobro del periodo actual (avanzar la fecha de cobro al siguiente ciclo) sin registrar transacciones de gasto.
5. **Notificaciones y Alertas:**
   * Correo transaccional de aviso preventivo ($X$ días antes del cobro).
   * Correo transaccional el mismo día del cobro (confirmando el registro automático o recordando la confirmación manual).

### 2.2 Requerimientos Técnicos
1. **Ejecución del Motor de Suscripciones:**
   * **Enfoque Principal (Cron Job Externo):** Endpoint REST `/api/subscriptions/process-cron/` seguro que será consumido una vez al día por un servicio externo (como cron-job.org o GitHub Actions).
   * **Enfoque de Respaldo (Lazy Checking):** Al iniciar sesión o cargar el Dashboard, si el cron externo no se ha ejecutado hoy para el usuario, el backend procesa silenciosamente sus suscripciones.
2. **Seguridad del Endpoint del Cron:**
   * El endpoint del cron debe exigir una cabecera de autenticación (`Authorization: Bearer <CRON_SECRET>`) para evitar llamadas malintencionadas.
3. **Aislamiento Multi-inquilino (Multi-tenant):**
   * Filtrar rigurosamente todas las consultas en base al usuario autenticado.

---

## 3. Modelo de Datos (Backend)

Agregaremos el modelo `Subscription` dentro de la aplicación `finance` (`backend/apps/finance/models.py`).

```python
from django.db import models
from django.conf import settings
from django.utils import timezone

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
        'Category',
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
        return f"{self.name} - ${self.amount} ({self.get_frequency_display()})"
```

### Cálculo del Siguiente Periodo (Lógica del Modelo)
Para avanzar `next_billing_date`, implementaremos un helper en Python usando `relativedelta` de `dateutil` (o manejo nativo de fechas) para calcular con exactitud:
* **`weekly`**: fecha + 7 días.
* **`monthly`**: fecha + 1 mes.
* **`quarterly`**: fecha + 3 meses.
* **`semiannually`**: fecha + 6 meses.
* **`annually`**: fecha + 1 año.

---

## 4. Diseño de la API (Endpoints)

Todos los endpoints (a excepción del cron) requerirán autenticación y se registrarán en `backend/apps/finance/urls.py`.

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/subscriptions/` | Lista todas las suscripciones del usuario (separadas por estado y agregando estadísticas globales). |
| `POST` | `/api/subscriptions/` | Crea una nueva suscripción y calcula su primer `next_billing_date`. |
| `PATCH/PUT`| `/api/subscriptions/<id>/` | Modifica una suscripción (pausar, cambiar monto, etc.). |
| `DELETE` | `/api/subscriptions/<id>/` | Elimina la suscripción. |
| `POST` | `/api/subscriptions/<id>/confirm/` | Confirma manualmente el pago pendiente. Registra una `Transaction` de egreso y calcula el siguiente vencimiento. |
| `POST` | `/api/subscriptions/<id>/skip/` | Omite el pago actual. Avanza la fecha de cobro al siguiente ciclo sin registrar transacciones. |
| `POST` | `/api/subscriptions/process-cron/` | Endpoint global del Cron diario. Requiere token de seguridad `CRON_SECRET` en cabeceras. |

---

## 5. Diseño Frontend (React + TypeScript)

### 5.1 Barra de Navegación Lateral
* Se agregará un enlace al menú lateral en `frontend/src/components/Sidebar.tsx` que apunte a `/subscriptions` con el icono `CreditCard` (de Lucide-React).

### 5.2 Estructura de la Vista `Subscriptions.tsx`
1. **Widgets de Métrica Superior (Grid de 3 columnas):**
   * **Compromiso Mensual:** Suma mensualizada de todas las suscripciones activas.
   * **Estado de Suscripciones:** Cantidad de suscripciones activas / total.
   * **Próximo Vencimiento:** Nombre del servicio más cercano a vencer y días restantes.
2. **Panel de Alertas Pendientes (Solo visible si hay cobros en espera):**
   * Se muestra si alguna suscripción manual tiene `next_billing_date <= hoy`.
   * Tarjeta de alerta color amarillo/ámbar indicando que el cobro está pendiente.
   * Botones rápidos: **Confirmar Pago** (crea el gasto) y **Omitir** (avanza el ciclo).
3. **Tabla Compacta de Suscripciones (Main List):**
   * Estilo limpio y profesional usando Tailwind CSS v4.
   * Columnas: Servicio (Nombre + Emoji), Categoría (Badge coloreado), Costo (Monto + frecuencia), Siguiente Cobro (Fecha formateada con contador de días), Auto-Pago (Switch para activar/desactivar auto-pago) y Estado (Switch Activo/Pausado).
   * Botón de editar y eliminar al final de cada fila.
4. **Modal de Creación y Edición:**
   * Modal interactivo que utiliza los componentes de formulario del sistema.
   * Selectores integrados para la categoría y la frecuencia.

---

## 6. Seguridad y Control de Errores

### 6.1 Prevención de Doble Facturación
El backend validará que no se registre una transacción automática duplicada para la misma suscripción y fecha mediante la comprobación del campo `last_processed_date` del modelo `Subscription`. Este campo se actualizará con la fecha del día procesado para blindar al sistema de peticiones cron consecutivas o reintentos del servidor.

### 6.2 Cascade Delete Guard
La relación con el modelo `Category` utiliza `on_delete=models.SET_NULL`. Si se elimina una categoría, las suscripciones vinculadas no se verán afectadas y su campo quedará vacío, evitando la pérdida de registros.

### 6.3 Restricción de Datos
Todos los ViewSets de Django filtrarán el QuerySet inicial usando `self.request.user`, garantizando aislamiento absoluto de los datos en entornos multi-inquilino.

---

## 7. Estrategia de Pruebas

1. **Pruebas de Lógica de Negocio (Backend):**
   * Validar que la función helper calcule correctamente los saltos de fecha para años bisiestos y finales de mes (ej. registrar mensual el 31 de enero debe saltar al 28 de febrero).
   * Probar el procesamiento del cron con mocks para el servicio de correo, verificando que se creen las transacciones automáticas.
2. **Pruebas de Seguridad en la API:**
   * Verificar que peticiones sin cabecera o con cabecera inválida a `/api/subscriptions/process-cron/` retornen `403 Forbidden`.
   * Comprobar que no se puedan modificar suscripciones de otros usuarios.
3. **Pruebas de Interfaz (Frontend):**
   * Validar que los switches de "Activo/Pausado" y "Auto-pago" envíen las peticiones API correctas y actualicen el estado visual al instante.
