from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase


@override_settings(SECURE_SSL_REDIRECT=False)
class AuthFlowTests(APITestCase):
    def setUp(self):
        self.register_url = "/api/register/"
        self.login_url = "/api/login/"
        self.refresh_url = "/api/refresh/"
        self.profile_url = "/api/profile/"
        self.logout_url = "/api/logout/"

        self.user_payload = {
            "username": "testuser",
            "email": "testuser@example.com",
            "password": "TestPass123!",
            "password2": "TestPass123!",
        }

    def test_full_auth_flow(self):
        register_response = self.client.post(self.register_url, self.user_payload, format="json")
        self.assertEqual(register_response.status_code, status.HTTP_201_CREATED)

        login_response = self.client.post(
            self.login_url,
            {"username": self.user_payload["username"], "password": self.user_payload["password"]},
            format="json",
        )
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
        self.assertIn("access", login_response.data)
        self.assertIn("refresh", login_response.data)

        access_token = login_response.data["access"]
        refresh_token = login_response.data["refresh"]

        unauth_profile = self.client.get(self.profile_url)
        self.assertEqual(unauth_profile.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")
        auth_profile = self.client.get(self.profile_url)
        self.assertEqual(auth_profile.status_code, status.HTTP_200_OK)
        self.assertEqual(auth_profile.data["username"], self.user_payload["username"])

        refresh_response = self.client.post(self.refresh_url, {"refresh": refresh_token}, format="json")
        self.assertEqual(refresh_response.status_code, status.HTTP_200_OK)
        self.assertIn("access", refresh_response.data)

        # Use rotated refresh token if rotation is enabled
        refresh_token = refresh_response.data.get("refresh", refresh_token)
        logout_response = self.client.post(self.logout_url, {"refresh": refresh_token}, format="json")
        self.assertEqual(logout_response.status_code, status.HTTP_200_OK)
