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
    
    def test_list_keys_functionality(self):
        """Test GET /api/test-keys - List keys functionality"""
        try:
            response = self.session.get(f"{API_BASE}/test-keys", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if 'keys' in data and isinstance(data['keys'], list):
                    self.log_result(
                        "List Keys - Functionality", 
                        True, 
                        f"Successfully retrieved keys list with {len(data['keys'])} keys",
                        f"Response structure correct"
                    )
                else:
                    self.log_result(
                        "List Keys - Functionality", 
                        False, 
                        "Invalid response structure",
                        f"Response: {data}"
                    )
            else:
                self.log_result(
                    "List Keys - Functionality", 
                    False, 
                    f"Expected 200, got {response.status_code}",
                    f"Response: {response.text[:200]}"
                )
                
        except Exception as e:
            self.log_result("List Keys - Functionality", False, f"Request failed: {str(e)}")
    
    def test_list_keys_without_auth(self):
        """Test GET /api/keys without authentication (should be protected)"""
        try:
            response = self.session.get(f"{API_BASE}/keys", timeout=10)
            
            if response.status_code == 404:
                self.log_result(
                    "List Keys - Auth Protection", 
                    True, 
                    "Protected endpoint correctly returns 404 without auth",
                    f"Status: {response.status_code}"
                )
            else:
                self.log_result(
                    "List Keys - Auth Protection", 
                    False, 
                    f"Expected 404 (protected), got {response.status_code}",
                    f"Response: {response.text[:200]}"
                )
                
        except Exception as e:
            self.log_result("List Keys - Auth Protection", False, f"Request failed: {str(e)}")
    
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
    
    def test_validation_errors(self):
        """Test validation errors with test endpoints"""
        try:
            # Test POST with missing required fields
            response = self.session.post(
                f"{API_BASE}/test-keys",
                json={"name": "Test Key"},  # Missing apiKey
                timeout=10
            )
            
            if response.status_code == 400:
                data = response.json()
                if 'error' in data and 'required' in data['error'].lower():
                    self.log_result(
                        "Validation - Missing Fields", 
                        True, 
                        "Correctly validates required fields",
                        f"Error: {data['error']}"
                    )
                else:
                    self.log_result(
                        "Validation - Missing Fields", 
                        False, 
                        "Error message doesn't indicate missing required fields",
                        f"Response: {data}"
                    )
            else:
                self.log_result(
                    "Validation - Missing Fields", 
                    False, 
                    f"Expected 400, got {response.status_code}",
                    f"Response: {response.text[:200]}"
                )
                
        except Exception as e:
            self.log_result("Validation - Missing Fields", False, f"Request failed: {str(e)}")
    
    def test_get_key_functionality(self):
        """Test GET /api/test-keys/:id - Get specific key"""
        try:
            if not self.created_key_id:
                # Create a key first
                response = self.session.post(
                    f"{API_BASE}/test-keys",
                    json={
                        "name": "Get Test Key",
                        "apiKey": "sk-gettest123456789abcdef123456789abcdef",
                        "tags": ["test", "get"]
                    },
                    timeout=10
                )
                if response.status_code == 201:
                    self.created_key_id = response.json()['id']
            
            if self.created_key_id:
                # Test getting key without decryption
                response = self.session.get(f"{API_BASE}/test-keys/{self.created_key_id}", timeout=10)
                
                if response.status_code == 200:
                    data = response.json()
                    if 'id' in data and 'masked_key' in data and 'decrypted_key' not in data:
                        self.log_result(
                            "Get Key - Basic", 
                            True, 
                            "Successfully retrieved key without decryption",
                            f"ID: {data['id']}, Masked: {data['masked_key']}"
                        )
                    else:
                        self.log_result(
                            "Get Key - Basic", 
                            False, 
                            "Invalid response structure or unexpected decryption",
                            f"Response keys: {list(data.keys())}"
                        )
                else:
                    self.log_result(
                        "Get Key - Basic", 
                        False, 
                        f"Expected 200, got {response.status_code}",
                        f"Response: {response.text[:200]}"
                    )
            else:
                self.log_result("Get Key - Basic", False, "No key ID available for testing")
                
        except Exception as e:
            self.log_result("Get Key - Basic", False, f"Request failed: {str(e)}")
    
    def test_decrypt_key_functionality(self):
        """Test GET /api/test-keys/:id?decrypt=true - Get decrypted key"""
        try:
            if self.created_key_id:
                # Test getting key with decryption
                response = self.session.get(f"{API_BASE}/test-keys/{self.created_key_id}?decrypt=true", timeout=10)
                
                if response.status_code == 200:
                    data = response.json()
                    if 'decrypted_key' in data and data['decrypted_key'].startswith('sk-'):
                        self.log_result(
                            "Decrypt Key", 
                            True, 
                            "Successfully decrypted key",
                            f"Decrypted key starts with: {data['decrypted_key'][:10]}..."
                        )
                    else:
                        self.log_result(
                            "Decrypt Key", 
                            False, 
                            "Decrypted key not found or invalid format",
                            f"Response: {data}"
                        )
                else:
                    self.log_result(
                        "Decrypt Key", 
                        False, 
                        f"Expected 200, got {response.status_code}",
                        f"Response: {response.text[:200]}"
                    )
            else:
                self.log_result("Decrypt Key", False, "No key ID available for testing")
                
        except Exception as e:
            self.log_result("Decrypt Key", False, f"Request failed: {str(e)}")
    
    def test_usage_tracking_functionality(self):
        """Test POST /api/test-usage/:id - Log usage event"""
        try:
            if self.created_key_id:
                # Test usage tracking
                response = self.session.post(f"{API_BASE}/test-usage/{self.created_key_id}", timeout=10)
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get('success'):
                        # Verify usage was tracked by getting the key
                        get_response = self.session.get(f"{API_BASE}/test-keys/{self.created_key_id}", timeout=10)
                        if get_response.status_code == 200:
                            key_data = get_response.json()
                            if key_data.get('usage_count', 0) > 0:
                                self.log_result(
                                    "Usage Tracking", 
                                    True, 
                                    f"Successfully tracked usage (count: {key_data['usage_count']})",
                                    f"Last used: {key_data.get('last_used', 'N/A')}"
                                )
                            else:
                                self.log_result(
                                    "Usage Tracking", 
                                    False, 
                                    "Usage count not incremented",
                                    f"Usage count: {key_data.get('usage_count', 0)}"
                                )
                        else:
                            self.log_result("Usage Tracking", False, "Could not verify usage tracking")
                    else:
                        self.log_result(
                            "Usage Tracking", 
                            False, 
                            "Usage tracking did not return success",
                            f"Response: {data}"
                        )
                else:
                    self.log_result(
                        "Usage Tracking", 
                        False, 
                        f"Expected 200, got {response.status_code}",
                        f"Response: {response.text[:200]}"
                    )
            else:
                self.log_result("Usage Tracking", False, "No key ID available for testing")
                
        except Exception as e:
            self.log_result("Usage Tracking", False, f"Request failed: {str(e)}")
    
    def test_delete_key_functionality(self):
        """Test DELETE /api/test-keys/:id - Delete key"""
        try:
            if self.created_key_id:
                # Test deleting key
                response = self.session.delete(f"{API_BASE}/test-keys/{self.created_key_id}", timeout=10)
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get('success'):
                        # Verify key was deleted by trying to get it
                        get_response = self.session.get(f"{API_BASE}/test-keys/{self.created_key_id}", timeout=10)
                        if get_response.status_code == 404:
                            self.log_result(
                                "Delete Key", 
                                True, 
                                "Successfully deleted key",
                                f"Key ID: {self.created_key_id}"
                            )
                            self.created_key_id = None  # Clear for cleanup
                        else:
                            self.log_result(
                                "Delete Key", 
                                False, 
                                "Key still exists after deletion",
                                f"Get response: {get_response.status_code}"
                            )
                    else:
                        self.log_result(
                            "Delete Key", 
                            False, 
                            "Delete did not return success",
                            f"Response: {data}"
                        )
                else:
                    self.log_result(
                        "Delete Key", 
                        False, 
                        f"Expected 200, got {response.status_code}",
                        f"Response: {response.text[:200]}"
                    )
            else:
                self.log_result("Delete Key", False, "No key ID available for testing")
                
        except Exception as e:
            self.log_result("Delete Key", False, f"Request failed: {str(e)}")
    
    def test_encryption_decryption(self):
        """Test encryption and decryption functionality"""
        try:
            # First create a key
            test_key = "sk-test123456789abcdef123456789abcdef123456789abcdef"
            response = self.session.post(
                f"{API_BASE}/test-keys",
                json={
                    "name": "Encryption Test Key",
                    "apiKey": test_key,
                    "tags": ["test", "encryption"]
                },
                timeout=10
            )
            
            if response.status_code == 201:
                created_key = response.json()
                key_id = created_key['id']
                
                # Verify the key is encrypted (encrypted_key should be different from original)
                if created_key['encrypted_key'] != test_key and len(created_key['encrypted_key']) > 0:
                    # Verify masking
                    expected_mask = f"{test_key[:4]}...{test_key[-4:]}"
                    if created_key['masked_key'] == expected_mask:
                        self.log_result(
                            "Encryption/Decryption", 
                            True, 
                            "Key properly encrypted and masked",
                            f"Original length: {len(test_key)}, Encrypted length: {len(created_key['encrypted_key'])}, Mask: {created_key['masked_key']}"
                        )
                        
                        # Store for other tests
                        if not self.created_key_id:
                            self.created_key_id = key_id
                    else:
                        self.log_result(
                            "Encryption/Decryption", 
                            False, 
                            f"Key masking incorrect. Expected: {expected_mask}, Got: {created_key['masked_key']}"
                        )
                else:
                    self.log_result(
                        "Encryption/Decryption", 
                        False, 
                        "Key doesn't appear to be encrypted",
                        f"Original: {test_key[:10]}..., Encrypted: {created_key['encrypted_key'][:10]}..."
                    )
            else:
                self.log_result(
                    "Encryption/Decryption", 
                    False, 
                    f"Failed to create test key: {response.status_code}",
                    f"Response: {response.text[:200]}"
                )
                
        except Exception as e:
            self.log_result("Encryption/Decryption", False, f"Request failed: {str(e)}")
    
    def test_malformed_requests(self):
        """Test malformed requests"""
        try:
            # Test POST with invalid JSON to test endpoint
            response = self.session.post(
                f"{API_BASE}/test-keys",
                data="invalid json",
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            # Should return 400 or 500 for malformed JSON
            if response.status_code in [400, 500]:
                self.log_result(
                    "Malformed Request", 
                    True, 
                    f"Correctly handles malformed JSON (status: {response.status_code})",
                    f"Status: {response.status_code}"
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
        
        # Functionality tests
        print("\n🔧 Core Functionality Tests:")
        self.test_create_key_functionality()
        self.test_list_keys_functionality()
        self.test_encryption_decryption()
        self.test_get_key_functionality()
        self.test_decrypt_key_functionality()
        self.test_usage_tracking_functionality()
        self.test_delete_key_functionality()
        
        # Authentication tests
        print("\n🔐 Authentication Protection Tests:")
        self.test_create_key_without_auth()
        self.test_list_keys_without_auth()
        self.test_get_key_without_auth()
        self.test_delete_key_without_auth()
        self.test_usage_tracking_without_auth()
        
        # Error handling tests
        print("\n🚨 Error Handling Tests:")
        self.test_validation_errors()
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