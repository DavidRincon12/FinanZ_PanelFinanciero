# Task 2 Report: Backend User Model & APIs updates

## Status
- **Completed**: Yes
- **Date**: 2026-06-30
- **Verified Commits**: `149cc30` (Backend: Modify CustomUser model and views to support personalization fields) in the range `09118a3..149cc30`

## What was Verified & Implemented
Verified that the database schema and view handlers are fully implemented and compliant with the personalization requirements:

1. **CustomUser Model Updates**:
   In [models.py](file:///C:/Users/David/Documents/GitHub/FinanZ_PanelFinanciero/backend/apps/users/models.py), the [CustomUser](file:///C:/Users/David/Documents/GitHub/FinanZ_PanelFinanciero/backend/apps/users/models.py#L10) model has been extended with the four required database fields:
   - `personal_activity`: A `CharField` containing choices representing user's activity (Estudiante, Empleado, Independiente, En búsqueda, Jubilado).
   - `tastes`: A `CharField` to store user interests and tastes.
   - `monthly_income`: A `DecimalField` for monthly incomes.
   - `is_survey_completed`: A `BooleanField` to track if the onboarding survey has been finished.

2. **Database Migrations**:
   The migration file [0002_customuser_is_survey_completed_and_more.py](file:///C:/Users/David/Documents/GitHub/FinanZ_PanelFinanciero/backend/apps/users/migrations/0002_customuser_is_survey_completed_and_more.py) was generated and applied to the database, creating the schema changes successfully.

3. **Retrieve User API View**:
   In [views.py](file:///C:/Users/David/Documents/GitHub/FinanZ_PanelFinanciero/backend/apps/users/views.py), the [me_api](file:///C:/Users/David/Documents/GitHub/FinanZ_PanelFinanciero/backend/apps/users/views.py#L365) view returns these four new personalization fields in JSON format, properly casting `monthly_income` as a float.

4. **Update User Profile API View**:
   In [views.py](file:///C:/Users/David/Documents/GitHub/FinanZ_PanelFinanciero/backend/apps/users/views.py), the [profile_update_api](file:///C:/Users/David/Documents/GitHub/FinanZ_PanelFinanciero/backend/apps/users/views.py#L389) handles updating the survey parameters:
   - Validates that `personal_activity` corresponds to valid choices.
   - Validates that `monthly_income` is not negative and can be parsed as a decimal.
   - Saves preferences and updates `is_survey_completed` flag appropriately.

## Tests Run and Output
Executed the unit tests in [tests.py](file:///C:/Users/David/Documents/GitHub/FinanZ_PanelFinanciero/backend/apps/users/tests.py) targeting [UserPersonalizationTests](file:///C:/Users/David/Documents/GitHub/FinanZ_PanelFinanciero/backend/apps/users/tests.py#L8):
` .venv\Scripts\python backend\manage.py test apps.users`

### Test Command Output
```
Creating test database for alias 'default'...
Got an error creating the test database: database "test_neondb" already exists

Found 4 test(s).
Type 'yes' if you would like to try deleting the test database 'test_neondb', or 'no' to cancel: Destroying old test database for alias 'default'...
System check identified some issues:

WARNINGS:
?: (staticfiles.W004) The directory 'C:\Users\David\Documents\GitHub\FinanZ_PanelFinanciero\frontend\static' in the STATICFILES_DIRS setting does not exist.

System check identified 1 issue (0 silenced).
..Bad Request: /api/profile/update/
.Bad Request: /api/profile/update/
.
----------------------------------------------------------------------
Ran 4 tests in 21.582s

OK
Destroying test database for alias 'default'...
```

*Note: The unit tests ran and finished successfully (OK).*

## Files Changed/Verified
- [backend/apps/users/models.py](file:///C:/Users/David/Documents/GitHub/FinanZ_PanelFinanciero/backend/apps/users/models.py) (Verified [CustomUser](file:///C:/Users/David/Documents/GitHub/FinanZ_PanelFinanciero/backend/apps/users/models.py#L10) definition)
- [backend/apps/users/views.py](file:///C:/Users/David/Documents/GitHub/FinanZ_PanelFinanciero/backend/apps/users/views.py) (Verified [me_api](file:///C:/Users/David/Documents/GitHub/FinanZ_PanelFinanciero/backend/apps/users/views.py#L365) & [profile_update_api](file:///C:/Users/David/Documents/GitHub/FinanZ_PanelFinanciero/backend/apps/users/views.py#L389) handlers)
- [backend/apps/users/tests.py](file:///C:/Users/David/Documents/GitHub/FinanZ_PanelFinanciero/backend/apps/users/tests.py) (Verified [UserPersonalizationTests](file:///C:/Users/David/Documents/GitHub/FinanZ_PanelFinanciero/backend/apps/users/tests.py#L8))
- [backend/apps/users/migrations/0002_customuser_is_survey_completed_and_more.py](file:///C:/Users/David/Documents/GitHub/FinanZ_PanelFinanciero/backend/apps/users/migrations/0002_customuser_is_survey_completed_and_more.py) (Verified migration fields)

## Self-Review Findings
- **Security & Authorization**: The profile endpoints are properly protected with `@login_required` or check for authentication status first, ensuring unauthorized users cannot access or alter profile details.
- **Validation**: Incoming parameters are checked correctly. Error responses return standard Django `JsonResponse` with 400 status codes.
- **Code Quality**: Correct decimal parsing is used with bounds checking (`income < 0` returns 400). Choice options are checked against the whitelist array.

## Issues or Concerns
- During the teardown of the test database, Django encountered:
  `django.db.utils.OperationalError: database "test_neondb" is being accessed by other users`
  `DETAIL: There is 1 other session using the database.`
  This is a known issue when testing against external/remote PostgreSQL databases (such as Neon) due to active pool connections. However, the tests themselves completed and passed successfully (`OK`).
