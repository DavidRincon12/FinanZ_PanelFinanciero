from django.test import TestCase, Client
from django.urls import reverse
from django.contrib.auth import get_user_model
import json

User = get_user_model()

class UserPersonalizationTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.username = "testuser"
        self.password = "password123"
        self.email = "testuser@example.com"
        self.user = User.objects.create_user(
            username=self.username,
            password=self.password,
            email=self.email,
            first_name="Test",
            last_name="User"
        )
        self.me_url = reverse("users:me_api")
        self.update_url = reverse("users:profile_update_api")

    def test_me_api_returns_personalization_fields(self):
        self.client.login(username=self.username, password=self.password)
        
        # Manually set fields to check they return properly
        self.user.personal_activity = "student"
        self.user.tastes = "viajes, tecnología"
        self.user.monthly_income = 1500.50
        self.user.is_survey_completed = True
        self.user.save()

        response = self.client.get(self.me_url)
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertTrue(data["authenticated"])
        user_data = data["user"]
        self.assertEqual(user_data["personal_activity"], "student")
        self.assertEqual(user_data["tastes"], "viajes, tecnología")
        self.assertEqual(float(user_data["monthly_income"]), 1500.50)
        self.assertEqual(user_data["is_survey_completed"], True)

    def test_profile_update_api_success(self):
        self.client.login(username=self.username, password=self.password)
        
        payload = {
            "personal_activity": "employee",
            "tastes": "deportes, cocina",
            "monthly_income": 2500.00
        }
        
        response = self.client.post(
            self.update_url,
            data=json.dumps(payload),
            content_type="application/json"
        )
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertEqual(data["status"], "success")
        
        user_data = data["user"]
        self.assertEqual(user_data["personal_activity"], "employee")
        self.assertEqual(user_data["tastes"], "deportes, cocina")
        self.assertEqual(float(user_data["monthly_income"]), 2500.00)
        self.assertEqual(user_data["is_survey_completed"], True)

        # Verify database state
        self.user.refresh_from_db()
        self.assertEqual(self.user.personal_activity, "employee")
        self.assertEqual(self.user.tastes, "deportes, cocina")
        self.assertEqual(self.user.monthly_income, 2500.00)
        self.assertEqual(self.user.is_survey_completed, True)

    def test_profile_update_invalid_personal_activity(self):
        self.client.login(username=self.username, password=self.password)
        
        payload = {
            "personal_activity": "invalid_choice"
        }
        
        response = self.client.post(
            self.update_url,
            data=json.dumps(payload),
            content_type="application/json"
        )
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertIn("error", data)
        self.assertEqual(data["error"], "Actividad personal inválida")

    def test_profile_update_negative_monthly_income(self):
        self.client.login(username=self.username, password=self.password)
        
        payload = {
            "monthly_income": -100.00
        }
        
        response = self.client.post(
            self.update_url,
            data=json.dumps(payload),
            content_type="application/json"
        )
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertIn("error", data)
        self.assertEqual(data["error"], "Los ingresos mensuales no pueden ser menores a 0")
