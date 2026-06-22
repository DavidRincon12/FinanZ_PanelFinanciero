# Centro de Transacciones Avanzado - Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement server-side filtering, search, and dynamic CSV bulk import for transactions in FinanZ.

**Architecture:** Extend selectors and services in the Django backend with filtering and atomic bulk creation. Update the React frontend to support a debounced filter panel and a dynamic step-by-step CSV parsing/mapping wizard.

**Tech Stack:** Django, PostgreSQL (Neon), React, TypeScript, Tailwind CSS / Vanilla CSS.

## Global Constraints
*   All backend changes must verify successfully using Django tests (`python manage.py test`).
*   All frontend changes must compile cleanly under TypeScript and build successfully (`npm run build`).
*   Database modifications must be executed inside transaction blocks to prevent corrupt or duplicate records.

---

### Task 1: Backend Selectors & URL Filtering

**Files:**
- Modify: `backend/services/finance_selectors.py`
- Modify: `backend/apps/finance/views.py`
- Test: `backend/apps/finance/tests.py` (or create if not present)

**Interfaces:**
- Consumes: None (Updates existing database queries)
- Produces: Updated `get_user_transactions` query method with search/filter parameters, and updated `/api/transactions/` GET API endpoint.

- [ ] **Step 1: Write the failing test**

Modify or create tests in `backend/apps/finance/tests.py` to assert filtering behavior:
```python
from django.test import TestCase
from django.contrib.auth import get_user_model
from apps.finance.models import Transaction, Category
from services.finance_selectors import get_user_transactions
import datetime

class TransactionFilterTestCase(TestCase):
    def setUp(self):
        User = get_user_model()
        self.user = User.objects.create_user(username="testuser", email="test@test.com", password="pass")
        self.cat1 = Category.objects.create(name="Alimentación", owner=self.user)
        self.cat2 = Category.objects.create(name="Transporte", owner=self.user)
        Transaction.objects.create(user=self.user, amount=10, transaction_type="expense", category=self.cat1, description="Almuerzo", date=datetime.date(2026, 6, 1))
        Transaction.objects.create(user=self.user, amount=20, transaction_type="expense", category=self.cat2, description="Uber", date=datetime.date(2026, 6, 10))

    def test_filter_by_search(self):
        txs = get_user_transactions(self.user, search="Uber")
        self.assertEqual(txs.count(), 1)
        self.assertEqual(txs[0].description, "Uber")
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python manage.py test apps.finance.tests`
Expected: Fail because `get_user_transactions` does not yet accept the `search` keyword argument.

- [ ] **Step 3: Write minimal implementation**

Update `backend/services/finance_selectors.py`:
```python
def get_user_transactions(
    user: "CustomUser",
    search: str = None,
    category_id: int = None,
    transaction_type: str = None,
    start_date: str = None,
    end_date: str = None,
):
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

Update `/api/transactions/` endpoint in `backend/apps/finance/views.py`:
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

- [ ] **Step 4: Run test to verify it passes**

Run: `python manage.py test apps.finance.tests`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/services/finance_selectors.py backend/apps/finance/views.py backend/apps/finance/tests.py
git commit -m "feat: add server-side search and filters to transactions endpoint"
```

---

### Task 2: Backend Bulk Create API

**Files:**
- Modify: `backend/services/finance_service.py`
- Modify: `backend/apps/finance/views.py`
- Modify: `backend/apps/finance/urls.py`
- Test: `backend/apps/finance/tests.py`

**Interfaces:**
- Consumes: JSON array of transaction payloads.
- Produces: API endpoint `POST /api/transactions/bulk/` for bulk transaction generation.

- [ ] **Step 1: Write the failing test**

Add tests in `backend/apps/finance/tests.py` for bulk creation:
```python
    def test_bulk_create_atomic(self):
        payload = [
            {"amount": 100, "transaction_type": "expense", "description": "Row 1", "date": "2026-06-01"},
            {"amount": -50, "transaction_type": "expense", "description": "Invalid Row", "date": "invalid-date"}
        ]
        response = self.client.post("/api/transactions/bulk/", payload, content_type="application/json")
        self.assertEqual(response.status_code, 400)
        self.assertEqual(Transaction.objects.filter(user=self.user).count(), 2) # remains original count, no partial inserts
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python manage.py test apps.finance.tests`
Expected: Fail (404/NotFound or route missing).

- [ ] **Step 3: Write minimal implementation**

Update `backend/services/finance_service.py` adding `transactions_bulk_create`:
```python
from django.db import transaction

def transactions_bulk_create(user, data_list):
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
            tx.full_clean()
            transactions_to_create.append(tx)
            
        return Transaction.objects.bulk_create(transactions_to_create)
```

Add bulk API view in `backend/apps/finance/views.py`:
```python
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def transaction_bulk_create_api(request):
    try:
        transactions = finance_service.transactions_bulk_create(user=request.user, data_list=request.data)
        serializer = TransactionSerializer(transactions, many=True)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
```

Register endpoint in `backend/apps/finance/urls.py`:
```python
path("transactions/bulk/", views.transaction_bulk_create_api, name="transaction_bulk_create_api"),
```

- [ ] **Step 4: Run test to verify it passes**

Run: `python manage.py test apps.finance.tests`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/services/finance_service.py backend/apps/finance/views.py backend/apps/finance/urls.py backend/apps/finance/tests.py
git commit -m "feat: add bulk transactions creation service and endpoint with atomic rollback"
```

---

### Task 3: Frontend Filter Component & Search Bar

**Files:**
- Modify: `frontend/src/pages/Transactions.tsx`
- Modify: `frontend/src/services/api.ts`

**Interfaces:**
- Consumes: `api.getTransactions(filters?: object)`
- Produces: Debounced search, category and type selectors in UI.

- [ ] **Step 1: Write type definitions/signatures in API**

Update `frontend/src/services/api.ts` to forward query params:
```typescript
  getTransactions: async (filters?: {
    search?: string;
    category_id?: string;
    transaction_type?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<Transaction[]> => {
    const params = new URLSearchParams(filters as any).toString();
    const res = await fetch(`/api/transactions/?${params}`);
    if (!res.ok) throw new Error('Error fetching transactions');
    return res.json();
  },
```

- [ ] **Step 2: Add Filters UI and states in page**

Update `frontend/src/pages/Transactions.tsx` adding filter inputs and logic:
```typescript
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const data = await api.getTransactions({
        search: debouncedSearch,
        category_id: selectedCat,
        transaction_type: selectedType,
        start_date: startDate,
        end_date: endDate,
      });
      setTransactions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [debouncedSearch, selectedCat, selectedType, startDate, endDate]);
```
Add the visual filter container inside the return payload using responsive CSS grid fields (Lupa, Categorías, Tipo, Fechas, Reset).

- [ ] **Step 3: Verify build**

Run: `powershell -ExecutionPolicy Bypass -Command "npm run build"`
Expected: Build passes with no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/Transactions.tsx frontend/src/services/api.ts
git commit -m "feat: implement transaction filters and search bar on frontend"
```

---

### Task 4: Frontend CSV Importer Modal & Parsing Flow

**Files:**
- Create: `frontend/src/components/CsvImporter.tsx`
- Modify: `frontend/src/pages/Transactions.tsx`
- Modify: `frontend/src/services/api.ts`

**Interfaces:**
- Consumes: User CSV upload file.
- Produces: API call to `api.createBulkTransactions(transactions)`.

- [ ] **Step 1: Implement API service method**

Update `frontend/src/services/api.ts`:
```typescript
  createBulkTransactions: async (transactions: any[]): Promise<any> => {
    const res = await fetch('/api/transactions/bulk/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transactions),
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || 'Error uploading transactions');
    }
    return res.json();
  },
```

- [ ] **Step 2: Create CsvImporter Component**

Implement `frontend/src/components/CsvImporter.tsx` with a multi-step stepper:
1. **Upload File:** Native file input.
2. **Column Mapper:** Map CSV headings to Date, Description, Amount, Category.
3. **Review & Map Categories:** Normalizes dates (DD/MM/YYYY vs YYYY-MM-DD), positive/negative amounts, matches string categories to the user's category list IDs, and allows selecting manually.
4. **Submit:** Calls `api.createBulkTransactions(list)` and handles error/success status overlay.

- [ ] **Step 3: Integrate with Transactions Page**

Add "Importar CSV" button in `frontend/src/pages/Transactions.tsx` to open/close the `<CsvImporter />` modal.

- [ ] **Step 4: Verify build**

Run: `powershell -ExecutionPolicy Bypass -Command "npm run build"`
Expected: Build passes successfully.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/CsvImporter.tsx frontend/src/pages/Transactions.tsx frontend/src/services/api.ts
git commit -m "feat: implement step-by-step dynamic CSV importer wizard and category mapper"
```
