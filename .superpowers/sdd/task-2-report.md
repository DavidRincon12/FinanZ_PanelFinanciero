# Task 2 Report: Service Layer & Business Logic (`finance_service.py`)

## Implementation Details

We successfully implemented the core service operations for managing subscriptions under `backend/services/finance_service.py`.

Specifically, we added:
1. `calculate_next_billing_date(current_date: datetime.date, frequency: str) -> datetime.date`: A helper that robustly computes the next billing date based on `weekly`, `monthly`, `quarterly`, `semiannually`, or `annually` intervals. It handles variable month lengths and leap years correctly.
2. `subscription_create(user: CustomUser, data: dict) -> Subscription`: A service method to instantiate and save a new `Subscription` database object, validating dates and numeric conversion on `amount`.
3. `subscription_confirm(user: CustomUser, subscription_id: int) -> Transaction`: A service method wrapped in a database transaction (`db_transaction.atomic()`) that confirms a pending payment, spawns a corresponding expense `Transaction` record, and advances the next billing date by updating `last_processed_date` and `next_billing_date`.
4. `subscription_skip(user: CustomUser, subscription_id: int) -> None`: A service method that skips the current billing period, advancing `next_billing_date` and setting `last_processed_date` without registering a transaction.

---

## TDD Evidence

### 1. RED Phase (Failing Tests)
**Command Run:**
```bash
python backend/manage.py test apps.finance.tests.SubscriptionServiceTest --keepdb
```

**Failing Output snippet:**
```text
Using existing test database for alias 'default'...
System check identified some issues:

WARNINGS:
?: (staticfiles.W004) The directory 'C:\Users\David\Documents\GitHub\FinanZ_PanelFinanciero\frontend\static' in the STATICFILES_DIRS setting does not exist.

System check identified 1 issue (0 silenced).
EEEE
======================================================================
ERROR: test_calculate_next_billing_date (apps.finance.tests.SubscriptionServiceTest.test_calculate_next_billing_date)
----------------------------------------------------------------------
Traceback (most recent call last):
  File "C:\Users\David\Documents\GitHub\FinanZ_PanelFinanciero\backend\apps\finance\tests.py", line 208, in test_calculate_next_billing_date
    self.assertEqual(finance_service.calculate_next_billing_date(start, 'weekly'), datetime.date(2026, 6, 8))
                     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
AttributeError: module 'services.finance_service' has no attribute 'calculate_next_billing_date'

======================================================================
ERROR: test_subscription_confirm_service (apps.finance.tests.SubscriptionServiceTest.test_subscription_confirm_service)
----------------------------------------------------------------------
Traceback (most recent call last):
  File "C:\Users\David\Documents\GitHub\FinanZ_PanelFinanciero\backend\apps\finance\tests.py", line 235, in test_subscription_confirm_service
    tx = finance_service.subscription_confirm(self.user, sub.id)
         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
AttributeError: module 'services.finance_service' has no attribute 'subscription_confirm'

======================================================================
ERROR: test_subscription_create_service (apps.finance.tests.SubscriptionServiceTest.test_subscription_create_service)
----------------------------------------------------------------------
Traceback (most recent call last):
  File "C:\Users\David\Documents\GitHub\FinanZ_PanelFinanciero\backend\apps\finance\tests.py", line 224, in test_subscription_create_service
    sub = finance_service.subscription_create(self.user, data)
          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
AttributeError: module 'services.finance_service' has no attribute 'subscription_create'

======================================================================
ERROR: test_subscription_skip_service (apps.finance.tests.SubscriptionServiceTest.test_subscription_skip_service)
----------------------------------------------------------------------
Traceback (most recent call last):
  File "C:\Users\David\Documents\GitHub\FinanZ_PanelFinanciero\backend\apps\finance\tests.py", line 248, in test_subscription_skip_service
    finance_service.subscription_skip(self.user, sub.id)
    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
AttributeError: module 'services.finance_service' has no attribute 'subscription_skip'

----------------------------------------------------------------------
Ran 4 tests in 8.438s

FAILED (errors=4)
```

**Why Failure Was Expected:**
The tests look for the four newly defined functions under `services.finance_service` (`calculate_next_billing_date`, `subscription_create`, `subscription_confirm`, and `subscription_skip`). Since we had only defined `SubscriptionServiceTest` inside `backend/apps/finance/tests.py` and had not written these implementations in `backend/services/finance_service.py`, python threw `AttributeError`.

---

### 2. GREEN Phase (Passing Tests)
**Command Run:**
```bash
python backend/manage.py test apps.finance.tests.SubscriptionServiceTest --keepdb
```

**Passing Output:**
```text
Using existing test database for alias 'default'...
System check identified some issues:

WARNINGS:
?: (staticfiles.W004) The directory 'C:\Users\David\Documents\GitHub\FinanZ_PanelFinanciero\frontend\static' in the STATICFILES_DIRS setting does not exist.

System check identified 1 issue (0 silenced).
.Subscription confirmed: id=5, transaction created: id=21
.Subscription created: id=6 user=17 name=HBO Max
.Subscription skipped: id=7
.
----------------------------------------------------------------------
Ran 4 tests in 9.723s

OK
Preserving test database for alias 'default'...
Found 4 test(s).
```

### 3. Full Test Suite Validation
We ran the entire test suite covering all applications (`finance`, `budget`, `goals`, `users`):
```bash
python backend/manage.py test apps.finance apps.budget apps.goals apps.users --keepdb
```
**Results:**
```text
Ran 20 tests in 97.693s

OK
```
All existing tests and new service tests are green and passing.

---

## Files Changed
- `backend/services/finance_service.py`: Added core subscription logic methods and imported necessary utilities/models.
- `backend/apps/finance/tests.py`: Added the `SubscriptionServiceTest` suite to verify business operations and integration.

---

## Self-Review Findings
- **Completeness:** Checked all target features in the Task 2 brief. The next billing date updates, database transactions, model constraints, and date parsing are fully covered.
- **Quality:** Followed strict typing annotations and used Django standard models/transactions. Clean docstrings and logging statements are kept.
- **Discipline:** No extraneous code or extra packages were installed.
- **Testing:** 4/4 new test cases cover exact edge cases (weekly/monthly/quarterly/semiannually/annually intervals, transaction insertion on confirmation, date skipping) and validation. Output is clean.

---

## Concerns or Issues
None.
