import React, { useEffect, useState } from 'react';
import apiRoutes from '../services/apiRoutes';
import { api } from '../services/authService';
import { FiUser, FiArrowLeft, FiEdit3, FiSave, FiX, FiCamera, FiMapPin, FiPhone, FiMail, FiGlobe, FiShield } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import PasswordChangeModal from '../components/PasswordChangeModal';
import TwoFactorAuth from '../components/TwoFactorAuth';
import LoginHistory from '../components/LoginHistory';

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fields, setFields] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({});
  const [validationErrors, setValidationErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');

  // Security modals state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showTwoFactorModal, setShowTwoFactorModal] = useState(false);
  const [showLoginHistoryModal, setShowLoginHistoryModal] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await apiRoutes.getProfile();
        setProfile(response.data.user);
        setFields(response.data.fields || []);
        setFormData({
          name: response.data.user?.name || '',
          email: response.data.user?.email || '',
          phoneNumber: response.data.user?.phoneNumber || '',
          address: response.data.user?.address || '',
          village: response.data.user?.village || '',
          district: response.data.user?.district || '',
          state: response.data.user?.state || '',
          pincode: response.data.user?.pincode || '',
          preferredLanguage: response.data.user?.preferredLanguage || 'marathi',
          notificationPreferences: response.data.user?.notificationPreferences || {
            email: true,
            sms: true,
            push: true,
            alerts: true,
            reports: true
          },
          profileImage: response.data.user?.profileImage || ''
        });
        setError(null);
      } catch (err) {
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('notification.')) {
      // Handle notification preferences
      const notificationType = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        notificationPreferences: {
          ...prev.notificationPreferences,
          [notificationType]: checked
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
    
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'नाव आवश्यक आहे';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'ईमेल आवश्यक आहे';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'वैध ईमेल पता प्रविष्ट करा';
    }
    
    if (formData.phoneNumber && !/^[0-9]{10}$/.test(formData.phoneNumber)) {
      errors.phoneNumber = 'वैध फोन नंबर प्रविष्ट करा (10 अंक)';
    }
    
    if (formData.pincode && !/^[0-9]{6}$/.test(formData.pincode)) {
      errors.pincode = 'वैध पिनकोड प्रविष्ट करा (6 अंक)';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);
      
      // Create a clean object with only the fields we want to update
      const updateData = {
        name: formData.name,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        address: formData.address,
        village: formData.village,
        district: formData.district,
        state: formData.state,
        pincode: formData.pincode,
        preferredLanguage: formData.preferredLanguage,
        notificationPreferences: formData.notificationPreferences,
        profileImage: formData.profileImage
      };
      
      // Log what we're sending to the server
      console.log('Sending profile update data:', updateData);
      console.log('API URL being used:', window.location.origin + '/api/v1/auth/profile');
      console.log('Environment:', process.env.NODE_ENV);
      console.log('Current origin:', window.location.origin);
      console.log('Current hostname:', window.location.hostname);
      
      // Test the data structure
      console.log('Data type:', typeof updateData);
      console.log('Data keys:', Object.keys(updateData));
      console.log('Data stringified:', JSON.stringify(updateData, null, 2));
      
      await apiRoutes.updateProfile(updateData);
      
      // Update local profile state
      setProfile(prev => ({
        ...prev,
        ...updateData
      }));
      
      setIsEditing(false);
      setSuccessMessage('प्रोफाइल यशस्वीरित्या अपडेट केले!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Profile update error:', err.response?.data || err);
      console.error('Error status:', err.response?.status);
      console.error('Error headers:', err.response?.headers);
      console.error('Full error object:', err);
      
      // Log the detailed error response
      if (err.response?.data) {
        console.error('Error response data:', err.response.data);
        if (err.response.data.invalidFields) {
          console.error('Invalid fields:', err.response.data.invalidFields);
        }
        if (err.response.data.receivedFields) {
          console.error('Received fields:', err.response.data.receivedFields);
        }
        if (err.response.data.allowedFields) {
          console.error('Allowed fields:', err.response.data.allowedFields);
        }
        if (err.response.data.debug) {
          console.error('Debug info:', err.response.data.debug);
        }
      }
      
      setError('प्रोफाइल अपडेट करताना त्रुटी आली');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setValidationErrors({});
    // Reset form data to original profile
    setFormData({
      name: profile?.name || '',
      email: profile?.email || '',
      phoneNumber: profile?.phoneNumber || '',
      address: profile?.address || '',
      village: profile?.village || '',
      district: profile?.district || '',
      state: profile?.state || '',
      pincode: profile?.pincode || '',
      preferredLanguage: profile?.preferredLanguage || 'marathi',
      notificationPreferences: profile?.notificationPreferences || {
        email: true,
        sms: true,
        push: true,
        alerts: true,
        reports: true
      },
      profileImage: profile?.profileImage || ''
    });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData(prev => ({
          ...prev,
          profileImage: e.target.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePasswordChangeSuccess = () => {
    setSuccessMessage('पासवर्ड यशस्वीरित्या बदलला!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // Test function to debug what's being sent
  const testEcho = async () => {
    try {
      const testData = {
        name: "Test User",
        email: "test@example.com",
        phoneNumber: "1234567890"
      };
      console.log('Testing echo with data:', testData);
      const response = await api.post('/auth/profile-echo', testData);
      console.log('Echo response:', response.data);
    } catch (error) {
      console.error('Echo test error:', error);
    }
  };

  // Test function to debug actual profile data
  const testProfileData = async () => {
    try {
      const profileData = {
        name: formData.name,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        address: formData.address,
        village: formData.village,
        district: formData.district,
        state: formData.state,
        pincode: formData.pincode,
        preferredLanguage: formData.preferredLanguage,
        notificationPreferences: formData.notificationPreferences,
        profileImage: formData.profileImage
      };
      console.log('Testing profile data:', profileData);
      console.log('Data keys:', Object.keys(profileData));
      console.log('Data stringified:', JSON.stringify(profileData, null, 2));
      
      // Try to send this to the echo endpoint
      const response = await api.post('/auth/profile-echo', profileData);
      console.log('Profile data echo response:', response.data);
    } catch (error) {
      console.error('Profile data test error:', error);
    }
  };

  // Test backend connectivity
  const testBackendConnectivity = async () => {
    try {
      console.log('Testing backend connectivity...');
      
      // Test direct backend connection
      const directResponse = await api.get('/test');
      console.log('Direct backend response:', directResponse.status);
      
      if (directResponse.status === 200) {
        const data = directResponse.data;
        console.log('Direct backend data:', data);
      } else {
        const text = directResponse.data;
        console.log('Direct backend error:', text);
      }
      
    } catch (error) {
      console.error('Direct backend test failed:', error);
      console.log('This might mean the backend server is not running on port 5000');
    }
  };

  // Test API connectivity
  const testApiConnectivity = async () => {
    try {
      console.log('Testing API connectivity...');
      console.log('Current URL:', window.location.href);
      console.log('Origin:', window.location.origin);
      console.log('Hostname:', window.location.hostname);
      console.log('Protocol:', window.location.protocol);
      console.log('API Base URL:', window.location.origin + '/api/v1');
      
      // Test basic connectivity
      try {
        const healthResponse = await api.get('/health');
        console.log('Health check response:', healthResponse.status);
        if (healthResponse.status !== 200) {
          const healthText = healthResponse.data;
          console.log('Health check error:', healthText);
        }
      } catch (error) {
        console.error('Health check failed:', error);
      }
      
      // Test simple endpoint
      try {
        const testResponse = await api.get('/test');
        console.log('Test response status:', testResponse.status);
        if (testResponse.status === 200) {
          const testData = testResponse.data;
          console.log('Simple test response:', testData);
        } else {
          const testText = testResponse.data;
          console.log('Test endpoint error:', testText);
        }
      } catch (error) {
        console.error('Test endpoint failed:', error);
      }
      
      // Test CORS
      try {
        const corsResponse = await api.get('/cors-test');
        console.log('CORS response status:', corsResponse.status);
        if (corsResponse.status === 200) {
          const corsData = corsResponse.data;
          console.log('CORS test response:', corsData);
        } else {
          const corsText = corsResponse.data;
          console.log('CORS test error:', corsText);
        }
      } catch (error) {
        console.error('CORS test failed:', error);
      }
      
      // Test CORS configuration
      try {
        const corsConfigResponse = await api.get('/cors-config');
        console.log('CORS config response status:', corsConfigResponse.status);
        if (corsConfigResponse.status === 200) {
          const corsConfigData = corsConfigResponse.data;
          console.log('CORS config response:', corsConfigData);
        } else {
          const corsConfigText = corsConfigResponse.data;
          console.log('CORS config error:', corsConfigText);
        }
      } catch (error) {
        console.error('CORS config test failed:', error);
      }
      
      // Test profile endpoint
      try {
        const token = localStorage.getItem('accessToken');
        console.log('Token available:', !!token);
        
        const profileResponse = await api.get('/auth/profile');
        console.log('Profile check response:', profileResponse.status);
        if (profileResponse.status !== 200) {
          const profileText = profileResponse.data;
          console.log('Profile endpoint error:', profileText);
        }
      } catch (error) {
        console.error('Profile endpoint failed:', error);
      }
      
    } catch (error) {
      console.error('API connectivity test failed:', error);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
    </div>
  );

  if (error) return (
    <div className="flex justify-center items-center min-h-screen text-red-500">
      <div className="text-center">
        <div className="text-xl font-bold mb-2">त्रुटी</div>
        <div>{error}</div>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          पुन्हा प्रयत्न करा
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F9FAF6] to-[#F5E9DA] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link to="/" className="flex items-center text-green-700 hover:text-green-900 transition-colors">
            <FiArrowLeft className="mr-2" />
            डॅशबोर्डकडे परत जा
          </Link>
          <div className="flex items-center space-x-4">
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <FiEdit3 className="mr-2" />
                संपादित करा
              </button>
            )}
            <button
              onClick={testEcho}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Test Echo
            </button>
            <button
              onClick={testProfileData}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Test Profile Data
            </button>
            <button
              onClick={testApiConnectivity}
              className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Test API
            </button>
            <button
              onClick={testBackendConnectivity}
              className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              Test Backend
            </button>
        </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
            {successMessage}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-green-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold text-green-900 font-[Mukta]">
                  {isEditing ? 'प्रोफाइल संपादित करा' : 'माझे प्रोफाइल'}
                </h2>
                {isEditing && (
                  <div className="flex space-x-2">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      <FiSave className="mr-2" />
                      {saving ? 'सेव करत आहे...' : 'सेव करा'}
                    </button>
                    <button
                      onClick={handleCancel}
                      className="flex items-center px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                    >
                      <FiX className="mr-2" />
                      रद्द करा
                    </button>
                  </div>
                )}
              </div>

              {/* Profile Image */}
              <div className="flex justify-center mb-8">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full bg-green-100 flex items-center justify-center overflow-hidden">
                    {formData.profileImage ? (
                      <img 
                        src={formData.profileImage} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <FiUser className="text-green-700 text-6xl" />
                    )}
                  </div>
                  {isEditing && (
                    <label className="absolute bottom-0 right-0 bg-green-600 text-white p-2 rounded-full cursor-pointer hover:bg-green-700">
                      <FiCamera />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Profile Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-green-800 mb-4 flex items-center">
                    <FiUser className="mr-2" />
                    मूलभूत माहिती
                  </h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      पूर्ण नाव *
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                          validationErrors.name ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="आपले पूर्ण नाव प्रविष्ट करा"
                      />
                    ) : (
                      <div className="px-3 py-2 bg-gray-50 rounded-lg text-green-900 font-semibold">
                        {profile?.name}
                      </div>
                    )}
                    {validationErrors.name && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ईमेल *
                    </label>
                    {isEditing ? (
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                          validationErrors.email ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="आपला ईमेल प्रविष्ट करा"
                      />
                    ) : (
                      <div className="px-3 py-2 bg-gray-50 rounded-lg text-green-900 font-semibold">
                        {profile?.email}
                      </div>
                    )}
                    {validationErrors.email && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      फोन नंबर
                    </label>
                    {isEditing ? (
                      <input
                        type="tel"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                          validationErrors.phoneNumber ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="10 अंकांचा फोन नंबर"
                      />
                    ) : (
                      <div className="px-3 py-2 bg-gray-50 rounded-lg text-green-900 font-semibold">
                        {profile?.phoneNumber || 'निर्दिष्ट नाही'}
                      </div>
                    )}
                    {validationErrors.phoneNumber && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.phoneNumber}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      भूमिका
                    </label>
                    <div className="px-3 py-2 bg-gray-50 rounded-lg text-green-900 font-semibold">
                      {profile?.role}
                    </div>
                  </div>
                </div>

                {/* Address Information */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-green-800 mb-4 flex items-center">
                    <FiMapPin className="mr-2" />
                    पत्ता माहिती
                  </h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      पूर्ण पत्ता
                    </label>
                    {isEditing ? (
                      <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        rows="3"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="आपला पूर्ण पत्ता प्रविष्ट करा"
                      />
                    ) : (
                      <div className="px-3 py-2 bg-gray-50 rounded-lg text-green-900 font-semibold">
                        {profile?.address || 'निर्दिष्ट नाही'}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        गाव
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="village"
                          value={formData.village}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="गावाचे नाव"
                        />
                      ) : (
                        <div className="px-3 py-2 bg-gray-50 rounded-lg text-green-900 font-semibold">
                          {profile?.village || 'निर्दिष्ट नाही'}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        जिल्हा
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="district"
                          value={formData.district}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="जिल्ह्याचे नाव"
                        />
                      ) : (
                        <div className="px-3 py-2 bg-gray-50 rounded-lg text-green-900 font-semibold">
                          {profile?.district || 'निर्दिष्ट नाही'}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        राज्य
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="state"
                          value={formData.state}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="राज्याचे नाव"
                        />
                      ) : (
                        <div className="px-3 py-2 bg-gray-50 rounded-lg text-green-900 font-semibold">
                          {profile?.state || 'निर्दिष्ट नाही'}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        पिनकोड
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="pincode"
                          value={formData.pincode}
                          onChange={handleInputChange}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                            validationErrors.pincode ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="6 अंकांचा पिनकोड"
                        />
                      ) : (
                        <div className="px-3 py-2 bg-gray-50 rounded-lg text-green-900 font-semibold">
                          {profile?.pincode || 'निर्दिष्ट नाही'}
                        </div>
                      )}
                      {validationErrors.pincode && (
                        <p className="text-red-500 text-sm mt-1">{validationErrors.pincode}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Preferences */}
              {isEditing && (
                <div className="mt-8 space-y-4">
                  <h3 className="text-xl font-semibold text-green-800 mb-4 flex items-center">
                    <FiGlobe className="mr-2" />
                    प्राधान्ये
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        पसंतीची भाषा
                      </label>
                      <select
                        name="preferredLanguage"
                        value={formData.preferredLanguage}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        <option value="marathi">मराठी</option>
                        <option value="english">English</option>
                        <option value="hindi">हिंदी</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        सूचना प्राधान्ये
                      </label>
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            name="notification.email"
                            checked={formData.notificationPreferences?.email || false}
                            onChange={handleInputChange}
                            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                          />
                          <label className="ml-2 block text-sm text-gray-700">
                            ईमेल सूचना
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            name="notification.sms"
                            checked={formData.notificationPreferences?.sms || false}
                            onChange={handleInputChange}
                            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                          />
                          <label className="ml-2 block text-sm text-gray-700">
                            SMS सूचना
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            name="notification.push"
                            checked={formData.notificationPreferences?.push || false}
                            onChange={handleInputChange}
                            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                          />
                          <label className="ml-2 block text-sm text-gray-700">
                            पुश सूचना
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Fields Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-green-200">
              <h3 className="text-xl font-bold text-green-800 mb-4 flex items-center">
                <FiMapPin className="mr-2" />
                माझी शेते
              </h3>
              {fields.length === 0 ? (
                <div className="text-gray-500 text-center py-8">
                  <FiMapPin className="text-4xl mx-auto mb-4 text-gray-300" />
                  <p>आपल्याकडे अजून शेते नाहीत</p>
                  <Link 
                    to="/add-field" 
                    className="mt-4 inline-block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    शेत जोडा
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {fields.map((field) => (
                    <div key={field._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="font-semibold text-green-900 mb-2">{field.name}</div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>स्थान: {field.location?.address?.village || ''}, {field.location?.address?.district || ''}</div>
                        <div>क्षेत्र: {field.location?.area?.value} {field.location?.area?.unit}</div>
                        <div>सध्याचे पीक: {field.currentCrop?.name || 'N/A'}</div>
                        <div className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                          field.status === 'Healthy' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                        }`}>
                          स्थिती: {field.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Security Section */}
            <div className="bg-white rounded-2xl shadow-xl p-6 mt-6 border-2 border-green-200">
              <h3 className="text-xl font-bold text-green-800 mb-4 flex items-center">
                <FiShield className="mr-2" />
                सुरक्षा
              </h3>
              <div className="space-y-3">
                <button 
                  onClick={() => setShowPasswordModal(true)}
                  className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="font-semibold text-gray-900">पासवर्ड बदला</div>
                  <div className="text-sm text-gray-600">आपला पासवर्ड अपडेट करा</div>
                </button>
                <button 
                  onClick={() => setShowTwoFactorModal(true)}
                  className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="font-semibold text-gray-900">दोन-फॅक्टर प्रमाणीकरण</div>
                  <div className="text-sm text-gray-600">अतिरिक्त सुरक्षा सक्षम करा</div>
                </button>
                <button 
                  onClick={() => setShowLoginHistoryModal(true)}
                  className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="font-semibold text-gray-900">लॉगिन इतिहास</div>
                  <div className="text-sm text-gray-600">आपल्या लॉगिन क्रियाकलाप पहा</div>
                </button>
          </div>
          </div>
          </div>
        </div>
      </div>

      {/* Security Modals */}
      <PasswordChangeModal 
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSuccess={handlePasswordChangeSuccess}
      />
      
      <TwoFactorAuth 
        isOpen={showTwoFactorModal}
        onClose={() => setShowTwoFactorModal(false)}
      />
      
      <LoginHistory 
        isOpen={showLoginHistoryModal}
        onClose={() => setShowLoginHistoryModal(false)}
      />
    </div>
  );
};

export default Profile; 