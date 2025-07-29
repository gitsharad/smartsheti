const axios = require('axios');

// Test the field creation endpoint
const testEndpoint = async () => {
  try {
    console.log('Testing field creation endpoint...');
    
    // First, try to get the fields endpoint (should exist)
    const getResponse = await axios.get('http://localhost:5000/api/v1/fields');
    console.log('✅ GET /api/v1/fields - Status:', getResponse.status);
    
    // Try to post to the fields endpoint (should require auth)
    try {
      const postResponse = await axios.post('http://localhost:5000/api/v1/fields', {
        name: 'Test Field',
        fieldId: 'TEST001'
      });
      console.log('❌ POST /api/v1/fields - Should have failed with 401, but got:', postResponse.status);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ POST /api/v1/fields - Correctly requires authentication (401)');
      } else {
        console.log('❌ POST /api/v1/fields - Unexpected error:', error.response?.status, error.response?.data);
      }
    }
    
    // Test fields endpoint (should require auth)
    try {
      const adminResponse = await axios.post('http://localhost:5000/api/v1/fields', {
        name: 'Test Field',
        fieldId: 'TEST002'
      });
      console.log('❌ POST /api/v1/fields - Should have failed with 401, but got:', adminResponse.status);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ POST /api/v1/fields - Correctly requires authentication (401)');
      } else {
        console.log('❌ POST /api/v1/fields - Unexpected error:', error.response?.status, error.response?.data);
      }
    }
    
    console.log('\nEndpoint test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('Make sure your server is running on port 5000');
    }
  }
};

// Run the test
testEndpoint(); 