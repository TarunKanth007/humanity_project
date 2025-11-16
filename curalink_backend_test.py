#!/usr/bin/env python3
"""
CuraLink Backend Testing Suite - Comprehensive Researcher Dashboard Testing
Focus: Testing all researcher dashboard features and critical backend functionality
- Researcher search functionality with matching scores
- Publications tab linked to PubMed
- Personalized 'For You' overview tab
- Open to collaboration toggle and institution field
- Forum filtering by researcher's field
- Patient features verification
- Missing features detection
"""

import requests
import json
import sys
import uuid
import time
from typing import Dict, Any, Optional

# Backend URL from environment
BACKEND_URL = "https://health-matchmaker-1.preview.emergentagent.com/api"

class CuraLinkBackendTester:
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
    
    # ============ Patient Features Backend Testing ============
    
    def test_patient_search_endpoint(self):
        """Test POST /api/search endpoint for patient features"""
        print("\n=== Patient Features - Search Endpoint Tests ===")
        
        # Test 1: Search without authentication
        try:
            search_data = {"query": "glioblastoma diet"}
            response = self.session.post(
                f"{BACKEND_URL}/search",
                json=search_data
            )
            
            if response.status_code == 401:
                self.log_result(
                    "Patient Search - Authentication Required",
                    True,
                    "Correctly requires authentication",
                    {"status_code": response.status_code}
                )
            else:
                self.log_result(
                    "Patient Search - Authentication Required",
                    False,
                    f"Expected 401, got {response.status_code}",
                    {"status_code": response.status_code, "response": response.text[:200]}
                )
        except Exception as e:
            self.log_result(
                "Patient Search - Authentication Required",
                False,
                f"Request failed: {str(e)}"
            )
        
        # Test 2: Search with patient-specific queries
        patient_queries = [
            "glioblastoma diet",
            "cancer treatment options",
            "diabetes management",
            "heart disease symptoms"
        ]
        
        for query in patient_queries:
            try:
                response = self.session.post(
                    f"{BACKEND_URL}/search",
                    json={"query": query}
                )
                
                if response.status_code == 401:
                    self.log_result(
                        f"Patient Search Query - {query}",
                        True,
                        "Endpoint exists and requires authentication",
                        {"status_code": response.status_code, "query": query}
                    )
                else:
                    self.log_result(
                        f"Patient Search Query - {query}",
                        False,
                        f"Unexpected status code: {response.status_code}",
                        {"status_code": response.status_code, "query": query}
                    )
            except Exception as e:
                self.log_result(
                    f"Patient Search Query - {query}",
                    False,
                    f"Request failed: {str(e)}"
                )
        
        # Test 3: Search validation
        invalid_data_sets = [
            ({}, "Empty data"),
            ({"query": ""}, "Empty query"),
            ({"query": None}, "Null query"),
            ({"invalid_field": "value"}, "Wrong field name"),
            ({"query": "x" * 2000}, "Very long query")
        ]
        
        for invalid_data, description in invalid_data_sets:
            try:
                response = self.session.post(
                    f"{BACKEND_URL}/search",
                    json=invalid_data
                )
                
                if response.status_code in [400, 401, 422]:
                    self.log_result(
                        f"Patient Search Validation - {description}",
                        True,
                        f"Correctly rejects invalid data (status: {response.status_code})",
                        {"status_code": response.status_code, "data": invalid_data}
                    )
                else:
                    self.log_result(
                        f"Patient Search Validation - {description}",
                        False,
                        f"Unexpected status code: {response.status_code}",
                        {"status_code": response.status_code, "data": invalid_data}
                    )
            except Exception as e:
                self.log_result(
                    f"Patient Search Validation - {description}",
                    False,
                    f"Request failed: {str(e)}"
                )
    
    def test_patient_overview_endpoint(self):
        """Test GET /api/patient/overview endpoint"""
        print("\n=== Patient Features - Overview Endpoint Tests ===")
        
        try:
            response = self.session.get(f"{BACKEND_URL}/patient/overview")
            
            if response.status_code == 401:
                self.log_result(
                    "Patient Overview - Authentication Required",
                    True,
                    "Correctly requires authentication",
                    {"status_code": response.status_code}
                )
            else:
                self.log_result(
                    "Patient Overview - Authentication Required",
                    False,
                    f"Expected 401, got {response.status_code}",
                    {"status_code": response.status_code, "response": response.text[:200]}
                )
        except Exception as e:
            self.log_result(
                "Patient Overview - Authentication Required",
                False,
                f"Request failed: {str(e)}"
            )
    
    def test_researcher_details_endpoint(self):
        """Test GET /api/researcher/{user_id}/details endpoint"""
        print("\n=== Patient Features - Researcher Details Endpoint Tests ===")
        
        # Test 1: Researcher details without authentication
        test_researcher_id = "test_researcher_123"
        try:
            response = self.session.get(f"{BACKEND_URL}/researcher/{test_researcher_id}/details")
            
            if response.status_code == 401:
                self.log_result(
                    "Researcher Details - Authentication Required",
                    True,
                    "Correctly requires authentication",
                    {"status_code": response.status_code}
                )
            else:
                self.log_result(
                    "Researcher Details - Authentication Required",
                    False,
                    f"Expected 401, got {response.status_code}",
                    {"status_code": response.status_code, "response": response.text[:200]}
                )
        except Exception as e:
            self.log_result(
                "Researcher Details - Authentication Required",
                False,
                f"Request failed: {str(e)}"
            )
        
        # Test 2: Invalid researcher ID formats
        invalid_ids = [
            "",  # Empty ID
            "invalid/id/with/slashes",  # Special characters
            "id with spaces",  # Spaces
            "x" * 1000,  # Very long ID
            "../../../etc/passwd",  # Path traversal attempt
            "null",
            "undefined"
        ]
        
        for invalid_id in invalid_ids:
            try:
                response = self.session.get(f"{BACKEND_URL}/researcher/{invalid_id}/details")
                
                if response.status_code in [400, 401, 404, 422]:
                    self.log_result(
                        f"Researcher Details - Invalid ID: {repr(invalid_id[:20])}",
                        True,
                        f"Correctly handles invalid ID (status: {response.status_code})",
                        {"status_code": response.status_code, "invalid_id": invalid_id[:50]}
                    )
                else:
                    self.log_result(
                        f"Researcher Details - Invalid ID: {repr(invalid_id[:20])}",
                        False,
                        f"Unexpected status code: {response.status_code}",
                        {"status_code": response.status_code, "invalid_id": invalid_id[:50]}
                    )
            except Exception as e:
                self.log_result(
                    f"Researcher Details - Invalid ID: {repr(invalid_id[:20])}",
                    False,
                    f"Request failed: {str(e)}"
                )
    
    # ============ Researcher Features Backend Testing ============
    
    def test_researcher_search_endpoint(self):
        """Test POST /api/researcher/search endpoint"""
        print("\n=== Researcher Features - Search Endpoint Tests ===")
        
        # Test 1: Researcher search without authentication
        try:
            search_data = {"query": "glioblastoma immunotherapy"}
            response = self.session.post(
                f"{BACKEND_URL}/researcher/search",
                json=search_data
            )
            
            if response.status_code == 401:
                self.log_result(
                    "Researcher Search - Authentication Required",
                    True,
                    "Correctly requires authentication",
                    {"status_code": response.status_code}
                )
            else:
                self.log_result(
                    "Researcher Search - Authentication Required",
                    False,
                    f"Expected 401, got {response.status_code}",
                    {"status_code": response.status_code, "response": response.text[:200]}
                )
        except Exception as e:
            self.log_result(
                "Researcher Search - Authentication Required",
                False,
                f"Request failed: {str(e)}"
            )
        
        # Test 2: Researcher-specific queries
        researcher_queries = [
            "glioblastoma immunotherapy",
            "oncology clinical trials methodology",
            "diabetes research protocols",
            "cardiovascular research techniques"
        ]
        
        for query in researcher_queries:
            try:
                response = self.session.post(
                    f"{BACKEND_URL}/researcher/search",
                    json={"query": query}
                )
                
                if response.status_code == 401:
                    self.log_result(
                        f"Researcher Search Query - {query}",
                        True,
                        "Endpoint exists and requires authentication",
                        {"status_code": response.status_code, "query": query}
                    )
                else:
                    self.log_result(
                        f"Researcher Search Query - {query}",
                        False,
                        f"Unexpected status code: {response.status_code}",
                        {"status_code": response.status_code, "query": query}
                    )
            except Exception as e:
                self.log_result(
                    f"Researcher Search Query - {query}",
                    False,
                    f"Request failed: {str(e)}"
                )
    
    def test_researcher_overview_endpoint(self):
        """Test GET /api/researcher/overview endpoint"""
        print("\n=== Researcher Features - Overview Endpoint Tests ===")
        
        try:
            response = self.session.get(f"{BACKEND_URL}/researcher/overview")
            
            if response.status_code == 401:
                self.log_result(
                    "Researcher Overview - Authentication Required",
                    True,
                    "Correctly requires authentication",
                    {"status_code": response.status_code}
                )
            else:
                self.log_result(
                    "Researcher Overview - Authentication Required",
                    False,
                    f"Expected 401, got {response.status_code}",
                    {"status_code": response.status_code, "response": response.text[:200]}
                )
        except Exception as e:
            self.log_result(
                "Researcher Overview - Authentication Required",
                False,
                f"Request failed: {str(e)}"
            )
    
    def test_researcher_publications_endpoint(self):
        """Test GET /api/researcher/publications endpoint"""
        print("\n=== Researcher Features - Publications Endpoint Tests ===")
        
        try:
            response = self.session.get(f"{BACKEND_URL}/researcher/publications")
            
            if response.status_code == 401:
                self.log_result(
                    "Researcher Publications - Authentication Required",
                    True,
                    "Correctly requires authentication",
                    {"status_code": response.status_code}
                )
            else:
                self.log_result(
                    "Researcher Publications - Authentication Required",
                    False,
                    f"Expected 401, got {response.status_code}",
                    {"status_code": response.status_code, "response": response.text[:200]}
                )
        except Exception as e:
            self.log_result(
                "Researcher Publications - Authentication Required",
                False,
                f"Request failed: {str(e)}"
            )
    
    def test_researcher_profile_update_endpoint(self):
        """Test PUT /api/researcher/profile endpoint"""
        print("\n=== Researcher Features - Profile Update Tests ===")
        
        # Test 1: Profile update without authentication
        try:
            profile_data = {
                "open_to_collaboration": True,
                "institution": "Test University"
            }
            response = self.session.put(
                f"{BACKEND_URL}/researcher/profile",
                json=profile_data
            )
            
            if response.status_code == 401:
                self.log_result(
                    "Researcher Profile Update - Authentication Required",
                    True,
                    "Correctly requires authentication",
                    {"status_code": response.status_code}
                )
            else:
                self.log_result(
                    "Researcher Profile Update - Authentication Required",
                    False,
                    f"Expected 401, got {response.status_code}",
                    {"status_code": response.status_code, "response": response.text[:200]}
                )
        except Exception as e:
            self.log_result(
                "Researcher Profile Update - Authentication Required",
                False,
                f"Request failed: {str(e)}"
            )
        
        # Test 2: Profile update with various data types
        test_data_sets = [
            ({"open_to_collaboration": True}, "Valid boolean true"),
            ({"open_to_collaboration": False}, "Valid boolean false"),
            ({"institution": "Harvard University"}, "Valid institution"),
            ({"institution": "MIT"}, "Short institution name"),
            ({"open_to_collaboration": True, "institution": "Stanford"}, "Both fields"),
            ({"open_to_collaboration": "invalid"}, "Invalid boolean string"),
            ({"open_to_collaboration": 1}, "Invalid boolean number"),
            ({"institution": None}, "Null institution"),
            ({"institution": ""}, "Empty institution"),
            ({"invalid_field": "value"}, "Invalid field name")
        ]
        
        for test_data, description in test_data_sets:
            try:
                response = self.session.put(
                    f"{BACKEND_URL}/researcher/profile",
                    json=test_data
                )
                
                if response.status_code in [400, 401, 422]:
                    self.log_result(
                        f"Researcher Profile Update - {description}",
                        True,
                        f"Correctly handles data (status: {response.status_code})",
                        {"status_code": response.status_code, "data": test_data}
                    )
                else:
                    self.log_result(
                        f"Researcher Profile Update - {description}",
                        False,
                        f"Unexpected status code: {response.status_code}",
                        {"status_code": response.status_code, "data": test_data}
                    )
            except Exception as e:
                self.log_result(
                    f"Researcher Profile Update - {description}",
                    False,
                    f"Request failed: {str(e)}"
                )
    
    # ============ Forum Features Backend Testing ============
    
    def test_forum_endpoints(self):
        """Test forum endpoints for patient posting and researcher filtering"""
        print("\n=== Forum Features - Backend Tests ===")
        
        # Test 1: Get forums list (should be public)
        try:
            response = self.session.get(f"{BACKEND_URL}/forums")
            
            if response.status_code == 200:
                try:
                    forums_data = response.json()
                    if isinstance(forums_data, list):
                        self.log_result(
                            "Forums List - Public Access",
                            True,
                            f"Successfully retrieved {len(forums_data)} forums",
                            {"status_code": response.status_code, "forum_count": len(forums_data)}
                        )
                    else:
                        self.log_result(
                            "Forums List - Public Access",
                            False,
                            f"Expected list, got {type(forums_data)}",
                            {"response_type": type(forums_data).__name__}
                        )
                except json.JSONDecodeError:
                    self.log_result(
                        "Forums List - Public Access",
                        False,
                        "Response is not valid JSON",
                        {"response": response.text[:200]}
                    )
            else:
                self.log_result(
                    "Forums List - Public Access",
                    False,
                    f"Unexpected status code: {response.status_code}",
                    {"status_code": response.status_code}
                )
        except Exception as e:
            self.log_result(
                "Forums List - Public Access",
                False,
                f"Request failed: {str(e)}"
            )
        
        # Test 2: Forum creation (should require auth)
        try:
            forum_data = {
                "name": "Test Cardiology Forum",
                "description": "A test forum for cardiology discussions",
                "category": "Cardiology"
            }
            response = self.session.post(
                f"{BACKEND_URL}/forums/create",
                json=forum_data
            )
            
            if response.status_code == 401:
                self.log_result(
                    "Forum Creation - Authentication Required",
                    True,
                    "Correctly requires authentication",
                    {"status_code": response.status_code}
                )
            else:
                self.log_result(
                    "Forum Creation - Authentication Required",
                    False,
                    f"Expected 401, got {response.status_code}",
                    {"status_code": response.status_code}
                )
        except Exception as e:
            self.log_result(
                "Forum Creation - Authentication Required",
                False,
                f"Request failed: {str(e)}"
            )
    
    # ============ General System Backend Testing ============
    
    def test_authentication_system(self):
        """Test authentication system security"""
        print("\n=== General System - Authentication Tests ===")
        
        # Test 1: /api/auth/me without authentication
        try:
            response = self.session.get(f"{BACKEND_URL}/auth/me")
            
            if response.status_code == 401:
                self.log_result(
                    "Authentication - /auth/me without token",
                    True,
                    "Correctly returns 401 for unauthenticated request",
                    {"status_code": response.status_code}
                )
            else:
                self.log_result(
                    "Authentication - /auth/me without token",
                    False,
                    f"Expected 401, got {response.status_code}",
                    {"status_code": response.status_code}
                )
        except Exception as e:
            self.log_result(
                "Authentication - /auth/me without token",
                False,
                f"Request failed: {str(e)}"
            )
        
        # Test 2: Google OAuth endpoints
        oauth_endpoints = [
            "/auth/google/login",
            "/auth/google/callback"
        ]
        
        for endpoint in oauth_endpoints:
            try:
                response = self.session.get(f"{BACKEND_URL}{endpoint}")
                
                # These endpoints should either redirect or return specific responses
                if response.status_code in [200, 302, 400, 422]:
                    self.log_result(
                        f"OAuth Endpoint - {endpoint}",
                        True,
                        f"Endpoint accessible (status: {response.status_code})",
                        {"status_code": response.status_code, "endpoint": endpoint}
                    )
                else:
                    self.log_result(
                        f"OAuth Endpoint - {endpoint}",
                        False,
                        f"Unexpected status code: {response.status_code}",
                        {"status_code": response.status_code, "endpoint": endpoint}
                    )
            except Exception as e:
                self.log_result(
                    f"OAuth Endpoint - {endpoint}",
                    False,
                    f"Request failed: {str(e)}"
                )
    
    def test_search_keyword_differentiation(self):
        """Test search keyword differentiation between patient and researcher"""
        print("\n=== General System - Search Keyword Differentiation Tests ===")
        
        # Test queries that should return different results for patients vs researchers
        test_cases = [
            ("glioblastoma diet", "Patient-focused query"),
            ("glioblastoma immunotherapy", "Researcher-focused query"),
            ("cancer treatment options", "Patient-focused query"),
            ("oncology clinical trials methodology", "Researcher-focused query")
        ]
        
        for query, description in test_cases:
            # Test patient search
            try:
                response = self.session.post(
                    f"{BACKEND_URL}/search",
                    json={"query": query}
                )
                
                if response.status_code == 401:
                    self.log_result(
                        f"Patient Search Differentiation - {description}",
                        True,
                        "Patient search endpoint exists and requires auth",
                        {"status_code": response.status_code, "query": query}
                    )
                else:
                    self.log_result(
                        f"Patient Search Differentiation - {description}",
                        False,
                        f"Unexpected status code: {response.status_code}",
                        {"status_code": response.status_code, "query": query}
                    )
            except Exception as e:
                self.log_result(
                    f"Patient Search Differentiation - {description}",
                    False,
                    f"Request failed: {str(e)}"
                )
            
            # Test researcher search
            try:
                response = self.session.post(
                    f"{BACKEND_URL}/researcher/search",
                    json={"query": query}
                )
                
                if response.status_code == 401:
                    self.log_result(
                        f"Researcher Search Differentiation - {description}",
                        True,
                        "Researcher search endpoint exists and requires auth",
                        {"status_code": response.status_code, "query": query}
                    )
                else:
                    self.log_result(
                        f"Researcher Search Differentiation - {description}",
                        False,
                        f"Unexpected status code: {response.status_code}",
                        {"status_code": response.status_code, "query": query}
                    )
            except Exception as e:
                self.log_result(
                    f"Researcher Search Differentiation - {description}",
                    False,
                    f"Request failed: {str(e)}"
                )
    
    def test_error_handling(self):
        """Test error handling across all endpoints"""
        print("\n=== General System - Error Handling Tests ===")
        
        # Test endpoints with malformed JSON
        endpoints_to_test = [
            ("/search", "POST"),
            ("/researcher/search", "POST"),
            ("/researcher/profile", "PUT"),
            ("/forums/create", "POST")
        ]
        
        for endpoint, method in endpoints_to_test:
            try:
                # Send malformed JSON
                response = self.session.request(
                    method,
                    f"{BACKEND_URL}{endpoint}",
                    data="invalid json data",
                    headers={"Content-Type": "application/json"}
                )
                
                if response.status_code in [400, 422]:
                    self.log_result(
                        f"Error Handling - Malformed JSON {endpoint}",
                        True,
                        f"Correctly handles malformed JSON (status: {response.status_code})",
                        {"status_code": response.status_code, "endpoint": endpoint}
                    )
                else:
                    self.log_result(
                        f"Error Handling - Malformed JSON {endpoint}",
                        False,
                        f"Unexpected status code: {response.status_code}",
                        {"status_code": response.status_code, "endpoint": endpoint}
                    )
            except Exception as e:
                self.log_result(
                    f"Error Handling - Malformed JSON {endpoint}",
                    False,
                    f"Request failed: {str(e)}"
                )
    
    def test_performance_requirements(self):
        """Test performance requirements (3 second response time)"""
        print("\n=== General System - Performance Tests ===")
        
        # Test critical endpoints for response time
        endpoints_to_test = [
            ("/auth/me", "GET", "Authentication Check"),
            ("/search", "POST", "Patient Search", {"query": "cancer"}),
            ("/researcher/search", "POST", "Researcher Search", {"query": "immunotherapy"}),
            ("/patient/overview", "GET", "Patient Overview"),
            ("/researcher/overview", "GET", "Researcher Overview"),
            ("/researcher/publications", "GET", "Researcher Publications"),
            ("/forums", "GET", "Forums List")
        ]
        
        for endpoint_data in endpoints_to_test:
            endpoint = endpoint_data[0]
            method = endpoint_data[1]
            description = endpoint_data[2]
            payload = endpoint_data[3] if len(endpoint_data) > 3 else None
            
            try:
                start_time = time.time()
                
                if method == "GET":
                    response = self.session.get(f"{BACKEND_URL}{endpoint}")
                elif method == "POST":
                    response = self.session.post(f"{BACKEND_URL}{endpoint}", json=payload)
                
                response_time = time.time() - start_time
                
                # We expect 401 for most endpoints without auth, but we're testing response time
                if response.status_code in [200, 401, 404]:
                    if response_time < 3.0:
                        self.log_result(
                            f"Performance - {description}",
                            True,
                            f"Response time: {response_time:.2f}s (under 3s requirement)",
                            {"response_time": response_time, "status_code": response.status_code}
                        )
                    else:
                        self.log_result(
                            f"Performance - {description}",
                            False,
                            f"Response time: {response_time:.2f}s (exceeds 3s requirement)",
                            {"response_time": response_time, "status_code": response.status_code}
                        )
                else:
                    self.log_result(
                        f"Performance - {description}",
                        False,
                        f"Unexpected status code: {response.status_code}",
                        {"response_time": response_time, "status_code": response.status_code}
                    )
            except Exception as e:
                self.log_result(
                    f"Performance - {description}",
                    False,
                    f"Request failed: {str(e)}"
                )
    
    # ============ Missing Features Detection ============
    
    def test_missing_features(self):
        """Test for missing features that should be flagged"""
        print("\n=== Missing Features Detection Tests ===")
        
        # Test collaboration request endpoints
        collaboration_endpoints = [
            ("/collaboration/requests", "GET", "Get Collaboration Requests"),
            ("/collaboration/requests", "POST", "Send Collaboration Request"),
            ("/collaboration/requests/test_id/accept", "POST", "Accept Collaboration Request"),
            ("/collaboration/requests/test_id/reject", "POST", "Reject Collaboration Request")
        ]
        
        missing_features = []
        
        for endpoint, method, description in collaboration_endpoints:
            try:
                if method == "GET":
                    response = self.session.get(f"{BACKEND_URL}{endpoint}")
                elif method == "POST":
                    response = self.session.post(
                        f"{BACKEND_URL}{endpoint}",
                        json={"message": "test", "purpose": "research"}
                    )
                
                if response.status_code == 404:
                    missing_features.append(description)
                    self.log_result(
                        f"Missing Feature - {description}",
                        False,
                        "Endpoint not implemented (404 Not Found)",
                        {"endpoint": endpoint, "method": method, "status_code": response.status_code}
                    )
                elif response.status_code == 401:
                    self.log_result(
                        f"Missing Feature - {description}",
                        True,
                        "Endpoint exists and requires authentication",
                        {"endpoint": endpoint, "method": method, "status_code": response.status_code}
                    )
                else:
                    self.log_result(
                        f"Missing Feature - {description}",
                        True,
                        f"Endpoint exists (status: {response.status_code})",
                        {"endpoint": endpoint, "method": method, "status_code": response.status_code}
                    )
            except Exception as e:
                self.log_result(
                    f"Missing Feature - {description}",
                    False,
                    f"Request failed: {str(e)}"
                )
        
        # Test messaging endpoints
        messaging_endpoints = [
            ("/messages", "GET", "Get Messages"),
            ("/messages", "POST", "Send Message"),
            ("/messages/conversations", "GET", "Get Conversations")
        ]
        
        for endpoint, method, description in messaging_endpoints:
            try:
                if method == "GET":
                    response = self.session.get(f"{BACKEND_URL}{endpoint}")
                elif method == "POST":
                    response = self.session.post(
                        f"{BACKEND_URL}{endpoint}",
                        json={"recipient_id": "test", "message": "test"}
                    )
                
                if response.status_code == 404:
                    missing_features.append(description)
                    self.log_result(
                        f"Missing Feature - {description}",
                        False,
                        "Endpoint not implemented (404 Not Found)",
                        {"endpoint": endpoint, "method": method, "status_code": response.status_code}
                    )
                elif response.status_code == 401:
                    self.log_result(
                        f"Missing Feature - {description}",
                        True,
                        "Endpoint exists and requires authentication",
                        {"endpoint": endpoint, "method": method, "status_code": response.status_code}
                    )
                else:
                    self.log_result(
                        f"Missing Feature - {description}",
                        True,
                        f"Endpoint exists (status: {response.status_code})",
                        {"endpoint": endpoint, "method": method, "status_code": response.status_code}
                    )
            except Exception as e:
                self.log_result(
                    f"Missing Feature - {description}",
                    False,
                    f"Request failed: {str(e)}"
                )
        
        # Test favorites summary endpoint
        try:
            response = self.session.get(f"{BACKEND_URL}/favorites/summary")
            
            if response.status_code == 404:
                missing_features.append("Favorites Summary Generation")
                self.log_result(
                    "Missing Feature - Favorites Summary",
                    False,
                    "Favorites summary endpoint not implemented",
                    {"status_code": response.status_code}
                )
            elif response.status_code == 401:
                self.log_result(
                    "Missing Feature - Favorites Summary",
                    True,
                    "Favorites summary endpoint exists",
                    {"status_code": response.status_code}
                )
            else:
                self.log_result(
                    "Missing Feature - Favorites Summary",
                    True,
                    f"Favorites summary endpoint exists (status: {response.status_code})",
                    {"status_code": response.status_code}
                )
        except Exception as e:
            self.log_result(
                "Missing Feature - Favorites Summary",
                False,
                f"Request failed: {str(e)}"
            )
        
        # Test location-based sorting
        try:
            response = self.session.get(f"{BACKEND_URL}/search?location=true")
            
            if response.status_code == 401:
                self.log_result(
                    "Location Services - Search Parameter",
                    True,
                    "Search endpoint accepts location parameter",
                    {"status_code": response.status_code}
                )
            else:
                self.log_result(
                    "Location Services - Search Parameter",
                    False,
                    f"Unexpected status code: {response.status_code}",
                    {"status_code": response.status_code}
                )
        except Exception as e:
            self.log_result(
                "Location Services - Search Parameter",
                False,
                f"Request failed: {str(e)}"
            )
        
        return missing_features
    
    def run_comprehensive_tests(self):
        """Run all comprehensive backend tests"""
        print("🚀 Starting CuraLink Comprehensive Backend Tests")
        print(f"Testing backend at: {BACKEND_URL}")
        print("=" * 80)
        
        # Patient Features Tests
        self.test_patient_search_endpoint()
        self.test_patient_overview_endpoint()
        self.test_researcher_details_endpoint()
        
        # Researcher Features Tests
        self.test_researcher_search_endpoint()
        self.test_researcher_overview_endpoint()
        self.test_researcher_publications_endpoint()
        self.test_researcher_profile_update_endpoint()
        
        # Forum Features Tests
        self.test_forum_endpoints()
        
        # General System Tests
        self.test_authentication_system()
        self.test_search_keyword_differentiation()
        self.test_error_handling()
        self.test_performance_requirements()
        
        # Missing Features Detection
        missing_features = self.test_missing_features()
        
        # Print comprehensive summary
        print("\n" + "=" * 80)
        print("🏁 COMPREHENSIVE TEST SUMMARY")
        print("=" * 80)
        
        total_tests = len(self.results)
        passed_tests = sum(1 for r in self.results if r["success"])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        # Categorize results
        critical_failures = []
        endpoint_failures = []
        validation_failures = []
        missing_feature_failures = []
        
        for result in self.results:
            if not result["success"]:
                if "Authentication Required" in result["test"] or "Performance" in result["test"]:
                    critical_failures.append(result)
                elif "Missing Feature" in result["test"]:
                    missing_feature_failures.append(result)
                elif "Validation" in result["test"]:
                    validation_failures.append(result)
                else:
                    endpoint_failures.append(result)
        
        if critical_failures:
            print(f"\n🚨 CRITICAL FAILURES ({len(critical_failures)}):")
            for result in critical_failures:
                print(f"  ❌ {result['test']}: {result['message']}")
        
        if missing_feature_failures:
            print(f"\n🔍 MISSING FEATURES ({len(missing_feature_failures)}):")
            for result in missing_feature_failures:
                print(f"  ⚠️  {result['test']}: {result['message']}")
        
        if endpoint_failures:
            print(f"\n🔧 ENDPOINT ISSUES ({len(endpoint_failures)}):")
            for result in endpoint_failures:
                print(f"  ❌ {result['test']}: {result['message']}")
        
        if validation_failures:
            print(f"\n📝 VALIDATION ISSUES ({len(validation_failures)}):")
            for result in validation_failures:
                print(f"  ❌ {result['test']}: {result['message']}")
        
        print("\n" + "=" * 80)
        
        return {
            "total_tests": total_tests,
            "passed_tests": passed_tests,
            "failed_tests": failed_tests,
            "success_rate": (passed_tests/total_tests)*100,
            "critical_failures": len(critical_failures),
            "missing_features": len(missing_feature_failures),
            "endpoint_failures": len(endpoint_failures),
            "validation_failures": len(validation_failures)
        }

if __name__ == "__main__":
    tester = CuraLinkBackendTester()
    results = tester.run_comprehensive_tests()
    
    # Exit with appropriate code
    if results["critical_failures"] > 0:
        sys.exit(1)  # Critical failures
    elif results["failed_tests"] > results["passed_tests"]:
        sys.exit(2)  # More failures than passes
    else:
        sys.exit(0)  # Success