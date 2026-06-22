# Especificación de Diseño: Centro de Transacciones Avanzado (Filtros y Carga de CSV)

Este documento detalla el diseño técnico para la implementación de búsquedas y filtrados avanzados, así como el importador dinámico de archivos CSV en la aplicación **FinanZ**.

## 1. Objetivos del Sistema
*   **Filtros y Búsqueda:** Permitir que los usuarios filtren transacciones por descripción, categoría, tipo y rango de fechas a nivel de base de datos para garantizar la escalabilidad.
*   **Importador CSV Dinámico:** Permitir la subida de estados de cuenta en formato CSV de cualquier entidad bancaria, posibilitando al usuario mapear manualmente las columnas del archivo e importar transacciones en lote de forma segura y atómica.

---

## 2. Arquitectura & Backend (Django)

### 2.1 Actualización de Selectores (`finance_selectors.py`)
Modificaremos la función `get_user_transactions` para admitir filtros opcionales sobre el queryset:

```python
def get_user_transactions(
    user: "CustomUser",
    search: str = None,
    category_id: int = None,
    transaction_type: str = None,
    start_date: str = None,
    end_date: str = None,
):
    """
    Retorna transacciones del usuario aplicando filtros dinámicos.
    """
    queryset = Transaction.objects.filter(user=user).select_related("category")
    
    if search:
        queryset = queryset.filter(description__icontains=search)
    if category_id:
        queryset = queryset.filter(category_id=category_id)
    if transaction_type:
        queryset = queryset.filter(transaction_type=transaction_type)
    if start_date:
        queryset = queryset.filter(date__gte=start_date)
    if end_date:
        queryset = queryset.filter(date__lte=end_date)
        
    return queryset
```

### 2.2 API de Filtros (`finance/views.py`)
El endpoint actual `transaction_list_api` (`GET /api/transactions/`) se modificará para recibir los query parameters y transmitirlos al selector:

```python
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def transaction_list_api(request):
    search = request.query_params.get('search')
    category_id = request.query_params.get('category_id')
    transaction_type = request.query_params.get('transaction_type')
    start_date = request.query_params.get('start_date')
    end_date = request.query_params.get('end_date')
    
    transactions = finance_selectors.get_user_transactions(
        user=request.user,
        search=search,
        category_id=category_id,
        transaction_type=transaction_type,
        start_date=start_date,
        end_date=end_date
    )
    serializer = TransactionSerializer(transactions, many=True)
    return Response(serializer.data)
```

### 2.3 Creación Masiva (`POST /api/transactions/bulk/`)
Implementaremos un nuevo endpoint en el backend para procesar múltiples transacciones de forma atómica.

*   **URL:** `/api/transactions/bulk/`
*   **Método:** `POST`
*   **Cuerpo (Payload):**
    ```json
    [
      {
        "date": "2026-06-22",
        "amount": 45000.00,
        "transaction_type": "expense",
        "description": "Restaurante El Corral",
        "category_id": 5
      },
      {
        "date": "2026-06-21",
        "amount": 1200000.00,
        "transaction_type": "income",
        "description": "Nómina Junio",
        "category_id": 1
      }
    ]
    ```
*   **Lógica de Servicio (`finance_service.py`):**
    ```python
    from django.db import transaction
    
    def transactions_bulk_create(user, data_list):
        """
        Crea transacciones en lote de forma atómica.
        Retorna la lista de transacciones creadas.
        """
        transactions_to_create = []
        with transaction.atomic():
            for item in data_list:
                category_id = item.get("category_id")
                category = None
                if category_id:
                    category = Category.objects.get(pk=category_id, owner=user)
                    
                tx = Transaction(
                    user=user,
                    amount=item["amount"],
                    transaction_type=item["transaction_type"],
                    category=category,
                    description=item.get("description", ""),
                    date=item["date"]
                )
                tx.full_clean()  # Validación del modelo
                transactions_to_create.append(tx)
                
            return Transaction.objects.bulk_create(transactions_to_create)
    ```

---

## 3. Frontend (React / Vite)

### 3.1 Filtros Interactivos (`Transactions.tsx`)
Añadiremos un componente visual de filtros arriba de la lista de transacciones:
*   **Input de búsqueda** con debounce de 300ms para evitar peticiones repetitivas al escribir.
*   **Desplegables** para elegir Categoría y Tipo (Ingresos/Egresos/Todos).
*   **Selectores de fecha** de tipo nativo HTML (`type="date"`).
*   **Botón de reset** para restablecer la vista inicial.

### 3.2 Modal de Importación de CSV
Una modal interactiva tipo asistente (Stepper):
*   **Paso 1: Selector de Archivo:** Permite subir un archivo `.csv`.
*   **Paso 2: Mapeador de Columnas:**
    *   Lee la cabecera (primera línea del CSV).
    *   Muestra un desplegable para que el usuario elija qué columna mapea a: `Fecha`, `Descripción`, `Monto` y `Categoría` (opcional).
*   **Paso 3: Previsualización y Clasificación:**
    *   Procesa y normaliza los montos: limpia signos `$`, comas de miles y convierte números negativos o débitos a tipo `expense`.
    *   Mapea los textos de categoría al ID del sistema mediante coincidencias (ej: "comida" -> "Alimentación"). Si no se encuentra coincidencia, ofrece un desplegable de selección manual.
    *   El usuario puede desmarcar cualquier fila que no quiera subir.
*   **Paso 4: Envío:** Petición HTTP al endpoint `/api/transactions/bulk/` y recarga automática de la lista con notificaciones en pantalla.

---

## 4. Pruebas y Casos de Borde
1.  **Formatos de fecha variados:** Manejar tanto `YYYY-MM-DD` como `DD/MM/YYYY` en el analizador de fechas del frontend.
2.  **Archivos CSV corruptos o sin cabeceras:** Alertar al usuario si el archivo no tiene columnas elegibles.
3.  **Transacción atómica:** Probar que si se intenta insertar un lote donde un registro es inválido (ej: monto negativo o fecha rota), la base de datos se mantenga sin cambios y se retorne un error claro.
