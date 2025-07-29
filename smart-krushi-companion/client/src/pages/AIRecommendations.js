import React, { useState, useEffect } from 'react';
import { api } from '../services/authService';
import { handleApiError } from '../services/errorHandler';

const AIRecommendations = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [fields, setFields] = useState([]);
  const [selectedField, setSelectedField] = useState('');
  const [stats, setStats] = useState({});
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchFields();
    fetchRecommendations();
    fetchStats();
  }, []);

  const fetchFields = async () => {
    try {
      const response = await api.get('/fields');
      setFields(response.data.fields || []);
      if (response.data.fields && response.data.fields.length > 0) {
        setSelectedField(response.data.fields[0].fieldId);
      }
    } catch (err) {
      setError(handleApiError(err, 'Failed to fetch fields'));
    }
  };

  const fetchRecommendations = async () => {
    try {
      const response = await api.get('/ai-recommendations');
      setRecommendations(response.data.recommendations || []);
    } catch (err) {
      setError(handleApiError(err, 'Failed to fetch recommendations'));
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/ai-recommendations/stats');
      setStats(response.data.stats || {});
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const generateRecommendation = async () => {
    if (!selectedField) {
      setError('Please select a field first');
      return;
    }

    setGenerating(true);
    try {
      const response = await api.post('/ai-recommendations/generate', {
        fieldId: selectedField
      });
      
      setShowGenerateModal(false);
      fetchRecommendations();
      fetchStats();
      
      // Show success message
      alert(`Generated ${response.data.recommendations.length} new recommendations!`);
    } catch (err) {
      setError(handleApiError(err, 'Failed to generate recommendation'));
    } finally {
      setGenerating(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/ai-recommendations/${id}/status`, { status });
      fetchRecommendations();
      fetchStats();
    } catch (err) {
      setError(handleApiError(err, 'Failed to update status'));
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      implemented: 'bg-blue-100 text-blue-800'
    };
    return colors[status] || colors.pending;
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    };
    return colors[priority] || colors.medium;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading AI recommendations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Crop Recommendations</h1>
          <p className="text-gray-600">Intelligent crop suggestions based on your field conditions and market analysis</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Recommendations</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.total || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Implemented</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.implemented || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Implementation Rate</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.implementationRate ? `${stats.implementationRate.toFixed(1)}%` : '0%'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">AI Accuracy</p>
                <p className="text-2xl font-semibold text-gray-900">85%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Field</label>
                <select
                  value={selectedField}
                  onChange={(e) => setSelectedField(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {fields.map(field => (
                    <option key={field.fieldId} value={field.fieldId}>
                      {field.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-end">
                <button
                  onClick={() => setShowGenerateModal(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  Generate New Recommendation
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={fetchRecommendations}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Recommendations List */}
        <div className="space-y-6">
          {recommendations.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow text-center">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Recommendations Yet</h3>
              <p className="text-gray-600 mb-4">Generate your first AI-powered crop recommendation to get started.</p>
              <button
                onClick={() => setShowGenerateModal(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Generate First Recommendation
              </button>
            </div>
          ) : (
            recommendations.map((recommendation) => (
              <div key={recommendation._id} className="bg-white p-6 rounded-lg shadow">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <span className="text-green-600 font-semibold text-lg">
                          {recommendation.cropName.charAt(0)}
                        </span>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{recommendation.cropName}</h3>
                      <p className="text-sm text-gray-600">
                        Field: {recommendation.fieldId} • Season: {recommendation.season}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 mt-4 lg:mt-0">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(recommendation.status)}`}>
                      {recommendation.status}
                    </span>
                    <span className={`text-lg font-semibold ${getConfidenceColor(recommendation.confidence)}`}>
                      {recommendation.confidence}%
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Expected Yield</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {recommendation.expectedYield} {recommendation.yieldUnit}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Planting Date</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {new Date(recommendation.plantingDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Market Price</p>
                    <p className="text-lg font-semibold text-gray-900">
                      ₹{recommendation.marketConditions?.currentPrice?.toLocaleString()}/ton
                    </p>
                  </div>
                </div>

                {/* Risk Factors */}
                {recommendation.riskFactors && recommendation.riskFactors.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Risk Factors</h4>
                    <div className="space-y-2">
                      {recommendation.riskFactors.map((risk, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-red-50 rounded">
                          <span className="text-sm text-red-800">{risk.factor}</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(risk.severity)}`}>
                            {risk.severity}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Recommendations */}
                {recommendation.recommendations && recommendation.recommendations.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Action Items</h4>
                    <div className="space-y-2">
                      {recommendation.recommendations.map((action, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                          <div>
                            <p className="text-sm font-medium text-blue-900">{action.description}</p>
                            <p className="text-xs text-blue-700">Timeline: {action.timeline}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(action.priority)}`}>
                              {action.priority}
                            </span>
                            <span className="text-xs text-blue-700">₹{action.cost}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => updateStatus(recommendation._id, 'approved')}
                      disabled={recommendation.status !== 'pending'}
                      className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => updateStatus(recommendation._id, 'rejected')}
                      disabled={recommendation.status !== 'pending'}
                      className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => updateStatus(recommendation._id, 'implemented')}
                      disabled={recommendation.status === 'rejected'}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Mark Implemented
                    </button>
                  </div>
                  
                  <span className="text-xs text-gray-500">
                    {new Date(recommendation.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Generate Modal */}
        {showGenerateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h2 className="text-xl font-bold mb-4">Generate AI Recommendation</h2>
              <p className="text-gray-600 mb-4">
                Generate intelligent crop recommendations for field: <strong>{selectedField}</strong>
              </p>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowGenerateModal(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={generateRecommendation}
                  disabled={generating}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {generating ? 'Generating...' : 'Generate'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIRecommendations; 