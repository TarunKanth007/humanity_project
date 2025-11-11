#!/usr/bin/env python3
"""
CuraLink Backend Testing Suite
Focus: CORS Configuration and Core API Endpoints
"""

import requests
import json
import sys
from typing import Dict, Any, Optional

# Backend URL from environment
BACKEND_URL = "https://curalink-connect.preview.emergentagent.com/api"

# Expected CORS origins
EXPECTED_CORS_ORIGINS = [
    "http://localhost:3000",
    "https://curalink-connect.preview.emergentagent.com", 
    "https://curalink-connect.preview.emergentagent.com"
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
    
    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting CuraLink Backend Tests")
        print(f"Testing backend at: {BACKEND_URL}")
        print(f"Expected CORS origins: {EXPECTED_CORS_ORIGINS}")
        
        self.test_backend_health()
        self.test_cors_configuration()
        self.test_cors_preflight()
        self.test_auth_endpoints()
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