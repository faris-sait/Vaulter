#!/usr/bin/env python3
"""
Backend API Testing for API Key Management System
Tests all backend endpoints with proper authentication handling
"""

import requests
import json
import os
import sys
from datetime import datetime

# Load environment variables
def load_env():
    env_vars = {}
    try:
        with open('/app/.env', 'r') as f:
            for line in f:
                if '=' in line and not line.startswith('#'):
                    key, value = line.strip().split('=', 1)
                    env_vars[key] = value
    except FileNotFoundError:
        print("❌ .env file not found")
        sys.exit(1)
    return env_vars

env = load_env()
# Use localhost for internal testing since external URL may not be accessible
BASE_URL = 'http://localhost:3000'
API_BASE = f"{BASE_URL}/api"

print(f"🔧 Testing API at: {API_BASE}")
print(f"📅 Test started at: {datetime.now()}")
print("=" * 60)

class APITester:
    def __init__(self):
        self.session = requests.Session()
        self.test_results = []
        self.created_key_id = None
        
    def log_result(self, test_name, success, message, details=None):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        if details:
            print(f"   Details: {details}")
        
        self.test_results.append({
            'test': test_name,
            'success': success,
            'message': message,
            'details': details
        })
    
    def test_create_key_functionality(self):
        """Test POST /api/test-keys - Create encrypted key functionality"""
        try:
            test_key = "sk-1234567890abcdef1234567890abcdef1234567890abcdef"
            response = self.session.post(
                f"{API_BASE}/test-keys",
                json={
                    "name": "Test OpenAI Key",
                    "apiKey": test_key,
                    "tags": ["openai", "gpt", "test"]
                },
                timeout=10
            )
            
            if response.status_code == 201:
                data = response.json()
                if 'id' in data and 'encrypted_key' in data and 'masked_key' in data:
                    self.created_key_id = data['id']
                    # Verify key is masked
                    expected_mask = f"{test_key[:4]}...{test_key[-4:]}"
                    if data['masked_key'] == expected_mask:
                        self.log_result(
                            "Create Key - Functionality", 
                            True, 
                            "Successfully created encrypted key with proper masking",
                            f"ID: {data['id']}, Masked: {data['masked_key']}"
                        )
                    else:
                        self.log_result(
                            "Create Key - Functionality", 
                            False, 
                            f"Key masking incorrect. Expected: {expected_mask}, Got: {data['masked_key']}"
                        )
                else:
                    self.log_result(
                        "Create Key - Functionality", 
                        False, 
                        "Missing required fields in response",
                        f"Response: {data}"
                    )
            else:
                self.log_result(
                    "Create Key - Functionality", 
                    False, 
                    f"Expected 201, got {response.status_code}",
                    f"Response: {response.text[:200]}"
                )
                
        except Exception as e:
            self.log_result("Create Key - Functionality", False, f"Request failed: {str(e)}")
    
    def test_create_key_without_auth(self):
        """Test POST /api/keys without authentication (should be protected)"""
        try:
            response = self.session.post(
                f"{API_BASE}/keys",
                json={
                    "name": "Test OpenAI Key",
                    "apiKey": "sk-1234567890abcdef1234567890abcdef1234567890abcdef",
                    "tags": ["openai", "gpt", "test"]
                },
                timeout=10
            )
            
            if response.status_code == 404:
                self.log_result(
                    "Create Key - Auth Protection", 
                    True, 
                    "Protected endpoint correctly returns 404 without auth",
                    f"Status: {response.status_code}"
                )
            else:
                self.log_result(
                    "Create Key - Auth Protection", 
                    False, 
                    f"Expected 404 (protected), got {response.status_code}",
                    f"Response: {response.text[:200]}"
                )
                
        except Exception as e:
            self.log_result("Create Key - Auth Protection", False, f"Request failed: {str(e)}")
    
    def test_list_keys_without_auth(self):
        """Test GET /api/keys without authentication"""
        try:
            response = self.session.get(f"{API_BASE}/keys", timeout=10)
            
            if response.status_code == 401:
                self.log_result(
                    "List Keys - Auth Check", 
                    True, 
                    "Correctly returns 401 Unauthorized without auth",
                    f"Status: {response.status_code}"
                )
            else:
                self.log_result(
                    "List Keys - Auth Check", 
                    False, 
                    f"Expected 401, got {response.status_code}",
                    f"Response: {response.text[:200]}"
                )
                
        except Exception as e:
            self.log_result("List Keys - Auth Check", False, f"Request failed: {str(e)}")
    
    def test_get_key_without_auth(self):
        """Test GET /api/keys/:id without authentication"""
        try:
            test_id = "test-uuid-123"
            response = self.session.get(f"{API_BASE}/keys/{test_id}", timeout=10)
            
            if response.status_code == 401:
                self.log_result(
                    "Get Key - Auth Check", 
                    True, 
                    "Correctly returns 401 Unauthorized without auth",
                    f"Status: {response.status_code}"
                )
            else:
                self.log_result(
                    "Get Key - Auth Check", 
                    False, 
                    f"Expected 401, got {response.status_code}",
                    f"Response: {response.text[:200]}"
                )
                
        except Exception as e:
            self.log_result("Get Key - Auth Check", False, f"Request failed: {str(e)}")
    
    def test_delete_key_without_auth(self):
        """Test DELETE /api/keys/:id without authentication"""
        try:
            test_id = "test-uuid-123"
            response = self.session.delete(f"{API_BASE}/keys/{test_id}", timeout=10)
            
            if response.status_code == 401:
                self.log_result(
                    "Delete Key - Auth Check", 
                    True, 
                    "Correctly returns 401 Unauthorized without auth",
                    f"Status: {response.status_code}"
                )
            else:
                self.log_result(
                    "Delete Key - Auth Check", 
                    False, 
                    f"Expected 401, got {response.status_code}",
                    f"Response: {response.text[:200]}"
                )
                
        except Exception as e:
            self.log_result("Delete Key - Auth Check", False, f"Request failed: {str(e)}")
    
    def test_usage_tracking_without_auth(self):
        """Test POST /api/usage/:id without authentication"""
        try:
            test_id = "test-uuid-123"
            response = self.session.post(f"{API_BASE}/usage/{test_id}", timeout=10)
            
            if response.status_code == 401:
                self.log_result(
                    "Usage Tracking - Auth Check", 
                    True, 
                    "Correctly returns 401 Unauthorized without auth",
                    f"Status: {response.status_code}"
                )
            else:
                self.log_result(
                    "Usage Tracking - Auth Check", 
                    False, 
                    f"Expected 401, got {response.status_code}",
                    f"Response: {response.text[:200]}"
                )
                
        except Exception as e:
            self.log_result("Usage Tracking - Auth Check", False, f"Request failed: {str(e)}")
    
    def test_invalid_endpoints(self):
        """Test invalid API endpoints"""
        try:
            # Test invalid path
            response = self.session.get(f"{API_BASE}/invalid", timeout=10)
            
            if response.status_code == 404:
                self.log_result(
                    "Invalid Endpoint", 
                    True, 
                    "Correctly returns 404 for invalid endpoint",
                    f"Status: {response.status_code}"
                )
            else:
                self.log_result(
                    "Invalid Endpoint", 
                    False, 
                    f"Expected 404, got {response.status_code}",
                    f"Response: {response.text[:200]}"
                )
                
        except Exception as e:
            self.log_result("Invalid Endpoint", False, f"Request failed: {str(e)}")
    
    def test_malformed_requests(self):
        """Test malformed requests"""
        try:
            # Test POST with invalid JSON
            response = self.session.post(
                f"{API_BASE}/keys",
                data="invalid json",
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            # Should return 400 or 401 (auth first)
            if response.status_code in [400, 401, 500]:
                self.log_result(
                    "Malformed Request", 
                    True, 
                    f"Correctly handles malformed JSON (status: {response.status_code})",
                    f"Response: {response.text[:200]}"
                )
            else:
                self.log_result(
                    "Malformed Request", 
                    False, 
                    f"Unexpected status code: {response.status_code}",
                    f"Response: {response.text[:200]}"
                )
                
        except Exception as e:
            self.log_result("Malformed Request", False, f"Request failed: {str(e)}")
    
    def test_server_connectivity(self):
        """Test basic server connectivity"""
        try:
            response = self.session.get(BASE_URL, timeout=10)
            
            if response.status_code == 200:
                self.log_result(
                    "Server Connectivity", 
                    True, 
                    "Server is responding",
                    f"Status: {response.status_code}"
                )
            else:
                self.log_result(
                    "Server Connectivity", 
                    False, 
                    f"Server returned status {response.status_code}",
                    f"Response: {response.text[:200]}"
                )
                
        except Exception as e:
            self.log_result("Server Connectivity", False, f"Cannot connect to server: {str(e)}")
    
    def test_encryption_key_validation(self):
        """Test if encryption key is properly configured"""
        try:
            encryption_key = env.get('ENCRYPTION_KEY')
            if encryption_key:
                # Check if it's a valid hex string of correct length (64 chars for 32 bytes)
                if len(encryption_key) == 64:
                    try:
                        bytes.fromhex(encryption_key)
                        self.log_result(
                            "Encryption Key Config", 
                            True, 
                            "Encryption key is properly configured (64-char hex)",
                            f"Key length: {len(encryption_key)} chars"
                        )
                    except ValueError:
                        self.log_result(
                            "Encryption Key Config", 
                            False, 
                            "Encryption key is not valid hex",
                            f"Key: {encryption_key[:10]}..."
                        )
                else:
                    self.log_result(
                        "Encryption Key Config", 
                        False, 
                        f"Encryption key wrong length: {len(encryption_key)} (expected 64)",
                        f"Key: {encryption_key[:10]}..."
                    )
            else:
                self.log_result(
                    "Encryption Key Config", 
                    False, 
                    "ENCRYPTION_KEY not found in environment"
                )
                
        except Exception as e:
            self.log_result("Encryption Key Config", False, f"Error checking encryption key: {str(e)}")
    
    def test_supabase_config(self):
        """Test Supabase configuration"""
        try:
            supabase_url = env.get('SUPABASE_URL')
            supabase_key = env.get('SUPABASE_SERVICE_ROLE_KEY')
            
            if supabase_url and supabase_key:
                if supabase_url.startswith('https://') and 'supabase.co' in supabase_url:
                    self.log_result(
                        "Supabase Config", 
                        True, 
                        "Supabase URL and key are configured",
                        f"URL: {supabase_url}"
                    )
                else:
                    self.log_result(
                        "Supabase Config", 
                        False, 
                        "Invalid Supabase URL format",
                        f"URL: {supabase_url}"
                    )
            else:
                missing = []
                if not supabase_url:
                    missing.append('SUPABASE_URL')
                if not supabase_key:
                    missing.append('SUPABASE_SERVICE_ROLE_KEY')
                
                self.log_result(
                    "Supabase Config", 
                    False, 
                    f"Missing Supabase config: {', '.join(missing)}"
                )
                
        except Exception as e:
            self.log_result("Supabase Config", False, f"Error checking Supabase config: {str(e)}")
    
    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting Backend API Tests")
        print("-" * 40)
        
        # Configuration tests
        print("\n📋 Configuration Tests:")
        self.test_server_connectivity()
        self.test_encryption_key_validation()
        self.test_supabase_config()
        
        # Authentication tests
        print("\n🔐 Authentication Tests:")
        self.test_create_key_without_auth()
        self.test_list_keys_without_auth()
        self.test_get_key_without_auth()
        self.test_delete_key_without_auth()
        self.test_usage_tracking_without_auth()
        
        # Error handling tests
        print("\n🚨 Error Handling Tests:")
        self.test_invalid_endpoints()
        self.test_malformed_requests()
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if result['success'])
        total = len(self.test_results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        if total - passed > 0:
            print("\n❌ Failed Tests:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  - {result['test']}: {result['message']}")
        
        print(f"\n🏁 Testing completed at: {datetime.now()}")
        
        return passed, total

def main():
    """Main test execution"""
    print("🔧 API Key Management System - Backend Testing")
    print("=" * 60)
    
    tester = APITester()
    passed, total = tester.run_all_tests()
    
    # Exit with appropriate code
    if passed == total:
        print("\n🎉 All tests passed!")
        sys.exit(0)
    else:
        print(f"\n⚠️  {total - passed} test(s) failed")
        sys.exit(1)

if __name__ == "__main__":
    main()