#!/usr/bin/env python
"""Quick test script for authentication (run manually)"""
import os
import sys
import django


def main() -> None:
    # Setup Django
    sys.path.insert(0, "c:\\Users\\Lipi\\Desktop\\Django-Projects\\backend")
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
    django.setup()

    from django.contrib.auth import get_user_model
    from rest_framework.test import APIClient

    User = get_user_model()
    client = APIClient()

    print("=" * 50)
    print("Testing Authentication Endpoints")
    print("=" * 50)

    # Test 1: Check if user exists
    admin_exists = User.objects.filter(username="admin").exists()
    print(f"\n[OK] Admin user exists: {admin_exists}")

    # Test 2: Test login endpoint
    print("\n[Testing Login Endpoint]")
    login_response = client.post(
        "/api/login/",
        {
            "username": "admin",
            "password": "Admin@123",
        },
        format="json",
    )

    print(f"Status: {login_response.status_code}")
    print(f"Response: {login_response.json()}")

    if login_response.status_code == 200:
        print("[OK] LOGIN WORKING!")
        tokens = login_response.json()
        access = tokens.get("access")
        print(f"Access Token: {access[:50]}..." if access else "No token")
    else:
        print("[FAIL] LOGIN FAILED")

    # Test 3: Test register endpoint
    print("\n[Testing Register Endpoint]")
    register_response = client.post(
        "/api/register/",
        {
            "username": "newuser",
            "email": "newuser@example.com",
            "password": "NewPass123!",
            "password2": "NewPass123!",
        },
        format="json",
    )

    print(f"Status: {register_response.status_code}")
    print(f"Response: {register_response.json()}")

    if register_response.status_code == 201:
        print("[OK] SIGNUP WORKING!")
    else:
        print("[FAIL] SIGNUP FAILED")

    print("\n" + "=" * 50)
    print("Test Complete")
    print("=" * 50)


if __name__ == "__main__":
    main()
