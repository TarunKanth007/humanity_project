#!/usr/bin/env python3
"""
Debug the authentication flow to understand the issue
"""

import requests
import json

def debug_auth_flow():
    """Debug what happens in the auth flow"""
    auth_backend_url = "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data"
    
    print("🔍 DEBUGGING AUTHENTICATION FLOW")
    print("="*50)
    
    # Test what happens with invalid session ID
    session_id = "invalid_session_12345"
    
    print(f"1. Testing Emergent Auth with session_id: '{session_id}'")
    
    try:
        auth_response = requests.get(
            auth_backend_url,
            headers={"X-Session-ID": session_id},
            timeout=10
        )
        
        print(f"Response status: {auth_response.status_code}")
        print(f"Response content: {auth_response.text}")
        
        print(f"2. Calling raise_for_status()...")
        auth_response.raise_for_status()
        
        print("⚠️  WARNING: raise_for_status() did NOT raise an exception!")
        
        session_data = auth_response.json()
        print(f"Session data: {session_data}")
        
    except requests.exceptions.HTTPError as e:
        print(f"✅ GOOD: HTTPError raised as expected: {e}")
        print(f"Response status: {e.response.status_code}")
        print(f"Response content: {e.response.text}")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")

if __name__ == "__main__":
    debug_auth_flow()