import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiThermometer, FiDroplet, FiSun, FiClock, FiAlertCircle, FiCheckCircle, FiTrendingUp, FiArrowLeft } from 'react-icons/fi';
import apiRoutes from '../services/apiRoutes';
import { api } from '../services/authService';

const FDSS = () => {
  const [fieldId, setFieldId] = useState('');
  const [fields, setFields] = useState([]);
  const [fieldsLoading, setFieldsLoading] = useState(true);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [weatherData, setWeatherData] = useState(null);

  // Fetch farmer's assigned fields
  useEffect(() => {
    fetchFarmerFields();
  }, []);

  // Fetch insights and weather when fieldId changes
  useEffect(() => {
    if (fieldId) {
      fetchInsights();
      fetchWeatherData();
    }
  }, [fieldId]);

  const fetchFarmerFields = async () => {
    setFieldsLoading(true);
    try {
      // Get current user to check if they're a farmer
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      
      if (user?.role === 'farmer') {
        // For farmers, get their owned fields
        const response = await api.get('/fields');
        const userFields = response.data.fields || [];
        setFields(userFields);
        
        // Set the first field as default if available
        if (userFields.length > 0) {
          setFieldId(userFields[0].fieldId);
        }
      } else {
        // For admin/coordinator, show all fields they can access
        const response = await api.get('/fields');
        const allFields = response.data.fields || [];
        setFields(allFields);
        
        // Set the first field as default if available
        if (allFields.length > 0) {
          setFieldId(allFields[0].fieldId);
        }
      }
    } catch (error) {
      console.error('Error fetching fields:', error);
      // Fallback to hardcoded fields if API fails
      setFields([
        { fieldId: 'plot1', name: 'Plot 1' },
        { fieldId: 'plot2', name: 'Plot 2' },
        { fieldId: 'plot3', name: 'Plot 3' }
      ]);
      setFieldId('plot1');
    } finally {
      setFieldsLoading(false);
    }
  };

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const response = await apiRoutes.getFDSSAdvice(fieldId);
      setInsights(response.data);
    } catch (error) {
      console.error('Error fetching insights:', error);
      setInsights(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchWeatherData = async () => {
    try {
      const response = await apiRoutes.getFDSSWeather(fieldId);
      setWeatherData(response.data);
    } catch (error) {
      console.error('Error fetching weather:', error);
      setWeatherData(null);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 border-red-400 text-red-700';
      case 'medium': return 'bg-yellow-100 border-yellow-400 text-yellow-700';
      case 'low': return 'bg-green-100 border-green-400 text-green-700';
      default: return 'bg-blue-100 border-blue-400 text-blue-700';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high': return <FiAlertCircle className="text-red-500" />;
      case 'medium': return <FiClock className="text-yellow-500" />;
      case 'low': return <FiCheckCircle className="text-green-500" />;
      default: return <FiTrendingUp className="text-blue-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header with Back Button */}
        <div className="flex items-center mb-8">
          <Link
            to="/"
            className="flex items-center text-blue-600 hover:text-blue-800 transition-colors mr-4"
          >
            <FiArrowLeft className="mr-2" />
            डॅशबोर्डकडे परत जा
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🚜 शेत निर्णय समर्थन प्रणाली
          </h1>
          <p className="text-gray-600 text-lg">
            सेंसर डेटा आणि हवामानावर आधारित बुद्धिमान सूचना
          </p>
        </div>

        {/* Field Selector */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">शेत निवडा</h2>
              <p className="text-gray-600">सूचना मिळवण्यासाठी शेत निवडा</p>
            </div>
            {fieldsLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-500">शेत लोड करत आहे...</p>
              </div>
            ) : fields.length > 0 ? (
              <select
                value={fieldId}
                onChange={(e) => setFieldId(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {fields.map(field => (
                  <option key={field.fieldId} value={field.fieldId}>
                    {field.name} ({field.fieldId})
                  </option>
                ))}
              </select>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500">कोणतेही शेत उपलब्ध नाहीत</p>
                <p className="text-sm text-gray-400 mt-1">कृपया प्रशासकाशी संपर्क साधा</p>
              </div>
            )}
          </div>
        </div>

        {!fieldId && !fieldsLoading && fields.length > 0 && (
          <div className="text-center py-12">
            <FiTrendingUp className="mx-auto text-6xl text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">शेत निवडा</h3>
            <p className="text-gray-500">सूचना मिळवण्यासाठी वरील ड्रॉपडाउनमधून शेत निवडा</p>
          </div>
        )}

        {fieldId && (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Weather Dashboard */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  <FiSun className="mr-2" />
                  हवामान माहिती
                </h2>
                
                {weatherData ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl">
                      <div className="flex items-center">
                        <FiThermometer className="text-red-500 text-xl mr-3" />
                        <div>
                          <p className="text-sm text-gray-600">तापमान</p>
                          <p className="text-2xl font-bold text-gray-800">{weatherData.temperature}°C</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
                      <div className="flex items-center">
                        <FiDroplet className="text-blue-500 text-xl mr-3" />
                        <div>
                          <p className="text-sm text-gray-600">आर्द्रता</p>
                          <p className="text-2xl font-bold text-gray-800">{weatherData.humidity}%</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
                      <div className="flex items-center">
                        <FiSun className="text-yellow-500 text-xl mr-3" />
                        <div>
                          <p className="text-sm text-gray-600">पाऊस संभाव्यता</p>
                          <p className="text-2xl font-bold text-gray-800">{weatherData.rainChance}%</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FiSun className="mx-auto text-4xl mb-4" />
                    <p>हवामान माहिती लोड करत आहे...</p>
                  </div>
                )}
              </div>
            </div>

            {/* Insights Dashboard */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  <FiTrendingUp className="mr-2" />
                  बुद्धिमान सूचना
                </h2>

                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">सूचना तयार करत आहे...</p>
                  </div>
                ) : insights && Array.isArray(insights.insights) ? (
                  <div className="space-y-6">
                    {insights.insights.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <FiTrendingUp className="mx-auto text-4xl mb-4" />
                        <p>सूचना उपलब्ध नाहीत</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {insights.insights.map((item, index) => (
                          <div
                            key={index}
                            className={`p-4 rounded-xl border-l-4 ${getPriorityColor(item.priority)}`}
                          >
                            <div className="flex items-start">
                              {getPriorityIcon(item.priority)}
                              <div className="ml-3">
                                <p className="font-medium text-gray-800">
                                  {item.type === 'alert' ? '⚠️' : item.type === 'recommendation' ? '💡' : ''} {item.message.marathi}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">{new Date(item.timestamp).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <FiTrendingUp className="mx-auto text-4xl mb-4" />
                    <p>सूचना लोड करत आहे...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FDSS; 