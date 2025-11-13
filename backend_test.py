#!/usr/bin/env python3
"""
CuraLink Backend Testing Suite
Focus: Forum Create/Delete Feature Testing
"""

import requests
import json
import sys
import uuid
from typing import Dict, Any, Optional

# Backend URL from environment
BACKEND_URL = "https://medbridge-21.preview.emergentagent.com/api"

# Expected CORS origins
EXPECTED_CORS_ORIGINS = [
    "http://localhost:3000",
    "https://medbridge-21.preview.emergentagent.com", 
    "https://medbridge-21.preview.emergentagent.com"
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
    
    def test_auth_endpoints(self):
        """Test authentication endpoints"""
        print("\n=== Authentication Endpoint Tests ===")
        
        # Test /api/auth/me without authentication
        try:
            response = self.session.get(f"{BACKEND_URL}/auth/me")
            
            if response.status_code == 401:
                self.log_result(
                    "Auth /me - Unauthenticated",
                    True,
                    "Correctly returns 401 for unauthenticated request",
                    {"status_code": response.status_code}
                )
            else:
                self.log_result(
                    "Auth /me - Unauthenticated",
                    False,
                    f"Unexpected status code: {response.status_code}",
                    {"status_code": response.status_code, "response": response.text[:200]}
                )
                
        except Exception as e:
            self.log_result(
                "Auth /me - Unauthenticated",
                False,
                f"Request failed: {str(e)}"
            )
        
        # Test /api/auth/session endpoint structure
        try:
            # This should fail without proper session_id, but we're testing the endpoint exists
            response = self.session.post(
                f"{BACKEND_URL}/auth/session",
                json={"session_id": "test_invalid_session"}
            )
            
            # We expect this to fail, but the endpoint should exist
            if response.status_code in [400, 401, 500]:
                self.log_result(
                    "Auth /session - Endpoint Exists",
                    True,
                    f"Endpoint exists and handles invalid session (status: {response.status_code})",
                    {"status_code": response.status_code}
                )
            else:
                self.log_result(
                    "Auth /session - Endpoint Exists",
                    False,
                    f"Unexpected response: {response.status_code}",
                    {"status_code": response.status_code, "response": response.text[:200]}
                )
                
        except Exception as e:
            self.log_result(
                "Auth /session - Endpoint Exists",
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

    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting CuraLink Backend Tests - Forum Favorites Feature Focus")
        print(f"Testing backend at: {BACKEND_URL}")
        print(f"Expected CORS origins: {EXPECTED_CORS_ORIGINS}")
        
        self.test_backend_health()
        self.test_cors_configuration()
        self.test_cors_preflight()
        self.test_auth_endpoints()
        self.test_core_endpoints()
        
        # Forum-specific tests
        self.test_forums_list_endpoint()
        self.test_forum_creation_without_auth()
        self.test_forum_creation_validation()
        self.test_forum_deletion_without_auth()
        self.test_forum_creation_and_deletion_flow()
        self.test_forum_api_structure()
        self.test_forum_role_based_access_simulation()
        
        # NEW: Forum Favorites Feature Tests
        self.test_forum_favorites_feature()
        self.test_favorites_api_integration()
        
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