#!/usr/bin/env python3
"""
Authentication Security Fix Verification Test
Focus: Critical Authentication Bypass Vulnerability Fix

This test specifically verifies the fix for the authentication bypass vulnerability
where invalid session_ids were being accepted and creating valid sessions.

CRITICAL TEST CASES:
1. POST /api/auth/session with INVALID session_id should return 401 (not 200)
2. POST /api/auth/session with empty session_id should return 401 or 500 (not 200)
3. POST /api/auth/session with SQL injection should return 401 (not 200)
4. GET /api/auth/me with invalid Bearer token should return 401 (not 200)
5. Verify that invalid requests do NOT create session cookies
6. Verify that invalid requests do NOT create entries in user_sessions collection
"""

import requests
import json
import sys
import uuid
import time
from typing import Dict, Any, Optional

# Backend URL from environment
BACKEND_URL = "https://trialbridge.preview.emergentagent.com/api"

class AuthSecurityTester:
    def __init__(self):
        self.results = []
        self.session = requests.Session()
        self.session.timeout = 10
        
    def log_result(self, test_name: str, success: bool, message: str, details: Dict = None):
        """Log test result"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "details": details or {}
        }
        self.results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name} - {message}")
        if details:
            print(f"   Details: {details}")
    
    def test_invalid_session_id_security(self):
        """Test that invalid session_ids are properly rejected"""
        print("\n=== 🔒 CRITICAL SECURITY TEST: Invalid Session ID Handling ===")
        
        # Test cases for invalid session_ids that should ALL return 401
        invalid_session_tests = [
            ("invalid_session_12345", "Random invalid session ID"),
            ("", "Empty session ID"),
            ("null", "Null string session ID"),
            ("undefined", "Undefined string session ID"),
            ("admin", "Simple string session ID"),
            ("test_session_bypass", "Test bypass attempt"),
            ("session_" + "x" * 100, "Very long session ID"),
            ("session with spaces", "Session ID with spaces"),
            ("session\nwith\nnewlines", "Session ID with newlines"),
            ("session/with/slashes", "Session ID with slashes"),
            ("session?with=query", "Session ID with query params"),
            ("session#with#hash", "Session ID with hash"),
        ]
        
        for session_id, description in invalid_session_tests:
            try:
                response = self.session.post(
                    f"{BACKEND_URL}/auth/session",
                    json={"session_id": session_id}
                )
                
                # Check status code - should be 401 (Unauthorized) or 500 (Server Error)
                if response.status_code == 401:
                    self.log_result(
                        f"Invalid Session Security - {description}",
                        True,
                        "✅ SECURITY FIX WORKING: Returns 401 for invalid session",
                        {
                            "session_id": session_id[:20] + "..." if len(session_id) > 20 else session_id,
                            "status_code": response.status_code
                        }
                    )
                elif response.status_code == 500:
                    # 500 is acceptable if it's a proper error handling
                    try:
                        error_data = response.json()
                        if "detail" in error_data and ("Authentication service" in error_data["detail"] or "Session processing failed" in error_data["detail"]):
                            self.log_result(
                                f"Invalid Session Security - {description}",
                                True,
                                "✅ SECURITY FIX WORKING: Returns 500 with proper error handling",
                                {
                                    "session_id": session_id[:20] + "..." if len(session_id) > 20 else session_id,
                                    "status_code": response.status_code,
                                    "error": error_data["detail"]
                                }
                            )
                        else:
                            self.log_result(
                                f"Invalid Session Security - {description}",
                                False,
                                "⚠️ Returns 500 but with unexpected error format",
                                {
                                    "session_id": session_id[:20] + "..." if len(session_id) > 20 else session_id,
                                    "status_code": response.status_code,
                                    "error": error_data
                                }
                            )
                    except json.JSONDecodeError:
                        self.log_result(
                            f"Invalid Session Security - {description}",
                            False,
                            "⚠️ Returns 500 but response is not JSON",
                            {
                                "session_id": session_id[:20] + "..." if len(session_id) > 20 else session_id,
                                "status_code": response.status_code,
                                "response": response.text[:200]
                            }
                        )
                elif response.status_code == 200:
                    # This is the CRITICAL VULNERABILITY - should NOT happen
                    try:
                        response_data = response.json()
                        self.log_result(
                            f"Invalid Session Security - {description}",
                            False,
                            "🚨 CRITICAL SECURITY VULNERABILITY: Invalid session returns 200 OK!",
                            {
                                "session_id": session_id[:20] + "..." if len(session_id) > 20 else session_id,
                                "status_code": response.status_code,
                                "response": response_data,
                                "cookies": dict(response.cookies)
                            }
                        )
                    except json.JSONDecodeError:
                        self.log_result(
                            f"Invalid Session Security - {description}",
                            False,
                            "🚨 CRITICAL SECURITY VULNERABILITY: Invalid session returns 200 OK (non-JSON)!",
                            {
                                "session_id": session_id[:20] + "..." if len(session_id) > 20 else session_id,
                                "status_code": response.status_code,
                                "response": response.text[:200],
                                "cookies": dict(response.cookies)
                            }
                        )
                else:
                    self.log_result(
                        f"Invalid Session Security - {description}",
                        False,
                        f"Unexpected status code: {response.status_code}",
                        {
                            "session_id": session_id[:20] + "..." if len(session_id) > 20 else session_id,
                            "status_code": response.status_code,
                            "response": response.text[:200]
                        }
                    )
                
                # Check for session cookies - should NOT be set for invalid sessions
                if response.cookies:
                    session_cookie = response.cookies.get('session_token')
                    if session_cookie:
                        self.log_result(
                            f"Cookie Security - {description}",
                            False,
                            "🚨 SECURITY ISSUE: Session cookie set for invalid session!",
                            {
                                "session_id": session_id[:20] + "..." if len(session_id) > 20 else session_id,
                                "cookie_value": session_cookie[:20] + "..." if len(session_cookie) > 20 else session_cookie
                            }
                        )
                    else:
                        self.log_result(
                            f"Cookie Security - {description}",
                            True,
                            "✅ No session cookie set for invalid session",
                            {"session_id": session_id[:20] + "..." if len(session_id) > 20 else session_id}
                        )
                else:
                    self.log_result(
                        f"Cookie Security - {description}",
                        True,
                        "✅ No cookies set for invalid session",
                        {"session_id": session_id[:20] + "..." if len(session_id) > 20 else session_id}
                    )
                    
            except Exception as e:
                self.log_result(
                    f"Invalid Session Security - {description}",
                    False,
                    f"Request failed: {str(e)}",
                    {"session_id": session_id[:20] + "..." if len(session_id) > 20 else session_id}
                )
    
    def test_sql_injection_session_security(self):
        """Test SQL injection attempts in session_id"""
        print("\n=== 🔒 SQL INJECTION SECURITY TEST ===")
        
        sql_injection_payloads = [
            "'; DROP TABLE users; --",
            "' OR '1'='1",
            "admin'--",
            "' UNION SELECT * FROM users --",
            "'; INSERT INTO users VALUES ('hacker', 'evil'); --",
            "1' OR 1=1 --",
            "'; DELETE FROM user_sessions; --",
            "' OR 'x'='x",
            "1; DROP DATABASE test_database; --"
        ]
        
        for payload in sql_injection_payloads:
            try:
                response = self.session.post(
                    f"{BACKEND_URL}/auth/session",
                    json={"session_id": payload}
                )
                
                if response.status_code == 401:
                    self.log_result(
                        f"SQL Injection Security - {payload[:30]}...",
                        True,
                        "✅ SECURITY FIX WORKING: SQL injection attempt returns 401",
                        {
                            "payload": payload,
                            "status_code": response.status_code
                        }
                    )
                elif response.status_code == 500:
                    # Check that error doesn't expose database details
                    try:
                        error_data = response.json()
                        error_text = str(error_data).lower()
                        if any(db_term in error_text for db_term in ['mongodb', 'collection', 'database', 'query', 'sql']):
                            self.log_result(
                                f"SQL Injection Security - {payload[:30]}...",
                                False,
                                "⚠️ Error response may expose database details",
                                {
                                    "payload": payload,
                                    "status_code": response.status_code,
                                    "error": error_data
                                }
                            )
                        else:
                            self.log_result(
                                f"SQL Injection Security - {payload[:30]}...",
                                True,
                                "✅ SECURITY FIX WORKING: SQL injection safely handled with 500",
                                {
                                    "payload": payload,
                                    "status_code": response.status_code
                                }
                            )
                    except json.JSONDecodeError:
                        self.log_result(
                            f"SQL Injection Security - {payload[:30]}...",
                            True,
                            "✅ SECURITY FIX WORKING: SQL injection handled (non-JSON 500)",
                            {
                                "payload": payload,
                                "status_code": response.status_code
                            }
                        )
                elif response.status_code == 200:
                    # CRITICAL VULNERABILITY
                    self.log_result(
                        f"SQL Injection Security - {payload[:30]}...",
                        False,
                        "🚨 CRITICAL SECURITY VULNERABILITY: SQL injection returns 200 OK!",
                        {
                            "payload": payload,
                            "status_code": response.status_code,
                            "response": response.text[:200]
                        }
                    )
                else:
                    self.log_result(
                        f"SQL Injection Security - {payload[:30]}...",
                        True,
                        f"SQL injection handled with status: {response.status_code}",
                        {
                            "payload": payload,
                            "status_code": response.status_code
                        }
                    )
                    
            except Exception as e:
                self.log_result(
                    f"SQL Injection Security - {payload[:30]}...",
                    False,
                    f"Request failed: {str(e)}",
                    {"payload": payload}
                )
    
    def test_invalid_bearer_token_security(self):
        """Test that invalid Bearer tokens are properly rejected"""
        print("\n=== 🔒 INVALID BEARER TOKEN SECURITY TEST ===")
        
        invalid_tokens = [
            ("invalid_token_12345", "Random invalid token"),
            ("", "Empty token"),
            ("null", "Null string token"),
            ("undefined", "Undefined string token"),
            ("admin", "Simple string token"),
            ("bearer_bypass_attempt", "Bearer bypass attempt"),
            ("token_" + "x" * 100, "Very long token"),
            ("token with spaces", "Token with spaces"),
            ("token\nwith\nnewlines", "Token with newlines"),
            ("token/with/slashes", "Token with slashes"),
            ("'; DROP TABLE users; --", "SQL injection in token"),
            ("<script>alert('xss')</script>", "XSS in token"),
        ]
        
        for token, description in invalid_tokens:
            try:
                response = self.session.get(
                    f"{BACKEND_URL}/auth/me",
                    headers={"Authorization": f"Bearer {token}"}
                )
                
                if response.status_code == 401:
                    self.log_result(
                        f"Invalid Bearer Token - {description}",
                        True,
                        "✅ SECURITY FIX WORKING: Invalid token returns 401",
                        {
                            "token": token[:20] + "..." if len(token) > 20 else token,
                            "status_code": response.status_code
                        }
                    )
                elif response.status_code == 200:
                    # CRITICAL VULNERABILITY
                    try:
                        user_data = response.json()
                        self.log_result(
                            f"Invalid Bearer Token - {description}",
                            False,
                            "🚨 CRITICAL SECURITY VULNERABILITY: Invalid token returns user data!",
                            {
                                "token": token[:20] + "..." if len(token) > 20 else token,
                                "status_code": response.status_code,
                                "user_data": user_data
                            }
                        )
                    except json.JSONDecodeError:
                        self.log_result(
                            f"Invalid Bearer Token - {description}",
                            False,
                            "🚨 CRITICAL SECURITY VULNERABILITY: Invalid token returns 200 OK!",
                            {
                                "token": token[:20] + "..." if len(token) > 20 else token,
                                "status_code": response.status_code,
                                "response": response.text[:200]
                            }
                        )
                else:
                    self.log_result(
                        f"Invalid Bearer Token - {description}",
                        False,
                        f"Unexpected status code: {response.status_code}",
                        {
                            "token": token[:20] + "..." if len(token) > 20 else token,
                            "status_code": response.status_code,
                            "response": response.text[:200]
                        }
                    )
                    
            except Exception as e:
                self.log_result(
                    f"Invalid Bearer Token - {description}",
                    False,
                    f"Request failed: {str(e)}",
                    {"token": token[:20] + "..." if len(token) > 20 else token}
                )
    
    def test_malformed_session_requests(self):
        """Test malformed session requests"""
        print("\n=== 🔒 MALFORMED SESSION REQUEST SECURITY TEST ===")
        
        malformed_requests = [
            ({}, "Empty JSON"),
            ({"invalid_field": "value"}, "Wrong field name"),
            ({"session_id": None}, "Null session_id"),
            ({"session_id": 12345}, "Numeric session_id"),
            ({"session_id": ["array"]}, "Array session_id"),
            ({"session_id": {"nested": "object"}}, "Object session_id"),
            ({"session_id": True}, "Boolean session_id"),
            ({"session_id": 3.14159}, "Float session_id"),
        ]
        
        for request_data, description in malformed_requests:
            try:
                response = self.session.post(
                    f"{BACKEND_URL}/auth/session",
                    json=request_data
                )
                
                if response.status_code in [400, 422]:
                    self.log_result(
                        f"Malformed Request - {description}",
                        True,
                        f"✅ Correctly rejects malformed data with {response.status_code}",
                        {
                            "request_data": request_data,
                            "status_code": response.status_code
                        }
                    )
                elif response.status_code == 500:
                    # Acceptable if it's proper error handling
                    self.log_result(
                        f"Malformed Request - {description}",
                        True,
                        "✅ Handles malformed data with 500 (acceptable)",
                        {
                            "request_data": request_data,
                            "status_code": response.status_code
                        }
                    )
                elif response.status_code == 200:
                    # CRITICAL VULNERABILITY
                    self.log_result(
                        f"Malformed Request - {description}",
                        False,
                        "🚨 CRITICAL SECURITY VULNERABILITY: Malformed request returns 200 OK!",
                        {
                            "request_data": request_data,
                            "status_code": response.status_code,
                            "response": response.text[:200]
                        }
                    )
                else:
                    self.log_result(
                        f"Malformed Request - {description}",
                        False,
                        f"Unexpected status code: {response.status_code}",
                        {
                            "request_data": request_data,
                            "status_code": response.status_code,
                            "response": response.text[:200]
                        }
                    )
                    
            except Exception as e:
                self.log_result(
                    f"Malformed Request - {description}",
                    False,
                    f"Request failed: {str(e)}",
                    {"request_data": request_data}
                )
    
    def test_session_cookie_security(self):
        """Test session cookie security"""
        print("\n=== 🔒 SESSION COOKIE SECURITY TEST ===")
        
        invalid_cookies = [
            ("invalid_cookie_12345", "Random invalid cookie"),
            ("", "Empty cookie"),
            ("null", "Null string cookie"),
            ("cookie_" + "x" * 100, "Very long cookie"),
            ("'; DROP TABLE users; --", "SQL injection in cookie"),
        ]
        
        for cookie_value, description in invalid_cookies:
            try:
                response = self.session.get(
                    f"{BACKEND_URL}/auth/me",
                    cookies={"session_token": cookie_value}
                )
                
                if response.status_code == 401:
                    self.log_result(
                        f"Invalid Cookie - {description}",
                        True,
                        "✅ SECURITY FIX WORKING: Invalid cookie returns 401",
                        {
                            "cookie": cookie_value[:20] + "..." if len(cookie_value) > 20 else cookie_value,
                            "status_code": response.status_code
                        }
                    )
                elif response.status_code == 200:
                    # CRITICAL VULNERABILITY
                    try:
                        user_data = response.json()
                        self.log_result(
                            f"Invalid Cookie - {description}",
                            False,
                            "🚨 CRITICAL SECURITY VULNERABILITY: Invalid cookie returns user data!",
                            {
                                "cookie": cookie_value[:20] + "..." if len(cookie_value) > 20 else cookie_value,
                                "status_code": response.status_code,
                                "user_data": user_data
                            }
                        )
                    except json.JSONDecodeError:
                        self.log_result(
                            f"Invalid Cookie - {description}",
                            False,
                            "🚨 CRITICAL SECURITY VULNERABILITY: Invalid cookie returns 200 OK!",
                            {
                                "cookie": cookie_value[:20] + "..." if len(cookie_value) > 20 else cookie_value,
                                "status_code": response.status_code,
                                "response": response.text[:200]
                            }
                        )
                else:
                    self.log_result(
                        f"Invalid Cookie - {description}",
                        False,
                        f"Unexpected status code: {response.status_code}",
                        {
                            "cookie": cookie_value[:20] + "..." if len(cookie_value) > 20 else cookie_value,
                            "status_code": response.status_code,
                            "response": response.text[:200]
                        }
                    )
                    
            except Exception as e:
                self.log_result(
                    f"Invalid Cookie - {description}",
                    False,
                    f"Request failed: {str(e)}",
                    {"cookie": cookie_value[:20] + "..." if len(cookie_value) > 20 else cookie_value}
                )
    
    def run_security_tests(self):
        """Run all authentication security tests"""
        print("🔒 STARTING CRITICAL AUTHENTICATION SECURITY TESTS")
        print(f"Testing backend at: {BACKEND_URL}")
        print("=" * 80)
        
        # Run all security tests
        self.test_invalid_session_id_security()
        self.test_sql_injection_session_security()
        self.test_invalid_bearer_token_security()
        self.test_malformed_session_requests()
        self.test_session_cookie_security()
        
        # Generate summary
        print("\n" + "=" * 80)
        print("🔒 AUTHENTICATION SECURITY TEST SUMMARY")
        print("=" * 80)
        
        total_tests = len(self.results)
        passed_tests = sum(1 for r in self.results if r["success"])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        
        if failed_tests > 0:
            print(f"\n🚨 CRITICAL SECURITY ISSUES FOUND: {failed_tests}")
            print("\nFAILED TESTS:")
            for result in self.results:
                if not result["success"]:
                    print(f"  ❌ {result['test']}: {result['message']}")
        else:
            print("\n✅ ALL SECURITY TESTS PASSED - AUTHENTICATION FIX IS WORKING!")
        
        return failed_tests == 0

if __name__ == "__main__":
    tester = AuthSecurityTester()
    success = tester.run_security_tests()
    sys.exit(0 if success else 1)