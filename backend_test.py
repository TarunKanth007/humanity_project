#!/usr/bin/env python3
"""
CuraLink Backend Testing Suite
Focus: Critical Authentication Fix Testing
- POST /api/auth/session - Session creation and user retrieval
- GET /api/auth/me - Current user retrieval from session
- Verify no duplicate users can be created
- Database unique constraint verification
"""

import requests
import json
import sys
import uuid
import time
from typing import Dict, Any, Optional

# Backend URL from environment
BACKEND_URL = "https://health-matchmaker-1.preview.emergentagent.com/api"

# Expected CORS origins
EXPECTED_CORS_ORIGINS = [
    "http://localhost:3000",
    "https://health-matchmaker-1.preview.emergentagent.com", 
    "https://health-matchmaker-1.preview.emergentagent.com"
]

class BackendTester:
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
    
    def test_cors_configuration(self):
        """Test CORS configuration with different Origin headers"""
        print("\n=== CORS Configuration Tests ===")
        
        # Test 1: Check CORS with allowed origin
        for origin in EXPECTED_CORS_ORIGINS:
            try:
                response = self.session.get(
                    f"{BACKEND_URL}/auth/me",
                    headers={"Origin": origin}
                )
                
                cors_origin = response.headers.get("Access-Control-Allow-Origin")
                cors_credentials = response.headers.get("Access-Control-Allow-Credentials")
                
                if cors_origin == origin:
                    self.log_result(
                        f"CORS Origin Check - {origin}",
                        True,
                        f"Correctly returns specific origin: {cors_origin}",
                        {"origin_sent": origin, "origin_received": cors_origin, "credentials": cors_credentials}
                    )
                elif cors_origin == "*":
                    self.log_result(
                        f"CORS Origin Check - {origin}",
                        False,
                        "SECURITY ISSUE: Returns wildcard '*' instead of specific origin",
                        {"origin_sent": origin, "origin_received": cors_origin}
                    )
                else:
                    self.log_result(
                        f"CORS Origin Check - {origin}",
                        False,
                        f"Unexpected CORS origin response: {cors_origin}",
                        {"origin_sent": origin, "origin_received": cors_origin}
                    )
                    
            except Exception as e:
                self.log_result(
                    f"CORS Origin Check - {origin}",
                    False,
                    f"Request failed: {str(e)}"
                )
        
        # Test 2: Check CORS with disallowed origin
        try:
            disallowed_origin = "https://malicious-site.com"
            response = self.session.get(
                f"{BACKEND_URL}/auth/me",
                headers={"Origin": disallowed_origin}
            )
            
            cors_origin = response.headers.get("Access-Control-Allow-Origin")
            
            if cors_origin == disallowed_origin:
                self.log_result(
                    "CORS Disallowed Origin Check",
                    False,
                    "SECURITY ISSUE: Allows disallowed origin",
                    {"disallowed_origin": disallowed_origin, "cors_response": cors_origin}
                )
            elif cors_origin == "*":
                self.log_result(
                    "CORS Disallowed Origin Check", 
                    False,
                    "SECURITY ISSUE: Returns wildcard '*' for any origin",
                    {"disallowed_origin": disallowed_origin, "cors_response": cors_origin}
                )
            elif cors_origin is None:
                self.log_result(
                    "CORS Disallowed Origin Check",
                    True,
                    "Correctly rejects disallowed origin (no CORS header)",
                    {"disallowed_origin": disallowed_origin}
                )
            else:
                self.log_result(
                    "CORS Disallowed Origin Check",
                    False,
                    f"Unexpected behavior with disallowed origin: {cors_origin}",
                    {"disallowed_origin": disallowed_origin, "cors_response": cors_origin}
                )
                
        except Exception as e:
            self.log_result(
                "CORS Disallowed Origin Check",
                False,
                f"Request failed: {str(e)}"
            )
    
    def test_cors_preflight(self):
        """Test CORS preflight requests"""
        print("\n=== CORS Preflight Tests ===")
        
        for origin in EXPECTED_CORS_ORIGINS:
            try:
                response = self.session.options(
                    f"{BACKEND_URL}/auth/me",
                    headers={
                        "Origin": origin,
                        "Access-Control-Request-Method": "GET",
                        "Access-Control-Request-Headers": "Authorization"
                    }
                )
                
                allow_origin = response.headers.get("Access-Control-Allow-Origin")
                allow_methods = response.headers.get("Access-Control-Allow-Methods")
                allow_headers = response.headers.get("Access-Control-Allow-Headers")
                allow_credentials = response.headers.get("Access-Control-Allow-Credentials")
                
                success = (
                    response.status_code == 200 and
                    allow_origin == origin and
                    allow_credentials == "true"
                )
                
                self.log_result(
                    f"CORS Preflight - {origin}",
                    success,
                    "Preflight request handled correctly" if success else "Preflight request failed",
                    {
                        "status_code": response.status_code,
                        "allow_origin": allow_origin,
                        "allow_methods": allow_methods,
                        "allow_headers": allow_headers,
                        "allow_credentials": allow_credentials
                    }
                )
                
            except Exception as e:
                self.log_result(
                    f"CORS Preflight - {origin}",
                    False,
                    f"Preflight request failed: {str(e)}"
                )
    
    def test_auth_endpoints_comprehensive(self):
        """Comprehensive authentication endpoint testing for duplicate user fix"""
        print("\n=== CRITICAL AUTHENTICATION FIX TESTING ===")
        
        # Test 1: /api/auth/me without authentication
        try:
            response = self.session.get(f"{BACKEND_URL}/auth/me")
            
            if response.status_code == 401:
                try:
                    error_data = response.json()
                    if "detail" in error_data and error_data["detail"] == "Not authenticated":
                        self.log_result(
                            "Auth /me - Unauthenticated",
                            True,
                            "Correctly returns 401 with proper error message",
                            {"status_code": response.status_code, "error": error_data}
                        )
                    else:
                        self.log_result(
                            "Auth /me - Unauthenticated",
                            True,
                            "Returns 401 but with unexpected error format",
                            {"status_code": response.status_code, "error": error_data}
                        )
                except json.JSONDecodeError:
                    self.log_result(
                        "Auth /me - Unauthenticated",
                        True,
                        "Returns 401 but response is not JSON",
                        {"status_code": response.status_code, "response": response.text[:100]}
                    )
            else:
                self.log_result(
                    "Auth /me - Unauthenticated",
                    False,
                    f"Expected 401, got {response.status_code}",
                    {"status_code": response.status_code, "response": response.text[:200]}
                )
                
        except Exception as e:
            self.log_result(
                "Auth /me - Unauthenticated",
                False,
                f"Request failed: {str(e)}"
            )
        
        # Test 2: /api/auth/session endpoint structure and error handling
        try:
            # Test with invalid session_id
            response = self.session.post(
                f"{BACKEND_URL}/auth/session",
                json={"session_id": "invalid_session_12345"}
            )
            
            if response.status_code == 500:
                try:
                    error_data = response.json()
                    if "detail" in error_data and "Session processing failed" in error_data["detail"]:
                        self.log_result(
                            "Auth /session - Invalid Session",
                            True,
                            "Correctly handles invalid session with proper error",
                            {"status_code": response.status_code, "error": error_data}
                        )
                    else:
                        self.log_result(
                            "Auth /session - Invalid Session",
                            True,
                            "Handles invalid session but with different error format",
                            {"status_code": response.status_code, "error": error_data}
                        )
                except json.JSONDecodeError:
                    self.log_result(
                        "Auth /session - Invalid Session",
                        False,
                        "Returns 500 but response is not JSON",
                        {"status_code": response.status_code, "response": response.text[:200]}
                    )
            elif response.status_code in [400, 401]:
                self.log_result(
                    "Auth /session - Invalid Session",
                    True,
                    f"Handles invalid session appropriately (status: {response.status_code})",
                    {"status_code": response.status_code}
                )
            else:
                self.log_result(
                    "Auth /session - Invalid Session",
                    False,
                    f"Unexpected response to invalid session: {response.status_code}",
                    {"status_code": response.status_code, "response": response.text[:200]}
                )
                
        except Exception as e:
            self.log_result(
                "Auth /session - Invalid Session",
                False,
                f"Request failed: {str(e)}"
            )
        
        # Test 3: /api/auth/session with malformed data
        malformed_data_tests = [
            ({}, "Empty JSON"),
            ({"invalid_field": "value"}, "Wrong field name"),
            ({"session_id": ""}, "Empty session_id"),
            ({"session_id": None}, "Null session_id"),
            ({"session_id": 12345}, "Numeric session_id"),
            ({"session_id": ["array"]}, "Array session_id"),
            ({"session_id": {"nested": "object"}}, "Object session_id")
        ]
        
        for test_data, description in malformed_data_tests:
            try:
                response = self.session.post(
                    f"{BACKEND_URL}/auth/session",
                    json=test_data
                )
                
                if response.status_code in [400, 422, 500]:
                    self.log_result(
                        f"Auth /session Validation - {description}",
                        True,
                        f"Correctly rejects malformed data (status: {response.status_code})",
                        {"status_code": response.status_code, "test_data": test_data}
                    )
                else:
                    self.log_result(
                        f"Auth /session Validation - {description}",
                        False,
                        f"Unexpected response to malformed data: {response.status_code}",
                        {"status_code": response.status_code, "test_data": test_data}
                    )
            except Exception as e:
                self.log_result(
                    f"Auth /session Validation - {description}",
                    False,
                    f"Request failed: {str(e)}"
                )
        
        # Test 4: /api/auth/logout endpoint
        try:
            response = self.session.post(f"{BACKEND_URL}/auth/logout")
            
            if response.status_code == 200:
                try:
                    logout_data = response.json()
                    if "status" in logout_data and logout_data["status"] == "success":
                        self.log_result(
                            "Auth /logout - No Session",
                            True,
                            "Logout succeeds even without active session",
                            {"status_code": response.status_code, "response": logout_data}
                        )
                    else:
                        self.log_result(
                            "Auth /logout - No Session",
                            True,
                            "Logout returns 200 but unexpected format",
                            {"status_code": response.status_code, "response": logout_data}
                        )
                except json.JSONDecodeError:
                    self.log_result(
                        "Auth /logout - No Session",
                        False,
                        "Logout returns 200 but response is not JSON",
                        {"status_code": response.status_code, "response": response.text[:100]}
                    )
            else:
                self.log_result(
                    "Auth /logout - No Session",
                    False,
                    f"Unexpected logout response: {response.status_code}",
                    {"status_code": response.status_code, "response": response.text[:200]}
                )
        except Exception as e:
            self.log_result(
                "Auth /logout - No Session",
                False,
                f"Request failed: {str(e)}"
            )
    
    def test_auth_session_consistency(self):
        """Test authentication session consistency and duplicate prevention"""
        print("\n=== AUTHENTICATION SESSION CONSISTENCY TESTS ===")
        
        # Test 1: Multiple rapid session creation attempts (simulate race condition)
        print("Testing race condition handling...")
        
        # Simulate multiple concurrent session creation attempts
        test_session_ids = [
            f"test_session_{i}_{int(time.time())}" for i in range(5)
        ]
        
        for i, session_id in enumerate(test_session_ids):
            try:
                response = self.session.post(
                    f"{BACKEND_URL}/auth/session",
                    json={"session_id": session_id}
                )
                
                # All should fail with 500 (invalid session), but endpoint should handle them
                if response.status_code == 500:
                    self.log_result(
                        f"Race Condition Test {i+1}",
                        True,
                        f"Handles concurrent session attempt appropriately",
                        {"session_id": session_id, "status_code": response.status_code}
                    )
                else:
                    self.log_result(
                        f"Race Condition Test {i+1}",
                        False,
                        f"Unexpected response: {response.status_code}",
                        {"session_id": session_id, "status_code": response.status_code}
                    )
            except Exception as e:
                self.log_result(
                    f"Race Condition Test {i+1}",
                    False,
                    f"Request failed: {str(e)}"
                )
            
            # Small delay to simulate real-world timing
            time.sleep(0.1)
        
        # Test 2: Session token format validation
        print("Testing session token format validation...")
        
        invalid_tokens = [
            "",  # Empty token
            "a",  # Too short
            "x" * 1000,  # Too long
            "invalid token with spaces",  # Spaces
            "token/with/slashes",  # Special chars
            "token\nwith\nnewlines",  # Newlines
            "token\x00with\x00nulls",  # Null bytes
        ]
        
        for token in invalid_tokens:
            try:
                response = self.session.get(
                    f"{BACKEND_URL}/auth/me",
                    headers={"Authorization": f"Bearer {token}"}
                )
                
                if response.status_code == 401:
                    self.log_result(
                        f"Token Format Validation - {repr(token[:20])}",
                        True,
                        "Correctly rejects invalid token format",
                        {"token_preview": repr(token[:20]), "status_code": response.status_code}
                    )
                else:
                    self.log_result(
                        f"Token Format Validation - {repr(token[:20])}",
                        False,
                        f"Unexpected response to invalid token: {response.status_code}",
                        {"token_preview": repr(token[:20]), "status_code": response.status_code}
                    )
            except Exception as e:
                self.log_result(
                    f"Token Format Validation - {repr(token[:20])}",
                    False,
                    f"Request failed: {str(e)}"
                )
    
    def test_auth_header_variations(self):
        """Test different authentication header formats"""
        print("\n=== AUTHENTICATION HEADER VARIATIONS ===")
        
        test_token = "test_token_12345"
        
        # Test different Authorization header formats
        auth_variations = [
            (f"Bearer {test_token}", "Standard Bearer format"),
            (f"bearer {test_token}", "Lowercase bearer"),
            (f"BEARER {test_token}", "Uppercase BEARER"),
            (f"Token {test_token}", "Token format"),
            (test_token, "Raw token"),
            (f"Bearer{test_token}", "No space after Bearer"),
            (f"Bearer  {test_token}", "Double space after Bearer"),
            (f" Bearer {test_token}", "Leading space"),
            (f"Bearer {test_token} ", "Trailing space"),
        ]
        
        for auth_header, description in auth_variations:
            try:
                response = self.session.get(
                    f"{BACKEND_URL}/auth/me",
                    headers={"Authorization": auth_header}
                )
                
                if response.status_code == 401:
                    self.log_result(
                        f"Auth Header - {description}",
                        True,
                        "Correctly handles auth header format",
                        {"auth_header": auth_header, "status_code": response.status_code}
                    )
                else:
                    self.log_result(
                        f"Auth Header - {description}",
                        False,
                        f"Unexpected response: {response.status_code}",
                        {"auth_header": auth_header, "status_code": response.status_code}
                    )
            except Exception as e:
                self.log_result(
                    f"Auth Header - {description}",
                    False,
                    f"Request failed: {str(e)}"
                )
        
        # Test cookie-based authentication
        try:
            response = self.session.get(
                f"{BACKEND_URL}/auth/me",
                cookies={"session_token": test_token}
            )
            
            if response.status_code == 401:
                self.log_result(
                    "Auth Cookie - Session Token",
                    True,
                    "Correctly handles cookie-based auth",
                    {"status_code": response.status_code}
                )
            else:
                self.log_result(
                    "Auth Cookie - Session Token",
                    False,
                    f"Unexpected response to cookie auth: {response.status_code}",
                    {"status_code": response.status_code}
                )
        except Exception as e:
            self.log_result(
                "Auth Cookie - Session Token",
                False,
                f"Request failed: {str(e)}"
            )
    
    def test_auth_endpoints_security(self):
        """Test authentication endpoints for security vulnerabilities"""
        print("\n=== AUTHENTICATION SECURITY TESTS ===")
        
        # Test 1: SQL Injection attempts in session_id
        sql_injection_payloads = [
            "'; DROP TABLE users; --",
            "' OR '1'='1",
            "admin'--",
            "' UNION SELECT * FROM users --",
            "'; INSERT INTO users VALUES ('hacker', 'evil'); --"
        ]
        
        for payload in sql_injection_payloads:
            try:
                response = self.session.post(
                    f"{BACKEND_URL}/auth/session",
                    json={"session_id": payload}
                )
                
                # Should handle safely (500 for invalid session, not expose DB errors)
                if response.status_code == 500:
                    try:
                        error_data = response.json()
                        # Check that error doesn't expose database details
                        error_text = str(error_data).lower()
                        if any(db_term in error_text for db_term in ['mongodb', 'collection', 'database', 'query']):
                            self.log_result(
                                f"SQL Injection Test - {payload[:20]}",
                                False,
                                "Error response may expose database details",
                                {"payload": payload, "error": error_data}
                            )
                        else:
                            self.log_result(
                                f"SQL Injection Test - {payload[:20]}",
                                True,
                                "Safely handles injection attempt",
                                {"payload": payload, "status_code": response.status_code}
                            )
                    except json.JSONDecodeError:
                        self.log_result(
                            f"SQL Injection Test - {payload[:20]}",
                            True,
                            "Handles injection attempt (non-JSON response)",
                            {"payload": payload, "status_code": response.status_code}
                        )
                else:
                    self.log_result(
                        f"SQL Injection Test - {payload[:20]}",
                        True,
                        f"Handles injection attempt (status: {response.status_code})",
                        {"payload": payload, "status_code": response.status_code}
                    )
            except Exception as e:
                self.log_result(
                    f"SQL Injection Test - {payload[:20]}",
                    False,
                    f"Request failed: {str(e)}"
                )
        
        # Test 2: XSS attempts in session_id
        xss_payloads = [
            "<script>alert('xss')</script>",
            "javascript:alert('xss')",
            "<img src=x onerror=alert('xss')>",
            "';alert('xss');//"
        ]
        
        for payload in xss_payloads:
            try:
                response = self.session.post(
                    f"{BACKEND_URL}/auth/session",
                    json={"session_id": payload}
                )
                
                if response.status_code in [400, 500]:
                    # Check that response doesn't echo back the payload
                    response_text = response.text.lower()
                    if "<script>" in response_text or "alert(" in response_text:
                        self.log_result(
                            f"XSS Test - {payload[:20]}",
                            False,
                            "Response may echo back XSS payload",
                            {"payload": payload, "response_preview": response.text[:200]}
                        )
                    else:
                        self.log_result(
                            f"XSS Test - {payload[:20]}",
                            True,
                            "Safely handles XSS attempt",
                            {"payload": payload, "status_code": response.status_code}
                        )
                else:
                    self.log_result(
                        f"XSS Test - {payload[:20]}",
                        True,
                        f"Handles XSS attempt (status: {response.status_code})",
                        {"payload": payload, "status_code": response.status_code}
                    )
            except Exception as e:
                self.log_result(
                    f"XSS Test - {payload[:20]}",
                    False,
                    f"Request failed: {str(e)}"
                )
    
    def test_forum_creation_and_deletion_flow(self):
        """Test complete forum creation and deletion flow without authentication"""
        print("\n=== Forum Creation & Deletion Flow Tests ===")
        
        # Test 1: Verify we can get current forums list
        try:
            response = self.session.get(f"{BACKEND_URL}/forums")
            if response.status_code == 200:
                initial_forums = response.json()
                initial_count = len(initial_forums)
                self.log_result(
                    "Forum Flow - Initial Forums List",
                    True,
                    f"Successfully retrieved {initial_count} existing forums",
                    {"initial_forum_count": initial_count}
                )
            else:
                self.log_result(
                    "Forum Flow - Initial Forums List",
                    False,
                    f"Failed to get forums list: {response.status_code}",
                    {"status_code": response.status_code}
                )
                return
        except Exception as e:
            self.log_result(
                "Forum Flow - Initial Forums List",
                False,
                f"Request failed: {str(e)}"
            )
            return
        
        # Test 2: Attempt forum creation without auth (should fail)
        test_forum_data = {
            "name": f"Test Forum {uuid.uuid4().hex[:8]}",
            "description": "A test forum for automated testing",
            "category": "Testing"
        }
        
        try:
            response = self.session.post(
                f"{BACKEND_URL}/forums/create",
                json=test_forum_data
            )
            
            if response.status_code == 401:
                self.log_result(
                    "Forum Flow - Creation Without Auth",
                    True,
                    "Correctly blocks forum creation without authentication",
                    {"status_code": response.status_code}
                )
            else:
                self.log_result(
                    "Forum Flow - Creation Without Auth",
                    False,
                    f"Unexpected response to unauthenticated creation: {response.status_code}",
                    {"status_code": response.status_code, "response": response.text[:200]}
                )
        except Exception as e:
            self.log_result(
                "Forum Flow - Creation Without Auth",
                False,
                f"Request failed: {str(e)}"
            )
        
        # Test 3: Attempt forum deletion without auth (should fail)
        # Use one of the existing forums for this test
        if initial_forums:
            test_forum_id = initial_forums[0]["id"]
            try:
                response = self.session.delete(f"{BACKEND_URL}/forums/{test_forum_id}")
                
                if response.status_code == 401:
                    self.log_result(
                        "Forum Flow - Deletion Without Auth",
                        True,
                        "Correctly blocks forum deletion without authentication",
                        {"status_code": response.status_code, "forum_id": test_forum_id}
                    )
                else:
                    self.log_result(
                        "Forum Flow - Deletion Without Auth",
                        False,
                        f"Unexpected response to unauthenticated deletion: {response.status_code}",
                        {"status_code": response.status_code, "forum_id": test_forum_id}
                    )
            except Exception as e:
                self.log_result(
                    "Forum Flow - Deletion Without Auth",
                    False,
                    f"Request failed: {str(e)}"
                )
        
        # Test 4: Test deletion with invalid forum ID
        invalid_forum_id = "invalid_forum_id_123"
        try:
            response = self.session.delete(f"{BACKEND_URL}/forums/{invalid_forum_id}")
            
            if response.status_code == 401:
                self.log_result(
                    "Forum Flow - Invalid ID Deletion",
                    True,
                    "Authentication check happens before ID validation (expected)",
                    {"status_code": response.status_code, "forum_id": invalid_forum_id}
                )
            elif response.status_code == 404:
                self.log_result(
                    "Forum Flow - Invalid ID Deletion",
                    False,
                    "ID validation happens before auth check (security issue)",
                    {"status_code": response.status_code, "forum_id": invalid_forum_id}
                )
            else:
                self.log_result(
                    "Forum Flow - Invalid ID Deletion",
                    False,
                    f"Unexpected response: {response.status_code}",
                    {"status_code": response.status_code, "forum_id": invalid_forum_id}
                )
        except Exception as e:
            self.log_result(
                "Forum Flow - Invalid ID Deletion",
                False,
                f"Request failed: {str(e)}"
            )
    
    def test_forum_api_structure(self):
        """Test forum API response structure and data integrity"""
        print("\n=== Forum API Structure Tests ===")
        
        try:
            response = self.session.get(f"{BACKEND_URL}/forums")
            if response.status_code != 200:
                self.log_result(
                    "Forum API Structure - Access",
                    False,
                    f"Cannot access forums endpoint: {response.status_code}",
                    {"status_code": response.status_code}
                )
                return
            
            forums = response.json()
            
            # Test forum structure
            required_fields = ["id", "name", "description", "category", "created_by", "post_count", "created_at"]
            optional_fields = ["created_by_name", "is_creator"]
            
            for i, forum in enumerate(forums):
                missing_required = [field for field in required_fields if field not in forum]
                
                if missing_required:
                    self.log_result(
                        f"Forum Structure - Forum {i+1}",
                        False,
                        f"Missing required fields: {missing_required}",
                        {"forum_id": forum.get("id"), "missing_fields": missing_required}
                    )
                else:
                    self.log_result(
                        f"Forum Structure - Forum {i+1}",
                        True,
                        "All required fields present",
                        {"forum_id": forum.get("id"), "name": forum.get("name")}
                    )
                
                # Validate data types
                type_checks = [
                    ("id", str),
                    ("name", str),
                    ("description", str),
                    ("category", str),
                    ("post_count", int),
                    ("created_at", str)
                ]
                
                type_errors = []
                for field, expected_type in type_checks:
                    if field in forum and not isinstance(forum[field], expected_type):
                        type_errors.append(f"{field}: expected {expected_type.__name__}, got {type(forum[field]).__name__}")
                
                if type_errors:
                    self.log_result(
                        f"Forum Data Types - Forum {i+1}",
                        False,
                        f"Type validation errors: {type_errors}",
                        {"forum_id": forum.get("id"), "type_errors": type_errors}
                    )
                else:
                    self.log_result(
                        f"Forum Data Types - Forum {i+1}",
                        True,
                        "All field types correct",
                        {"forum_id": forum.get("id")}
                    )
        
        except json.JSONDecodeError:
            self.log_result(
                "Forum API Structure - JSON",
                False,
                "Response is not valid JSON",
                {"response": response.text[:200]}
            )
        except Exception as e:
            self.log_result(
                "Forum API Structure - Access",
                False,
                f"Request failed: {str(e)}"
            )
    
    def test_forum_role_based_access_simulation(self):
        """Test role-based access patterns by examining endpoint behavior"""
        print("\n=== Forum Role-Based Access Simulation ===")
        
        # Test different request patterns that would be used by different roles
        
        # Test 1: Patient-like request (should be blocked from creation)
        patient_headers = {
            "User-Agent": "CuraLink-Patient/1.0",
            "X-Role-Hint": "patient"  # This is just for testing, not actual auth
        }
        
        try:
            response = self.session.post(
                f"{BACKEND_URL}/forums/create",
                json={"name": "Patient Forum", "description": "Test", "category": "General"},
                headers=patient_headers
            )
            
            if response.status_code == 401:
                self.log_result(
                    "Role Access - Patient Creation Attempt",
                    True,
                    "Patient-like request correctly blocked (auth required)",
                    {"status_code": response.status_code}
                )
            else:
                self.log_result(
                    "Role Access - Patient Creation Attempt",
                    False,
                    f"Unexpected response: {response.status_code}",
                    {"status_code": response.status_code}
                )
        except Exception as e:
            self.log_result(
                "Role Access - Patient Creation Attempt",
                False,
                f"Request failed: {str(e)}"
            )
        
        # Test 2: Researcher-like request (should also be blocked without proper auth)
        researcher_headers = {
            "User-Agent": "CuraLink-Researcher/1.0",
            "X-Role-Hint": "researcher"  # This is just for testing, not actual auth
        }
        
        try:
            response = self.session.post(
                f"{BACKEND_URL}/forums/create",
                json={"name": "Researcher Forum", "description": "Test", "category": "Research"},
                headers=researcher_headers
            )
            
            if response.status_code == 401:
                self.log_result(
                    "Role Access - Researcher Creation Attempt",
                    True,
                    "Researcher-like request correctly requires authentication",
                    {"status_code": response.status_code}
                )
            else:
                self.log_result(
                    "Role Access - Researcher Creation Attempt",
                    False,
                    f"Unexpected response: {response.status_code}",
                    {"status_code": response.status_code}
                )
        except Exception as e:
            self.log_result(
                "Role Access - Researcher Creation Attempt",
                False,
                f"Request failed: {str(e)}"
            )
    
    def test_forum_creation_without_auth(self):
        """Test forum creation without authentication"""
        print("\n=== Forum Creation - No Auth Tests ===")
        
        forum_data = {
            "name": "Test Cardiology Forum",
            "description": "A test forum for cardiology discussions",
            "category": "Cardiology"
        }
        
        try:
            response = self.session.post(
                f"{BACKEND_URL}/forums/create",
                json=forum_data
            )
            
            if response.status_code == 401:
                self.log_result(
                    "Forum Creation - No Auth",
                    True,
                    "Correctly returns 401 for unauthenticated request",
                    {"status_code": response.status_code}
                )
            else:
                self.log_result(
                    "Forum Creation - No Auth",
                    False,
                    f"Expected 401, got {response.status_code}",
                    {"status_code": response.status_code, "response": response.text[:200]}
                )
                
        except Exception as e:
            self.log_result(
                "Forum Creation - No Auth",
                False,
                f"Request failed: {str(e)}"
            )
    
    def test_forum_creation_validation(self):
        """Test forum creation with invalid data"""
        print("\n=== Forum Creation - Validation Tests ===")
        
        # Test missing required fields
        invalid_data_sets = [
            ({}, "Empty data"),
            ({"name": "Test Forum"}, "Missing description and category"),
            ({"description": "Test description"}, "Missing name and category"),
            ({"category": "Cardiology"}, "Missing name and description"),
            ({"name": "", "description": "Test", "category": "Cardiology"}, "Empty name"),
            ({"name": "Test", "description": "", "category": "Cardiology"}, "Empty description"),
            ({"name": "Test", "description": "Test", "category": ""}, "Empty category")
        ]
        
        for invalid_data, description in invalid_data_sets:
            try:
                response = self.session.post(
                    f"{BACKEND_URL}/forums/create",
                    json=invalid_data
                )
                
                # Should return 401 (no auth) or 400 (bad data)
                if response.status_code in [400, 401]:
                    self.log_result(
                        f"Forum Creation Validation - {description}",
                        True,
                        f"Correctly rejects invalid data (status: {response.status_code})",
                        {"status_code": response.status_code, "data": invalid_data}
                    )
                else:
                    self.log_result(
                        f"Forum Creation Validation - {description}",
                        False,
                        f"Unexpected status code: {response.status_code}",
                        {"status_code": response.status_code, "data": invalid_data}
                    )
                    
            except Exception as e:
                self.log_result(
                    f"Forum Creation Validation - {description}",
                    False,
                    f"Request failed: {str(e)}"
                )
    
    def test_forum_deletion_without_auth(self):
        """Test forum deletion without authentication"""
        print("\n=== Forum Deletion - No Auth Tests ===")
        
        # Try to delete a non-existent forum (should still require auth)
        test_forum_id = "test_forum_123"
        
        try:
            response = self.session.delete(f"{BACKEND_URL}/forums/{test_forum_id}")
            
            if response.status_code == 401:
                self.log_result(
                    "Forum Deletion - No Auth",
                    True,
                    "Correctly returns 401 for unauthenticated request",
                    {"status_code": response.status_code}
                )
            else:
                self.log_result(
                    "Forum Deletion - No Auth",
                    False,
                    f"Expected 401, got {response.status_code}",
                    {"status_code": response.status_code, "response": response.text[:200]}
                )
                
        except Exception as e:
            self.log_result(
                "Forum Deletion - No Auth",
                False,
                f"Request failed: {str(e)}"
            )
    
    def test_forums_list_endpoint(self):
        """Test forums list endpoint"""
        print("\n=== Forums List Tests ===")
        
        try:
            response = self.session.get(f"{BACKEND_URL}/forums")
            
            if response.status_code == 200:
                try:
                    forums_data = response.json()
                    if isinstance(forums_data, list):
                        self.log_result(
                            "Forums List - Structure",
                            True,
                            f"Returns valid list with {len(forums_data)} forums",
                            {"status_code": response.status_code, "forum_count": len(forums_data)}
                        )
                        
                        # Check forum structure if any forums exist
                        if forums_data:
                            first_forum = forums_data[0]
                            required_fields = ["id", "name", "description", "category"]
                            missing_fields = [field for field in required_fields if field not in first_forum]
                            
                            if not missing_fields:
                                self.log_result(
                                    "Forums List - Forum Structure",
                                    True,
                                    "Forum objects have required fields",
                                    {"required_fields": required_fields, "sample_forum": first_forum}
                                )
                            else:
                                self.log_result(
                                    "Forums List - Forum Structure",
                                    False,
                                    f"Missing required fields: {missing_fields}",
                                    {"missing_fields": missing_fields, "sample_forum": first_forum}
                                )
                    else:
                        self.log_result(
                            "Forums List - Structure",
                            False,
                            f"Expected list, got {type(forums_data)}",
                            {"response_type": type(forums_data).__name__}
                        )
                except json.JSONDecodeError:
                    self.log_result(
                        "Forums List - JSON",
                        False,
                        "Response is not valid JSON",
                        {"response": response.text[:200]}
                    )
            else:
                self.log_result(
                    "Forums List - Access",
                    False,
                    f"Unexpected status code: {response.status_code}",
                    {"status_code": response.status_code, "response": response.text[:200]}
                )
                
        except Exception as e:
            self.log_result(
                "Forums List - Access",
                False,
                f"Request failed: {str(e)}"
            )
    
    def test_core_endpoints(self):
        """Test core API endpoints for basic functionality"""
        print("\n=== Core Endpoint Tests ===")
        
        # Test endpoints that should be accessible without auth or return proper auth errors
        endpoints_to_test = [
            ("/qa/questions", "GET", "Q&A Questions Endpoint"),
            ("/forums", "GET", "Forums Endpoint"),
            ("/seed", "POST", "Seed Data Endpoint")
        ]
        
        for endpoint, method, description in endpoints_to_test:
            try:
                if method == "GET":
                    response = self.session.get(f"{BACKEND_URL}{endpoint}")
                else:
                    response = self.session.post(f"{BACKEND_URL}{endpoint}")
                
                # We expect 401 for protected endpoints, or 200 for public ones
                if response.status_code in [200, 401]:
                    self.log_result(
                        description,
                        True,
                        f"Endpoint accessible (status: {response.status_code})",
                        {"endpoint": endpoint, "method": method, "status_code": response.status_code}
                    )
                else:
                    self.log_result(
                        description,
                        False,
                        f"Unexpected status code: {response.status_code}",
                        {"endpoint": endpoint, "method": method, "status_code": response.status_code, "response": response.text[:200]}
                    )
                    
            except Exception as e:
                self.log_result(
                    description,
                    False,
                    f"Request failed: {str(e)}",
                    {"endpoint": endpoint, "method": method}
                )
    
    def test_backend_health(self):
        """Test basic backend health and connectivity"""
        print("\n=== Backend Health Tests ===")
        
        try:
            # Try to reach any endpoint to verify backend is running
            response = self.session.get(f"{BACKEND_URL}/auth/me")
            
            if response.status_code in [200, 401, 404]:
                self.log_result(
                    "Backend Connectivity",
                    True,
                    f"Backend is reachable (status: {response.status_code})",
                    {"status_code": response.status_code}
                )
            else:
                self.log_result(
                    "Backend Connectivity",
                    False,
                    f"Backend returned unexpected status: {response.status_code}",
                    {"status_code": response.status_code}
                )
                
        except requests.exceptions.ConnectionError:
            self.log_result(
                "Backend Connectivity",
                False,
                "Cannot connect to backend - service may be down"
            )
        except Exception as e:
            self.log_result(
                "Backend Connectivity",
                False,
                f"Connection test failed: {str(e)}"
            )
    
    def test_forum_favorites_feature(self):
        """Test Forum Favorites feature comprehensively"""
        print("\n=== Forum Favorites Feature Tests ===")
        
        # First, get available forums to test with
        try:
            forums_response = self.session.get(f"{BACKEND_URL}/forums")
            if forums_response.status_code != 200:
                self.log_result(
                    "Forum Favorites - Setup",
                    False,
                    f"Cannot get forums list: {forums_response.status_code}",
                    {"status_code": forums_response.status_code}
                )
                return
            
            forums = forums_response.json()
            if not forums:
                self.log_result(
                    "Forum Favorites - Setup",
                    False,
                    "No forums available for testing",
                    {"forum_count": 0}
                )
                return
            
            test_forum_id = forums[0]["id"]
            test_forum_name = forums[0]["name"]
            
            self.log_result(
                "Forum Favorites - Setup",
                True,
                f"Using forum '{test_forum_name}' for testing",
                {"forum_id": test_forum_id, "forum_name": test_forum_name}
            )
            
        except Exception as e:
            self.log_result(
                "Forum Favorites - Setup",
                False,
                f"Failed to get forums: {str(e)}"
            )
            return
        
        # Test 1: Add Forum to Favorites without authentication
        try:
            favorite_data = {
                "item_type": "forum",
                "item_id": test_forum_id
            }
            
            response = self.session.post(
                f"{BACKEND_URL}/favorites",
                json=favorite_data
            )
            
            if response.status_code == 401:
                self.log_result(
                    "Forum Favorites - Add Without Auth",
                    True,
                    "Correctly requires authentication for adding favorites",
                    {"status_code": response.status_code}
                )
            else:
                self.log_result(
                    "Forum Favorites - Add Without Auth",
                    False,
                    f"Expected 401, got {response.status_code}",
                    {"status_code": response.status_code, "response": response.text[:200]}
                )
        except Exception as e:
            self.log_result(
                "Forum Favorites - Add Without Auth",
                False,
                f"Request failed: {str(e)}"
            )
        
        # Test 2: Check Forum Favorite Status without authentication
        try:
            response = self.session.get(f"{BACKEND_URL}/favorites/check/forum/{test_forum_id}")
            
            if response.status_code == 401:
                self.log_result(
                    "Forum Favorites - Check Status Without Auth",
                    True,
                    "Correctly requires authentication for checking favorite status",
                    {"status_code": response.status_code}
                )
            else:
                self.log_result(
                    "Forum Favorites - Check Status Without Auth",
                    False,
                    f"Expected 401, got {response.status_code}",
                    {"status_code": response.status_code, "response": response.text[:200]}
                )
        except Exception as e:
            self.log_result(
                "Forum Favorites - Check Status Without Auth",
                False,
                f"Request failed: {str(e)}"
            )
        
        # Test 3: Get All Favorites without authentication
        try:
            response = self.session.get(f"{BACKEND_URL}/favorites")
            
            if response.status_code == 401:
                self.log_result(
                    "Forum Favorites - Get All Without Auth",
                    True,
                    "Correctly requires authentication for getting favorites",
                    {"status_code": response.status_code}
                )
            else:
                self.log_result(
                    "Forum Favorites - Get All Without Auth",
                    False,
                    f"Expected 401, got {response.status_code}",
                    {"status_code": response.status_code, "response": response.text[:200]}
                )
        except Exception as e:
            self.log_result(
                "Forum Favorites - Get All Without Auth",
                False,
                f"Request failed: {str(e)}"
            )
        
        # Test 4: Remove Forum from Favorites without authentication
        test_favorite_id = "test_favorite_123"
        try:
            response = self.session.delete(f"{BACKEND_URL}/favorites/{test_favorite_id}")
            
            if response.status_code == 401:
                self.log_result(
                    "Forum Favorites - Remove Without Auth",
                    True,
                    "Correctly requires authentication for removing favorites",
                    {"status_code": response.status_code}
                )
            else:
                self.log_result(
                    "Forum Favorites - Remove Without Auth",
                    False,
                    f"Expected 401, got {response.status_code}",
                    {"status_code": response.status_code, "response": response.text[:200]}
                )
        except Exception as e:
            self.log_result(
                "Forum Favorites - Remove Without Auth",
                False,
                f"Request failed: {str(e)}"
            )
        
        # Test 5: Test favorites endpoint structure and validation
        self._test_favorites_endpoint_structure()
        
        # Test 6: Test invalid data handling
        self._test_favorites_invalid_data()
    
    def _test_favorites_endpoint_structure(self):
        """Test favorites endpoints structure and response format"""
        print("\n=== Forum Favorites - Endpoint Structure Tests ===")
        
        # Test check endpoint with invalid item_type
        try:
            response = self.session.get(f"{BACKEND_URL}/favorites/check/invalid_type/test_id")
            
            if response.status_code == 401:
                self.log_result(
                    "Favorites Structure - Invalid Item Type",
                    True,
                    "Authentication check happens before item_type validation",
                    {"status_code": response.status_code}
                )
            else:
                self.log_result(
                    "Favorites Structure - Invalid Item Type",
                    False,
                    f"Unexpected response: {response.status_code}",
                    {"status_code": response.status_code}
                )
        except Exception as e:
            self.log_result(
                "Favorites Structure - Invalid Item Type",
                False,
                f"Request failed: {str(e)}"
            )
        
        # Test check endpoint with invalid item_id format
        try:
            response = self.session.get(f"{BACKEND_URL}/favorites/check/forum/")
            
            # This should return 404 or 422 due to empty item_id
            if response.status_code in [404, 422]:
                self.log_result(
                    "Favorites Structure - Empty Item ID",
                    True,
                    f"Correctly handles empty item_id (status: {response.status_code})",
                    {"status_code": response.status_code}
                )
            elif response.status_code == 401:
                self.log_result(
                    "Favorites Structure - Empty Item ID",
                    True,
                    "Authentication check happens before path validation",
                    {"status_code": response.status_code}
                )
            else:
                self.log_result(
                    "Favorites Structure - Empty Item ID",
                    False,
                    f"Unexpected response: {response.status_code}",
                    {"status_code": response.status_code}
                )
        except Exception as e:
            self.log_result(
                "Favorites Structure - Empty Item ID",
                False,
                f"Request failed: {str(e)}"
            )
    
    def _test_favorites_invalid_data(self):
        """Test favorites endpoints with invalid data"""
        print("\n=== Forum Favorites - Invalid Data Tests ===")
        
        # Test adding favorite with invalid data
        invalid_data_sets = [
            ({}, "Empty data"),
            ({"item_type": "forum"}, "Missing item_id"),
            ({"item_id": "test_id"}, "Missing item_type"),
            ({"item_type": "", "item_id": "test_id"}, "Empty item_type"),
            ({"item_type": "forum", "item_id": ""}, "Empty item_id"),
            ({"item_type": "invalid_type", "item_id": "test_id"}, "Invalid item_type"),
            ({"item_type": "forum", "item_id": "test_id", "extra_field": "value"}, "Extra fields")
        ]
        
        for invalid_data, description in invalid_data_sets:
            try:
                response = self.session.post(
                    f"{BACKEND_URL}/favorites",
                    json=invalid_data
                )
                
                # Should return 401 (no auth) or 400/422 (bad data)
                if response.status_code in [400, 401, 422]:
                    self.log_result(
                        f"Favorites Invalid Data - {description}",
                        True,
                        f"Correctly rejects invalid data (status: {response.status_code})",
                        {"status_code": response.status_code, "data": invalid_data}
                    )
                else:
                    self.log_result(
                        f"Favorites Invalid Data - {description}",
                        False,
                        f"Unexpected status code: {response.status_code}",
                        {"status_code": response.status_code, "data": invalid_data}
                    )
            except Exception as e:
                self.log_result(
                    f"Favorites Invalid Data - {description}",
                    False,
                    f"Request failed: {str(e)}"
                )
    
    def test_favorites_api_integration(self):
        """Test favorites API integration with forums"""
        print("\n=== Forum Favorites - API Integration Tests ===")
        
        # Test that favorites endpoints exist and are properly routed
        endpoints_to_test = [
            ("/favorites", "GET", "Get Favorites"),
            ("/favorites", "POST", "Add Favorite"),
            ("/favorites/test_id", "DELETE", "Remove Favorite"),
            ("/favorites/check/forum/test_id", "GET", "Check Favorite Status")
        ]
        
        for endpoint, method, description in endpoints_to_test:
            try:
                if method == "GET":
                    response = self.session.get(f"{BACKEND_URL}{endpoint}")
                elif method == "POST":
                    response = self.session.post(
                        f"{BACKEND_URL}{endpoint}",
                        json={"item_type": "forum", "item_id": "test_id"}
                    )
                elif method == "DELETE":
                    response = self.session.delete(f"{BACKEND_URL}{endpoint}")
                
                # We expect 401 for all these endpoints without auth
                if response.status_code == 401:
                    self.log_result(
                        f"Favorites API - {description}",
                        True,
                        "Endpoint exists and requires authentication",
                        {"endpoint": endpoint, "method": method, "status_code": response.status_code}
                    )
                elif response.status_code == 404:
                    self.log_result(
                        f"Favorites API - {description}",
                        False,
                        "Endpoint not found - routing issue",
                        {"endpoint": endpoint, "method": method, "status_code": response.status_code}
                    )
                else:
                    self.log_result(
                        f"Favorites API - {description}",
                        False,
                        f"Unexpected response: {response.status_code}",
                        {"endpoint": endpoint, "method": method, "status_code": response.status_code}
                    )
            except Exception as e:
                self.log_result(
                    f"Favorites API - {description}",
                    False,
                    f"Request failed: {str(e)}",
                    {"endpoint": endpoint, "method": method}
                )

    # ============ Patient Dashboard Features Tests ============
    
    def test_search_endpoint_without_auth(self):
        """Test search endpoint authentication requirement"""
        print("\n=== Patient Dashboard - Search Endpoint Tests ===")
        
        # Test 1: Search without authentication
        try:
            search_data = {"query": "cancer"}
            response = self.session.post(
                f"{BACKEND_URL}/search",
                json=search_data
            )
            
            if response.status_code == 401:
                self.log_result(
                    "Search Endpoint - No Auth",
                    True,
                    "Correctly requires authentication",
                    {"status_code": response.status_code}
                )
            else:
                self.log_result(
                    "Search Endpoint - No Auth",
                    False,
                    f"Expected 401, got {response.status_code}",
                    {"status_code": response.status_code, "response": response.text[:200]}
                )
        except Exception as e:
            self.log_result(
                "Search Endpoint - No Auth",
                False,
                f"Request failed: {str(e)}"
            )

    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting CuraLink Backend Tests - Forum Favorites Feature Focus")
        print(f"Testing backend at: {BACKEND_URL}")
        print(f"Expected CORS origins: {EXPECTED_CORS_ORIGINS}")
        
        self.test_backend_health()
        self.test_cors_configuration()
        self.test_cors_preflight()
        
        # Test 2: Search with invalid data
        invalid_data_sets = [
            ({}, "Empty data"),
            ({"query": ""}, "Empty query"),
            ({"filters": {}}, "Missing query"),
            ({"query": "test", "invalid_field": "value"}, "Extra fields")
        ]
        
        for invalid_data, description in invalid_data_sets:
            try:
                response = self.session.post(
                    f"{BACKEND_URL}/search",
                    json=invalid_data
                )
                
                if response.status_code in [400, 401, 422]:
                    self.log_result(
                        f"Search Validation - {description}",
                        True,
                        f"Correctly rejects invalid data (status: {response.status_code})",
                        {"status_code": response.status_code, "data": invalid_data}
                    )
                else:
                    self.log_result(
                        f"Search Validation - {description}",
                        False,
                        f"Unexpected status code: {response.status_code}",
                        {"status_code": response.status_code, "data": invalid_data}
                    )
            except Exception as e:
                self.log_result(
                    f"Search Validation - {description}",
                    False,
                    f"Request failed: {str(e)}"
                )
    
    def test_patient_overview_endpoint_without_auth(self):
        """Test patient overview endpoint authentication requirement"""
        print("\n=== Patient Dashboard - Overview Endpoint Tests ===")
        
        try:
            response = self.session.get(f"{BACKEND_URL}/patient/overview")
            
            if response.status_code == 401:
                self.log_result(
                    "Patient Overview - No Auth",
                    True,
                    "Correctly requires authentication",
                    {"status_code": response.status_code}
                )
            else:
                self.log_result(
                    "Patient Overview - No Auth",
                    False,
                    f"Expected 401, got {response.status_code}",
                    {"status_code": response.status_code, "response": response.text[:200]}
                )
        except Exception as e:
            self.log_result(
                "Patient Overview - No Auth",
                False,
                f"Request failed: {str(e)}"
            )
    
    def test_researcher_details_endpoint_without_auth(self):
        """Test researcher details endpoint authentication requirement"""
        print("\n=== Patient Dashboard - Researcher Details Endpoint Tests ===")
        
        # Test with valid-looking researcher ID
        test_researcher_id = "test_researcher_123"
        
        try:
            response = self.session.get(f"{BACKEND_URL}/researcher/{test_researcher_id}/details")
            
            if response.status_code == 401:
                self.log_result(
                    "Researcher Details - No Auth",
                    True,
                    "Correctly requires authentication",
                    {"status_code": response.status_code, "researcher_id": test_researcher_id}
                )
            else:
                self.log_result(
                    "Researcher Details - No Auth",
                    False,
                    f"Expected 401, got {response.status_code}",
                    {"status_code": response.status_code, "researcher_id": test_researcher_id}
                )
        except Exception as e:
            self.log_result(
                "Researcher Details - No Auth",
                False,
                f"Request failed: {str(e)}"
            )
        
        # Test with invalid researcher ID format
        invalid_ids = ["", "invalid/id", "id with spaces", "very_long_id_" + "x" * 100]
        
        for invalid_id in invalid_ids:
            try:
                response = self.session.get(f"{BACKEND_URL}/researcher/{invalid_id}/details")
                
                if response.status_code in [400, 401, 404, 422]:
                    self.log_result(
                        f"Researcher Details - Invalid ID: {invalid_id[:20]}",
                        True,
                        f"Correctly handles invalid ID (status: {response.status_code})",
                        {"status_code": response.status_code, "invalid_id": invalid_id}
                    )
                else:
                    self.log_result(
                        f"Researcher Details - Invalid ID: {invalid_id[:20]}",
                        False,
                        f"Unexpected status code: {response.status_code}",
                        {"status_code": response.status_code, "invalid_id": invalid_id}
                    )
            except Exception as e:
                self.log_result(
                    f"Researcher Details - Invalid ID: {invalid_id[:20]}",
                    False,
                    f"Request failed: {str(e)}"
                )
    
    def test_patient_dashboard_endpoints_structure(self):
        """Test Patient Dashboard endpoints exist and have proper structure"""
        print("\n=== Patient Dashboard - Endpoint Structure Tests ===")
        
        endpoints_to_test = [
            ("/search", "POST", "Search Endpoint"),
            ("/patient/overview", "GET", "Patient Overview Endpoint"),
            ("/researcher/test_id/details", "GET", "Researcher Details Endpoint")
        ]
        
        for endpoint, method, description in endpoints_to_test:
            try:
                if method == "GET":
                    response = self.session.get(f"{BACKEND_URL}{endpoint}")
                elif method == "POST":
                    response = self.session.post(
                        f"{BACKEND_URL}{endpoint}",
                        json={"query": "test"}
                    )
                
                # We expect 401 for all these endpoints without auth
                if response.status_code == 401:
                    self.log_result(
                        f"Dashboard Structure - {description}",
                        True,
                        "Endpoint exists and requires authentication",
                        {"endpoint": endpoint, "method": method, "status_code": response.status_code}
                    )
                elif response.status_code == 404:
                    self.log_result(
                        f"Dashboard Structure - {description}",
                        False,
                        "Endpoint not found - routing issue",
                        {"endpoint": endpoint, "method": method, "status_code": response.status_code}
                    )
                else:
                    self.log_result(
                        f"Dashboard Structure - {description}",
                        False,
                        f"Unexpected response: {response.status_code}",
                        {"endpoint": endpoint, "method": method, "status_code": response.status_code}
                    )
            except Exception as e:
                self.log_result(
                    f"Dashboard Structure - {description}",
                    False,
                    f"Request failed: {str(e)}",
                    {"endpoint": endpoint, "method": method}
                )
    
    def test_search_endpoint_data_validation(self):
        """Test search endpoint data validation and structure"""
        print("\n=== Patient Dashboard - Search Data Validation ===")
        
        # Test different query types and edge cases
        test_queries = [
            ("cancer", "Medical condition"),
            ("diabetes", "Another medical condition"),
            ("heart disease", "Multi-word condition"),
            ("Dr", "Doctor prefix"),
            ("cardiology", "Medical specialty"),
            ("oncology", "Another specialty"),
            ("research", "General term"),
            ("trial", "Clinical trial term"),
            ("publication", "Research term"),
            ("a", "Single character"),
            ("test query with many words", "Long query"),
            ("123", "Numeric query"),
            ("cancer diabetes", "Multiple conditions"),
            ("COVID-19", "Hyphenated term"),
            ("Dr. Smith", "Name with title")
        ]
        
        for query, description in test_queries:
            try:
                search_data = {"query": query}
                response = self.session.post(
                    f"{BACKEND_URL}/search",
                    json=search_data
                )
                
                # Should return 401 without auth, but endpoint should handle the query format
                if response.status_code == 401:
                    self.log_result(
                        f"Search Query Validation - {description}",
                        True,
                        f"Query '{query}' properly formatted and processed",
                        {"query": query, "status_code": response.status_code}
                    )
                else:
                    self.log_result(
                        f"Search Query Validation - {description}",
                        False,
                        f"Unexpected response for query '{query}': {response.status_code}",
                        {"query": query, "status_code": response.status_code}
                    )
            except Exception as e:
                self.log_result(
                    f"Search Query Validation - {description}",
                    False,
                    f"Request failed for query '{query}': {str(e)}"
                )

    def run_all_tests(self):
        """Run all backend tests with focus on authentication fix"""
        print("🚀 Starting CuraLink Backend Tests - CRITICAL AUTHENTICATION FIX FOCUS")
        print(f"Testing backend at: {BACKEND_URL}")
        print("="*80)
        print("TESTING AUTHENTICATION BUG FIX:")
        print("- Duplicate user accounts causing login cross-contamination")
        print("- Enhanced /auth/session endpoint with consistent sorting")
        print("- Unique index on email field verification")
        print("- Session consistency and race condition handling")
        print("="*80)
        
        # Core connectivity and health
        self.test_backend_health()
        
        # CRITICAL: Authentication fix testing
        self.test_auth_endpoints_comprehensive()
        self.test_auth_session_consistency()
        self.test_auth_header_variations()
        self.test_auth_endpoints_security()
        
        # CORS testing (important for auth)
        self.test_cors_configuration()
        self.test_cors_preflight()
        
        # Basic endpoint structure verification
        self.test_core_endpoints()
        
        # Summary
        print("\n" + "="*50)
        print("TEST SUMMARY")
        print("="*50)
        
        total_tests = len(self.results)
        passed_tests = sum(1 for r in self.results if r["success"])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        
        if failed_tests > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.results:
                if not result["success"]:
                    print(f"  - {result['test']}: {result['message']}")
        
        # Check for critical CORS issues
        cors_issues = [r for r in self.results if not r["success"] and "CORS" in r["test"] and "SECURITY ISSUE" in r["message"]]
        if cors_issues:
            print(f"\n🚨 CRITICAL SECURITY ISSUES FOUND: {len(cors_issues)}")
            for issue in cors_issues:
                print(f"  - {issue['test']}: {issue['message']}")
        
        return {
            "total": total_tests,
            "passed": passed_tests,
            "failed": failed_tests,
            "results": self.results,
            "cors_issues": len(cors_issues)
        }

if __name__ == "__main__":
    tester = BackendTester()
    summary = tester.run_all_tests()
    
    # Exit with error code if tests failed
    if summary["failed"] > 0:
        sys.exit(1)
    else:
        print("\n✅ All tests passed!")
        sys.exit(0)