#!/usr/bin/env python3
"""
Authentication Investigation Script
Detailed analysis of the authentication system responses
"""

import requests
import json
import sys

BACKEND_URL = "https://researchportal-2.preview.emergentagent.com/api"

def investigate_auth_responses():
    """Investigate what's happening with authentication responses"""
    session = requests.Session()
    session.timeout = 10
    
    print("🔍 AUTHENTICATION SYSTEM INVESTIGATION")
    print("="*60)
    
    # Test 1: Check what happens with invalid session_id
    print("\n1. Testing invalid session_id response:")
    try:
        response = session.post(
            f"{BACKEND_URL}/auth/session",
            json={"session_id": "invalid_session_12345"}
        )
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        print(f"Response Content: {response.text[:500]}")
        
        if response.status_code == 200:
            try:
                data = response.json()
                print(f"JSON Response: {json.dumps(data, indent=2)}")
                if "user" in data:
                    print(f"⚠️  WARNING: Invalid session returned user data!")
                    print(f"User ID: {data['user'].get('id')}")
                    print(f"User Email: {data['user'].get('email')}")
            except json.JSONDecodeError:
                print("Response is not JSON")
    except Exception as e:
        print(f"Error: {e}")
    
    # Test 2: Check what happens with empty session_id
    print("\n2. Testing empty session_id response:")
    try:
        response = session.post(
            f"{BACKEND_URL}/auth/session",
            json={"session_id": ""}
        )
        print(f"Status Code: {response.status_code}")
        print(f"Response Content: {response.text[:500]}")
        
        if response.status_code == 200:
            try:
                data = response.json()
                print(f"JSON Response: {json.dumps(data, indent=2)}")
                if "user" in data:
                    print(f"⚠️  WARNING: Empty session returned user data!")
                    print(f"User ID: {data['user'].get('id')}")
                    print(f"User Email: {data['user'].get('email')}")
            except json.JSONDecodeError:
                print("Response is not JSON")
    except Exception as e:
        print(f"Error: {e}")
    
    # Test 3: Check /auth/me with invalid token
    print("\n3. Testing /auth/me with invalid token:")
    try:
        response = session.get(
            f"{BACKEND_URL}/auth/me",
            headers={"Authorization": "Bearer invalid_token_12345"}
        )
        print(f"Status Code: {response.status_code}")
        print(f"Response Content: {response.text[:500]}")
        
        if response.status_code == 200:
            try:
                data = response.json()
                print(f"JSON Response: {json.dumps(data, indent=2)}")
                print(f"⚠️  WARNING: Invalid token returned user data!")
                print(f"User ID: {data.get('id')}")
                print(f"User Email: {data.get('email')}")
            except json.JSONDecodeError:
                print("Response is not JSON")
    except Exception as e:
        print(f"Error: {e}")
    
    # Test 4: Check if there's a session cookie being set
    print("\n4. Testing session cookie behavior:")
    try:
        # First, try to create a session with invalid ID
        response = session.post(
            f"{BACKEND_URL}/auth/session",
            json={"session_id": "test_session_investigation"}
        )
        print(f"Session creation status: {response.status_code}")
        print(f"Cookies set: {response.cookies}")
        
        # Then try to use /auth/me without explicit auth
        response2 = session.get(f"{BACKEND_URL}/auth/me")
        print(f"/auth/me status after session attempt: {response2.status_code}")
        print(f"Response: {response2.text[:200]}")
        
    except Exception as e:
        print(f"Error: {e}")
    
    # Test 5: Check if there are any existing sessions
    print("\n5. Testing with completely fresh session:")
    fresh_session = requests.Session()
    fresh_session.timeout = 10
    
    try:
        response = fresh_session.get(f"{BACKEND_URL}/auth/me")
        print(f"Fresh session /auth/me status: {response.status_code}")
        print(f"Response: {response.text[:200]}")
    except Exception as e:
        print(f"Error: {e}")
    
    # Test 6: Check what happens with SQL injection in session_id
    print("\n6. Testing SQL injection response details:")
    try:
        response = session.post(
            f"{BACKEND_URL}/auth/session",
            json={"session_id": "'; DROP TABLE users; --"}
        )
        print(f"Status Code: {response.status_code}")
        print(f"Response Content: {response.text[:500]}")
        
        if response.status_code == 200:
            try:
                data = response.json()
                if "user" in data:
                    print(f"⚠️  CRITICAL: SQL injection attempt returned user data!")
                    print(f"User: {data['user']}")
            except json.JSONDecodeError:
                print("Response is not JSON")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    investigate_auth_responses()