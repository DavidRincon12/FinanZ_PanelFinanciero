# Task 1 Report: Backend Selectors & URL Filtering

## Status
- **Status**: Completed successfully.
- **Commit**: `0b34e23` ("feat: add server-side search and filters to transactions endpoint")

## Implementation Details
1. **Selector Changes**:
   - Modified `get_user_transactions` in [finance_selectors.py](file:///C:/Users/David/Documents/GitHub/FinanZ_PanelFinanciero/backend/services/finance_selectors.py) to accept optional filter/search arguments: `search`, `category_id`, `transaction_type`, `start_date`, and `end_date`.
   - Applied these arguments conditionally using standard Django queryset filters.
2. **API View Changes**:
   - Updated the `transaction_list_api` endpoint in [views.py](file:///C:/Users/David/Documents/GitHub/FinanZ_PanelFinanciero/backend/apps/finance/views.py).
   - Extracted optional query parameters from `request.query_params` and passed them safely (with numeric conversion handling for `category_id`) to the `get_user_transactions` selector.
3. **Tests**:
   - Created the [tests.py](file:///C:/Users/David/Documents/GitHub/FinanZ_PanelFinanciero/backend/apps/finance/tests.py) file inside `apps/finance/` using Django's standard `TestCase` class.
   - Wrote 5 tests assessing search, category, type, date range, and combined queries for both selectors and the HTTP API endpoints.

## Test Execution Summary
- **Command Run**: `python manage.py test --keepdb --noinput`
- **Result**: `OK` (9 tests ran, all passed)
- **Time Elapsed**: ~54 seconds

## Concerns / Notes
- None. The backend filters are robust and safe.

## Post-Review Fixes Applied
1. **Views date validation**: Added logic to `transaction_list_api` in `views.py` that validates `start_date` and `end_date` using `datetime.strptime(val, '%Y-%m-%d')`. Failing to parse falls back to `None` to prevent 500 server errors on queryset evaluation.
2. **Decimal construction in tests**: Updated `setUp` transaction instantiation amounts in `tests.py` to use strings (e.g. `"10.00"`) instead of raw float numbers, avoiding float conversion errors.
3. **Encoding fixes**:
   - Added `# -*- coding: utf-8 -*-` headers at the top of `views.py`, `finance_selectors.py`, and `tests.py` to ensure proper source code interpretation.
   - Replaced mathematical symbol `Σ` with standard `sum` in `finance_selectors.py` calculate_balance docstring.
4. **Additional Tests**: Added `test_filter_by_invalid_date_format` to verify fallback handling on invalid date parameters.

### Post-Review Test Execution Summary
- **Command Run**: `cmd /c "set DATABASE_URL=sqlite:///db_test.sqlite3 && .venv\Scripts\python backend/manage.py test apps.finance --settings=config.settings.local"`
- **Result**: `OK` (6 tests ran, all passed)
- **Time Elapsed**: ~8.7 seconds
