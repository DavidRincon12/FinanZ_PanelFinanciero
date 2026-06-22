# Fix Task 1 Review Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the date validation, tests decimal inputs, and comments encoding in the finance application backend.

**Architecture:** Add standard datetime parsing to API GET params in views, convert numeric amounts in tests to string decimals, and normalize files to UTF-8 without weird character sequences.

**Tech Stack:** Django, Python, Django REST Framework.

## Global Constraints
- Target python files must have valid syntax and run without syntax errors.
- Ensure all tests pass successfully.
- Fix all Spanish character encoding issues in comments and strings of views.py, finance_selectors.py, and tests.py.

---

### Task 1: Views Date Validation

**Files:**
- Modify: `backend/apps/finance/views.py:102-127`
- Test: `backend/apps/finance/tests.py`

- [ ] **Step 1: Update transaction_list_api to parse start_date and end_date**
  Modify the `transaction_list_api` function in `backend/apps/finance/views.py` to validate and parse date strings:
  ```python
  from datetime import datetime
  # Inside transaction_list_api:
  if start_date:
      try:
          datetime.strptime(start_date, '%Y-%m-%d')
      except ValueError:
          start_date = None

  if end_date:
      try:
          datetime.strptime(end_date, '%Y-%m-%d')
      except ValueError:
          end_date = None
  ```

- [ ] **Step 2: Add unit tests for invalid date parameters**
  Add test cases in `backend/apps/finance/tests.py` to verify that invalid dates do not cause 500 error but instead fallback to `None` gracefully.
  ```python
  def test_filter_by_invalid_date_format(self):
      response = self.client.get(self.api_url, {"start_date": "invalid-date", "end_date": "2026-13-45"})
      self.assertEqual(response.status_code, 200)
  ```

- [ ] **Step 3: Run the test suite and verify success**
  Run: `cmd /c "set DATABASE_URL=sqlite:///db_test.sqlite3 && .venv\Scripts\python backend/manage.py test apps.finance --settings=config.settings.local"`
  Expected: All tests pass.

- [ ] **Step 4: Commit views changes**
  Run:
  ```bash
  git add backend/apps/finance/views.py backend/apps/finance/tests.py
  git commit -m "fix: validate date parameters in transaction list api view"
  ```

### Task 2: Decimal Construction in Tests

**Files:**
- Modify: `backend/apps/finance/tests.py`

- [ ] **Step 1: Replace float values with string values for amount parameters**
  In `backend/apps/finance/tests.py`, update `amount=10.00` to `amount="10.00"`, `amount=20.00` to `amount="20.00"`, and `amount=100.00` to `amount="100.00"`.

- [ ] **Step 2: Verify tests still pass**
  Run: `cmd /c "set DATABASE_URL=sqlite:///db_test.sqlite3 && .venv\Scripts\python backend/manage.py test apps.finance --settings=config.settings.local"`
  Expected: All tests pass.

- [ ] **Step 3: Commit tests changes**
  Run:
  ```bash
  git add backend/apps/finance/tests.py
  git commit -m "fix: update amount construction in tests to use strings instead of floats"
  ```

### Task 3: Encoding Fixes

**Files:**
- Modify: `backend/apps/finance/views.py`, `backend/services/finance_selectors.py`, `backend/apps/finance/tests.py`

- [ ] **Step 1: Add encoding headers and clean up non-ascii characters if necessary**
  Add `# -*- coding: utf-8 -*-` at the top of the modified files. Replace mathematical symbols like `Σ` with standard ASCII descriptions (e.g. `Sumatoria` or `sum`) to avoid cp1252 encoding crashes.

- [ ] **Step 2: Run the test suite to ensure no regressions**
  Run: `cmd /c "set DATABASE_URL=sqlite:///db_test.sqlite3 && .venv\Scripts\python backend/manage.py test apps.finance --settings=config.settings.local"`
  Expected: All tests pass.

- [ ] **Step 3: Commit encoding changes**
  Run:
  ```bash
  git add backend/apps/finance/views.py backend/services/finance_selectors.py backend/apps/finance/tests.py
  git commit -m "fix: resolve encoding issues in comments and strings"
  ```
