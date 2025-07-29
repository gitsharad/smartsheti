import React, { useState, useEffect } from 'react';
import { api } from '../services/authService';
import { handleApiError } from '../services/errorHandler';

const AdvancedAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analyticsData, setAnalyticsData] = useState({});
  const [selectedField, setSelectedField] = useState('');
  const [fields, setFields] = useState([]);
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedReport, setSelectedReport] = useState(null);
  const [showDetailedReport, setShowDetailedReport] = useState(false);

  useEffect(() => {
    fetchFields();
  }, []);

  useEffect(() => {
    if (selectedField) {
      fetchAnalyticsData();
    }
  }, [selectedField, timeRange]);

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

  const fetchAnalyticsData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Mock data for now - will be replaced with real API calls
      const mockData = {
        sensorTrends: {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          temperature: [25, 26, 24, 27, 28, 26, 25],
          humidity: [65, 68, 70, 62, 60, 65, 67],
          moisture: [45, 42, 48, 40, 38, 45, 47]
        },
        cropPerformance: {
          crops: ['Rice', 'Wheat', 'Cotton', 'Sugarcane'],
          yields: [4.2, 3.8, 2.1, 85.5]
        },
        soilHealth: {
          ph: 6.8,
          nitrogen: 150,
          phosphorus: 18,
          potassium: 180,
          organicMatter: 3.2
        },
        yieldPrediction: {
          months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          predictions: [4.1, 4.3, 4.5, 4.2, 4.8, 5.1]
        },
        financialMetrics: {
          revenue: 125000,
          costs: 85000,
          profit: 40000,
          investment: 60000
        }
      };

      setAnalyticsData(mockData);
    } catch (err) {
      setError(handleApiError(err, 'Failed to fetch analytics data'));
    } finally {
      setLoading(false);
    }
  };

  const handleReportClick = (reportType) => {
    setSelectedReport(reportType);
    setShowDetailedReport(true);
  };

  const generateDetailedReport = (reportType) => {
    const reports = {
      sensor: {
        title: 'Sensor Data Detailed Report',
        content: [
          { label: 'Temperature Trend', value: 'Stable with slight increase', status: 'good' },
          { label: 'Humidity Pattern', value: 'Optimal range maintained', status: 'excellent' },
          { label: 'Soil Moisture', value: 'Below optimal - irrigation needed', status: 'warning' },
          { label: 'Data Quality', value: '98% accuracy', status: 'excellent' },
          { label: 'Sensor Health', value: 'All sensors operational', status: 'good' }
        ]
      },
      crop: {
        title: 'Crop Performance Detailed Report',
        content: [
          { label: 'Rice Yield', value: '4.2 tons/ha (Target: 4.5)', status: 'good' },
          { label: 'Wheat Performance', value: '3.8 tons/ha (Target: 4.0)', status: 'good' },
          { label: 'Cotton Quality', value: 'Grade A - Excellent', status: 'excellent' },
          { label: 'Sugarcane Growth', value: '85.5 tons/ha (Above target)', status: 'excellent' },
          { label: 'Overall Efficiency', value: '92%', status: 'excellent' }
        ]
      },
      soil: {
        title: 'Soil Health Detailed Report',
        content: [
          { label: 'pH Level', value: '6.8 (Optimal range)', status: 'excellent' },
          { label: 'Nitrogen Content', value: '150 kg/ha (Adequate)', status: 'good' },
          { label: 'Phosphorus Level', value: '18 kg/ha (Low - needs supplement)', status: 'warning' },
          { label: 'Potassium Content', value: '180 kg/ha (Optimal)', status: 'excellent' },
          { label: 'Organic Matter', value: '3.2% (Good)', status: 'good' }
        ]
      },
      financial: {
        title: 'Financial Performance Detailed Report',
        content: [
          { label: 'Revenue', value: '₹1,25,000 (15% increase)', status: 'excellent' },
          { label: 'Operating Costs', value: '₹85,000 (8% increase)', status: 'good' },
          { label: 'Net Profit', value: '₹40,000 (25% increase)', status: 'excellent' },
          { label: 'ROI', value: '66.7%', status: 'excellent' },
          { label: 'Cost per Hectare', value: '₹42,500', status: 'good' }
        ]
      }
    };

    return reports[reportType] || reports.sensor;
  };

  const getStatusColor = (status) => {
    const colors = {
      excellent: 'text-green-600 bg-green-50',
      good: 'text-blue-600 bg-blue-50',
      warning: 'text-yellow-600 bg-yellow-50',
      poor: 'text-red-600 bg-red-50'
    };
    return colors[status] || colors.good;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading advanced analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">⚠️</div>
          <p className="text-gray-800 font-medium">{error}</p>
          <button
            onClick={fetchAnalyticsData}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Advanced Analytics</h1>
          <p className="text-gray-600">Comprehensive insights and predictive analytics for your farming operations</p>
        </div>

        {/* Controls */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Field</label>
              <select
                value={selectedField}
                onChange={(e) => setSelectedField(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {fields.map(field => (
                  <option key={field.fieldId} value={field.fieldId}>
                    {field.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Time Range</label>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="1y">Last Year</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={fetchAnalyticsData}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Refresh Data
              </button>
            </div>
          </div>
        </div>

        {/* Analytics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Sensor Trends */}
          <div className="bg-white p-6 rounded-lg shadow cursor-pointer hover:shadow-lg transition-shadow"
               onClick={() => handleReportClick('sensor')}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Sensor Data Trends</h3>
              <span className="text-blue-600 text-sm">Click for details →</span>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-700">Temperature (°C)</h4>
                <div className="flex space-x-2 mt-2">
                  {analyticsData.sensorTrends?.temperature?.map((temp, index) => (
                    <div key={index} className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm">
                      {temp}°
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-700">Humidity (%)</h4>
                <div className="flex space-x-2 mt-2">
                  {analyticsData.sensorTrends?.humidity?.map((hum, index) => (
                    <div key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                      {hum}%
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-700">Soil Moisture (%)</h4>
                <div className="flex space-x-2 mt-2">
                  {analyticsData.sensorTrends?.moisture?.map((moist, index) => (
                    <div key={index} className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                      {moist}%
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Crop Performance */}
          <div className="bg-white p-6 rounded-lg shadow cursor-pointer hover:shadow-lg transition-shadow"
               onClick={() => handleReportClick('crop')}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Crop Performance</h3>
              <span className="text-blue-600 text-sm">Click for details →</span>
            </div>
            <div className="space-y-3">
              {analyticsData.cropPerformance?.crops?.map((crop, index) => (
                <div key={crop} className="flex justify-between items-center">
                  <span className="font-medium">{crop}</span>
                  <span className="text-green-600 font-semibold">
                    {analyticsData.cropPerformance.yields[index]} tons/ha
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Soil Health */}
          <div className="bg-white p-6 rounded-lg shadow cursor-pointer hover:shadow-lg transition-shadow"
               onClick={() => handleReportClick('soil')}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Soil Health Analysis</h3>
              <span className="text-blue-600 text-sm">Click for details →</span>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>pH Level</span>
                <span className={`font-semibold ${analyticsData.soilHealth?.ph > 6.5 ? 'text-green-600' : 'text-yellow-600'}`}>
                  {analyticsData.soilHealth?.ph}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Nitrogen (kg/ha)</span>
                <span className="font-semibold text-blue-600">{analyticsData.soilHealth?.nitrogen}</span>
              </div>
              <div className="flex justify-between">
                <span>Phosphorus (kg/ha)</span>
                <span className="font-semibold text-purple-600">{analyticsData.soilHealth?.phosphorus}</span>
              </div>
              <div className="flex justify-between">
                <span>Potassium (kg/ha)</span>
                <span className="font-semibold text-orange-600">{analyticsData.soilHealth?.potassium}</span>
              </div>
              <div className="flex justify-between">
                <span>Organic Matter (%)</span>
                <span className="font-semibold text-green-600">{analyticsData.soilHealth?.organicMatter}</span>
              </div>
            </div>
          </div>

          {/* Financial Metrics */}
          <div className="bg-white p-6 rounded-lg shadow cursor-pointer hover:shadow-lg transition-shadow"
               onClick={() => handleReportClick('financial')}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Financial Overview</h3>
              <span className="text-blue-600 text-sm">Click for details →</span>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Revenue</span>
                <span className="font-semibold text-green-600">₹{analyticsData.financialMetrics?.revenue?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Costs</span>
                <span className="font-semibold text-red-600">₹{analyticsData.financialMetrics?.costs?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Profit</span>
                <span className="font-semibold text-blue-600">₹{analyticsData.financialMetrics?.profit?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Investment</span>
                <span className="font-semibold text-purple-600">₹{analyticsData.financialMetrics?.investment?.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Insights Panel */}
        <div className="mt-8 bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">AI-Generated Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">📈 Performance Trend</h4>
              <p className="text-sm text-blue-700">
                Your field shows a 15% improvement in soil moisture retention over the last month.
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium text-green-800 mb-2">🌱 Crop Recommendation</h4>
              <p className="text-sm text-green-700">
                Based on current soil conditions, consider planting wheat in the next season for optimal yield.
              </p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-medium text-yellow-800 mb-2">⚠️ Risk Alert</h4>
              <p className="text-sm text-yellow-700">
                Temperature fluctuations may affect crop growth. Consider adjusting irrigation schedule.
              </p>
            </div>
          </div>
        </div>

        {/* Detailed Report Modal */}
        {showDetailedReport && selectedReport && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">{generateDetailedReport(selectedReport).title}</h2>
                <button
                  onClick={() => setShowDetailedReport(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                {generateDetailedReport(selectedReport).content.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-3 rounded-lg border">
                    <span className="font-medium">{item.label}</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(item.status)}`}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowDetailedReport(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedAnalytics; 