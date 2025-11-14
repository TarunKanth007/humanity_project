#!/usr/bin/env python3
"""
Test what Emergent Auth backend is returning for invalid session IDs
"""

import requests
import json
import os

def test_emergent_auth():
    """Test Emergent Auth backend directly"""
    auth_backend_url = "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data"
    
    print("🔍 TESTING EMERGENT AUTH BACKEND DIRECTLY")
    print("="*60)
    
    # Test with various invalid session IDs
    test_session_ids = [
        "invalid_session_12345",
        "",
        "'; DROP TABLE users; --",
        "test_session_investigation",
        "completely_fake_session",
        "null",
        "undefined"
    ]
    
    for session_id in test_session_ids:
        print(f"\n📋 Testing session_id: '{session_id}'")
        try:
            response = requests.get(
                auth_backend_url,
                headers={"X-Session-ID": session_id},
                timeout=10
            )
            
            print(f"Status Code: {response.status_code}")
            print(f"Response Headers: {dict(response.headers)}")
            print(f"Response Content: {response.text[:500]}")
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    print(f"⚠️  WARNING: Invalid session returned data!")
                    print(f"Email: {data.get('email')}")
                    print(f"Name: {data.get('name')}")
                    print(f"Session Token: {data.get('session_token', 'N/A')}")
                except json.JSONDecodeError:
                    print("Response is not JSON")
            
        except Exception as e:
            print(f"Error: {e}")
        
        print("-" * 40)

if __name__ == "__main__":
    test_emergent_auth()