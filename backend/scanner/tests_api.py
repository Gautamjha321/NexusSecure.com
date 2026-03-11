from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase


@override_settings(SECURE_SSL_REDIRECT=False)
class ScanApiTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="scanuser",
            email="scanuser@example.com",
            password="TestPass123!",
        )
        self.client.force_authenticate(self.user)
        self.base_url = "/api/scan/"

    def test_scan_flow(self):
        with patch("scanner.views.run_scan_async.delay") as mock_delay, patch("scanner.views.run_scan_async.apply") as mock_apply:
            mock_delay.return_value = None
            mock_apply.return_value = None
            start_response = self.client.post(
                f"{self.base_url}start/",
                {"target_url": "https://example.com"},
                format="json",
            )

        self.assertEqual(start_response.status_code, status.HTTP_201_CREATED)
        scan_id = start_response.data["id"]

        history_response = self.client.get(f"{self.base_url}history/")
        self.assertEqual(history_response.status_code, status.HTTP_200_OK)

        detail_response = self.client.get(f"{self.base_url}{scan_id}/")
        self.assertEqual(detail_response.status_code, status.HTTP_200_OK)

        progress_response = self.client.get(f"{self.base_url}progress/{scan_id}/")
        self.assertEqual(progress_response.status_code, status.HTTP_200_OK)

        stats_response = self.client.get(f"{self.base_url}stats/{scan_id}/")
        self.assertEqual(stats_response.status_code, status.HTTP_200_OK)
        self.assertEqual(stats_response.data["total_vulnerabilities"], 0)
        self.assertIn("risk_score", stats_response.data)
        self.assertIn("risk_level", stats_response.data)
        self.assertIn("recommendations", stats_response.data)
        self.assertIn("owasp_breakdown", stats_response.data)

        vuln_response = self.client.get(f"{self.base_url}{scan_id}/vulnerabilities/")
        self.assertEqual(vuln_response.status_code, status.HTTP_200_OK)

        delete_response = self.client.delete(f"{self.base_url}{scan_id}/")
        self.assertEqual(delete_response.status_code, status.HTTP_200_OK)

    def test_scan_requires_auth(self):
        self.client.force_authenticate(user=None)
        response = self.client.get(f"{self.base_url}history/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_scan_validation(self):
        with patch("scanner.views.run_scan_async.delay") as mock_delay, patch("scanner.views.run_scan_async.apply") as mock_apply:
            mock_delay.return_value = None
            mock_apply.return_value = None
            response = self.client.post(
                f"{self.base_url}start/",
                {"target_url": "example.com"},
                format="json",
            )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_rejects_localhost_target(self):
        with patch("scanner.views.run_scan_async.delay") as mock_delay, patch("scanner.views.run_scan_async.apply") as mock_apply:
            mock_delay.return_value = None
            mock_apply.return_value = None
            response = self.client.post(
                f"{self.base_url}start/",
                {"target_url": "http://localhost:8000"},
                format="json",
            )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_vulnerabilities_404(self):
        response = self.client.get(f"{self.base_url}9999/vulnerabilities/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
