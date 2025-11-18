#!/usr/bin/env python3
"""
Check if there are session cookies causing the authentication bypass
"""

import requests
import json

BACKEND_URL = "https://medisync-34.preview.emergentagent.com/api"

def check_session_cookies():
    """Check session cookie behavior"""
    print("🔍 CHECKING SESSION COOKIE BEHAVIOR")
    print("="*50)
    
    # Create a session and make a request that should fail
    session = requests.Session()
    session.timeout = 10
    
    print("1. Testing /auth/me with fresh session (no cookies):")
    try:
        response = session.get(f"{BACKEND_URL}/auth/me")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text[:200]}")
        print(f"Cookies after request: {session.cookies}")
    except Exception as e:
        print(f"Error: {e}")
    
    print("\n2. Making invalid session request:")
    try:
        response = session.post(
            f"{BACKEND_URL}/auth/session",
            json={"session_id": "invalid_session_12345"}
        )
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text[:200]}")
        print(f"Cookies after invalid session: {session.cookies}")
        
        # Check if a cookie was set
        if 'session_token' in session.cookies:
            print(f"⚠️  WARNING: Session cookie was set: {session.cookies['session_token']}")
    except Exception as e:
        print(f"Error: {e}")
    
    print("\n3. Testing /auth/me after invalid session request:")
    try:
        response = session.get(f"{BACKEND_URL}/auth/me")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text[:200]}")
    except Exception as e:
        print(f"Error: {e}")
    
    print("\n4. Testing with completely fresh session (no shared cookies):")
    fresh_session = requests.Session()
    fresh_session.timeout = 10
    
    try:
        response = fresh_session.post(
            f"{BACKEND_URL}/auth/session",
            json={"session_id": "another_invalid_session"}
        )
        print(f"Fresh session status: {response.status_code}")
        print(f"Fresh session response: {response.text[:200]}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_session_cookies()