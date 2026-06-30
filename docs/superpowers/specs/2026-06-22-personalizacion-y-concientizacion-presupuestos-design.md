# Documento de Diseño: Personalización, Concientización Financiera y Rediseño de Presupuestos
**Fecha:** 2026-06-22  
**Autor:** Antigravity  
**Estado:** Aprobado por el usuario  

---

## 1. Introducción y Contexto
Este documento de diseño especifica la implementación de mejoras y depuración para el software **FinanZ**. El objetivo es enriquecer la experiencia de usuario agregando un flujo de personalización basado en el perfil financiero de la persona, un panel de concientización sobre sobregastos históricos, y una renovación visual premium de la sección de presupuestos. Asimismo, se corregirán múltiples errores y advertencias de rendimiento/seguridad detectados en la consola del navegador.

---

## 2. Requerimientos

### 2.1 Requerimientos Funcionales
1. **Encuesta de Bienvenida / Personalización:**
   - Mostrar un modal interactivo en el Dashboard si el usuario no ha completado su perfil financiero.
   - Capturar: Actividad/Ocupación (Estudiante, Empleado, Independiente, etc.), Gustos/Categorías preferidas (Tecnología, Restaurantes, etc.) e Ingresos Mensuales Estimados.
2. **Dashboard Adaptativo:**
   - Mostrar consejos financieros dinámicos y contextuales según la ocupación y gustos del usuario.
   - Proponer un presupuesto sugerido basado en la regla del 50/30/20 calculado automáticamente a partir de sus ingresos declarados (si no cuenta con presupuestos activos).
3. **Panel de Concientización Financiera:**
   - Incluir un gráfico de comparación mensual (Recharts) que muestre el Límite de Presupuesto vs Gasto Real de los últimos 6 meses.
   - Resaltar en color rojo brillante los meses en los que el usuario excedió su presupuesto consolidado.
   - Mostrar un historial detallado de alertas previas ocurridas en la cuenta, con mensajes motivadores comparativos basados en su progreso.
4. **Rediseño Premium de Presupuestos:**
   - Reemplazar la lista simple por un grid de tarjetas estilizadas con micro-animaciones (Framer Motion) y gradientes de color según el porcentaje de consumo.
   - Añadir un widget superior con el total presupuestado, consumido y restante.
   - Permitir filtrar por estado de alerta y navegar a través de presupuestos de meses anteriores.

### 2.2 Requerimientos Técnicos (Depuración)
1. **Compilación Nativa de Tailwind CSS v4:**
   - Eliminar el script de CDN externa y configurar `@tailwindcss/vite` como plugin en el frontend para optimizar la velocidad.
2. **Dimensiones de Recharts:**
   - Corregir el warning de dimensiones negativas en el ResponsiveContainer.
3. **Autocompletado de Formularios:**
   - Añadir atributos `autocomplete` correctos en los formularios de Login y Registro.
4. **Inicialización Única de Google Sign-In:**
   - Asegurar que el SDK de Google Identity Services se inicialice exactamente una vez por ciclo de vida de la aplicación.

---

## 3. Arquitectura del Sistema y Cambios Propuestos

### 3.1 Base de Datos y Backend (Django)

#### Modificaciones al Modelo `CustomUser`
En `backend/apps/users/models.py`:
```python
class CustomUser(AbstractUser):
    # Campos existentes...
    monthly_budget = models.DecimalField(...)
    
    # Nuevos campos de personalización
    personal_activity = models.CharField(
        max_length=20,
        choices=[
            ("student", "Estudiante"),
            ("employee", "Empleado"),
            ("freelancer", "Independiente"),
            ("unemployed", "En búsqueda"),
            ("retired", "Jubilado"),
        ],
        blank=True,
        null=True,
        verbose_name="Actividad Personal"
    )
    tastes = models.CharField(
        max_length=255,
        blank=True,
        default="",
        verbose_name="Intereses y Gustos"
    )
    monthly_income = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0.00,
        verbose_name="Ingresos Mensuales"
    )
    is_survey_completed = models.BooleanField(
        default=False,
        verbose_name="Encuesta Completada"
    )
```

#### Endpoints de la API
* **`api/me/`:** Modificado para retornar los campos `personal_activity`, `tastes`, `monthly_income` e `is_survey_completed`.
* **`api/profile/update/`:** Permitirá actualizar estos campos y marcará `is_survey_completed = True`.

---

### 3.2 Frontend (React & TypeScript)

#### Flujo del Modal de Encuesta (`Dashboard.tsx`)
1. Al renderizar el Dashboard, se evalúa si `user.is_survey_completed` es falso.
2. Se renderiza un modal sobre la pantalla usando `AnimatePresence` de Framer Motion.
3. El modal recolecta los datos en 3 pantallas y, al finalizar, los envía al backend por medio de la llamada API `api.updateProfile()`.

#### Estilo Visual Premium en Presupuestos (`Budgets.tsx`)
* **Grid Layout:** `.grid.grid-cols-1.md:grid-cols-2.lg:grid-cols-3.gap-6`
* **Glow & Glassmorphism:** Fondo blanco semi-transparente con sombras difusas, bordes `rounded-3xl` e íconos más atractivos.
* **Barra de Progreso:** Gradiente dinámico utilizando variables CSS personalizadas que cambian en base al porcentaje consumido.

#### Depuración de Errores de Consola
* **Tailwind v4:**
  * Instalar `@tailwindcss/vite`.
  * Modificar `vite.config.ts` agregando `import tailwindcss from '@tailwindcss/vite'` y cargando `tailwindcss()` in the array `plugins`.
  * Modificar `src/index.css` agregando `@import "tailwindcss";` al inicio.
  * Eliminar el script de Tailwind en `index.html`.
* **ResponsiveContainer:**
  * Modificar los componentes `<ResponsiveContainer>` de `Dashboard.tsx` para agregar `minWidth={0}` y `minHeight={0}`.
* **Google Sign-In:**
  * Proteger con una variable global `window.googleInitialized = true` para evitar reinicializaciones molestas.
* **Formularios de Contraseña:**
  * Agregar `autoComplete="current-password"` en `Login.tsx` y `autoComplete="new-password"` en `Register.tsx`.

---

## 4. Plan de Pruebas y Validación
1. **Prueba de Autenticación:** Verificar que el formulario de Login y Registro se completen sin warnings de autocompletado en la consola.
2. **Prueba de Inicialización de Google:** Confirmar que no aparezcan alertas de `initialize()` duplicadas al recargar la pantalla de login en desarrollo.
3. **Prueba de Encuesta:** Crear una nueva cuenta o reiniciar `is_survey_completed` a falso, verificar que el modal aparezca, se pueda completar correctamente y persista el estado en la base de datos de SQLite.
4. **Prueba de Recomendaciones:** Verificar que los tips en el Dashboard cambien de acuerdo a la ocupación seleccionada.
5. **Prueba de Gráficos:** Confirmar que no aparezca el aviso de ancho/alto `-1` en la consola al renderizar el Dashboard.
