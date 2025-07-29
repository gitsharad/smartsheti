import React, { useState } from 'react';
import { api } from '../services/authService';

const ApiTest = () => {
  const [testResult, setTestResult] = useState('');
  const [loading, setLoading] = useState(false);

  const testDirectConnection = async () => {
    setLoading(true);
    setTestResult('Testing direct connection to backend...');
    
    try {
      // Test direct connection to backend
      const response = await fetch('http://localhost:5000/api/v1/fields', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTestResult(`✅ Direct connection successful! Status: ${response.status}`);
        console.log('Direct connection response:', data);
      } else {
        const errorData = await response.json();
        setTestResult(`❌ Direct connection failed: ${response.status} - ${errorData.error || errorData.message?.english || 'Unknown error'}`);
      }
    } catch (error) {
      setTestResult(`❌ Direct connection failed: ${error.message}`);
      console.error('Direct connection error:', error);
    } finally {
      setLoading(false);
    }
  };

  const testAxiosConnection = async () => {
    setLoading(true);
    setTestResult('Testing axios connection...');
    
    try {
      // Test axios connection
      const response = await api.get('/fields');
      setTestResult(`✅ Axios connection successful! Status: ${response.status}`);
      console.log('Axios response:', response.data);
    } catch (error) {
      setTestResult(`❌ Axios connection failed: ${error.response?.data?.error || error.message}`);
      console.error('Axios error:', error);
    } finally {
      setLoading(false);
    }
  };

  const testFieldCreation = async () => {
    setLoading(true);
    setTestResult('Testing field creation...');
    
    try {
      const testField = {
        name: 'Test Field',
        fieldId: 'TEST001',
        location: {
          coordinates: {
            lat: 19.7515,
            lng: 75.7139
          },
          address: {
            state: 'Maharashtra',
            district: 'Aurangabad',
            village: 'Test Village'
          },
          area: {
            value: 5,
            unit: 'acres'
          }
        }
      };

      const response = await api.post('/fields', testField);
      setTestResult(`✅ Field creation successful! Status: ${response.status}`);
      console.log('Field creation response:', response.data);
    } catch (error) {
      setTestResult(`❌ Field creation failed: ${error.response?.data?.error || error.response?.data?.message?.english || error.message}`);
      console.error('Field creation error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">API Connection Test</h3>
      
      <div className="space-y-4">
        <button
          onClick={testDirectConnection}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Direct Connection'}
        </button>
        
        <button
          onClick={testAxiosConnection}
          disabled={loading}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 ml-2"
        >
          {loading ? 'Testing...' : 'Test Axios Connection'}
        </button>
        
        <button
          onClick={testFieldCreation}
          disabled={loading}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50 ml-2"
        >
          {loading ? 'Testing...' : 'Test Field Creation'}
        </button>
        
        <div className="mt-4 p-3 bg-gray-100 rounded">
          <strong>Result:</strong> {testResult}
        </div>
        
        <div className="mt-4 p-3 bg-yellow-100 rounded text-sm">
          <strong>Debug Info:</strong>
          <div>API URL: {api.defaults.baseURL}</div>
          <div>Token: {localStorage.getItem('accessToken') ? 'Present' : 'Missing'}</div>
          <div>User: {localStorage.getItem('user') ? 'Present' : 'Missing'}</div>
        </div>
      </div>
    </div>
  );
};

export default ApiTest; 