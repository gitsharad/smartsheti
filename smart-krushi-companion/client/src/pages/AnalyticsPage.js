import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiBarChart2, 
  FiTrendingUp, 
  FiTrendingDown, 
  FiDownload, 
  FiFilter,
  FiArrowLeft,
  FiUsers,
  FiMap,
  FiDroplet,
  FiThermometer,
  FiActivity,
  FiCheckCircle,
  FiAlertTriangle,
  FiXCircle,
  FiInfo,
  FiCalendar,
  FiPieChart
} from 'react-icons/fi';
import { api } from '../services/authService';

const AnalyticsPage = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedReport, setSelectedReport] = useState('overview');
  const navigate = useNavigate();

  useEffect(() => {
    loadAnalytics();
  }, [selectedPeriod]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/coordinator/analytics', {
        params: {
          period: selectedPeriod
        }
      });
      
      setAnalytics(response.data.analytics);
    } catch (err) {
      setError('Failed to load analytics');
      console.error('Error loading analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodChange = (e) => {
    setSelectedPeriod(e.target.value);
  };

  const handleReportChange = (e) => {
    setSelectedReport(e.target.value);
  };

  const handleExportReport = () => {
    // TODO: Implement report export
    alert('Report export feature coming soon!');
  };

  const getChangeColor = (change) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getChangeIcon = (change) => {
    if (change > 0) return <FiTrendingUp className="text-green-500" />;
    if (change < 0) return <FiTrendingDown className="text-red-500" />;
    return <FiInfo className="text-gray-500" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F9FAF6] to-[#F5E9DA] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-green-800">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F9FAF6] to-[#F5E9DA] p-0 md:p-6 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex flex-col md:flex-row items-center justify-between py-6 px-4 md:px-0 mb-6 bg-white rounded-b-3xl shadow-md">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 text-green-600 hover:text-green-700 transition"
            >
              <FiArrowLeft className="text-xl" />
            </button>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-green-800 tracking-tight font-[Baloo Bhaina 2]">Analytics & Reports</h1>
              <p className="text-green-700 text-sm md:text-base font-semibold">Performance metrics and insights</p>
            </div>
          </div>
          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            <button
              onClick={handleExportReport}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              <FiDownload className="mr-2" />
              Export Report
            </button>
          </div>
        </header>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Time Period</label>
              <select
                value={selectedPeriod}
                onChange={handlePeriodChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
                <option value="year">This Year</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
              <select
                value={selectedReport}
                onChange={handleReportChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="overview">Overview</option>
                <option value="performance">Performance</option>
                <option value="field-health">Field Health</option>
                <option value="yield-analysis">Yield Analysis</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={loadAnalytics}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <FiFilter className="inline mr-2" />
                Apply Filters
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <FiAlertTriangle className="text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        {/* Analytics Content */}
        {analytics && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Farmers</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.totalFarmers}</p>
                  </div>
                  <FiUsers className="text-blue-500 text-3xl" />
                </div>
              </div>
              
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Fields</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.totalFields}</p>
                  </div>
                  <FiMap className="text-green-500 text-3xl" />
                </div>
              </div>
              
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Avg Yield</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.averageYield}%</p>
                  </div>
                  <FiTrendingUp className="text-purple-500 text-3xl" />
                </div>
              </div>
              
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Active Fields</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.totalFields}</p>
                  </div>
                  <FiActivity className="text-orange-500 text-3xl" />
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FiBarChart2 className="mr-2" />
                  Performance Metrics
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FiDroplet className="text-blue-500" />
                      <span className="text-sm text-gray-600">Water Usage</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900">{analytics.waterUsage.current}L</span>
                      <div className={`flex items-center space-x-1 ${getChangeColor(analytics.waterUsage.change)}`}>
                        {getChangeIcon(analytics.waterUsage.change)}
                        <span className="text-sm">{analytics.waterUsage.change}%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FiAlertTriangle className="text-orange-500" />
                      <span className="text-sm text-gray-600">Pest Issues</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900">{analytics.pestIssues.current}</span>
                      <div className={`flex items-center space-x-1 ${getChangeColor(analytics.pestIssues.change)}`}>
                        {getChangeIcon(analytics.pestIssues.change)}
                        <span className="text-sm">{analytics.pestIssues.change}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FiPieChart className="mr-2" />
                  Field Health Distribution
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">Excellent</span>
                    </div>
                    <span className="font-medium text-gray-900">{analytics.fieldHealth.excellent}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">Good</span>
                    </div>
                    <span className="font-medium text-gray-900">{analytics.fieldHealth.good}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">Fair</span>
                    </div>
                    <span className="font-medium text-gray-900">{analytics.fieldHealth.fair}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">Poor</span>
                    </div>
                    <span className="font-medium text-gray-900">{analytics.fieldHealth.poor}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Crop Distribution */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FiBarChart2 className="mr-2" />
                Crop Distribution
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {Object.entries(analytics.cropDistribution).map(([crop, percentage]) => (
                  <div key={crop} className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">{percentage}%</div>
                    <div className="text-sm text-gray-600 capitalize">{crop}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Detailed Reports */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Reports</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 border border-gray-200 rounded-lg hover:border-green-300 transition cursor-pointer">
                  <div className="flex items-center space-x-3">
                    <FiUsers className="text-blue-500" />
                    <div>
                      <h4 className="font-medium text-gray-900">Farmer Performance</h4>
                      <p className="text-sm text-gray-500">Individual farmer metrics</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 border border-gray-200 rounded-lg hover:border-green-300 transition cursor-pointer">
                  <div className="flex items-center space-x-3">
                    <FiMap className="text-green-500" />
                    <div>
                      <h4 className="font-medium text-gray-900">Field Analysis</h4>
                      <p className="text-sm text-gray-500">Field-wise performance</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 border border-gray-200 rounded-lg hover:border-green-300 transition cursor-pointer">
                  <div className="flex items-center space-x-3">
                    <FiTrendingUp className="text-purple-500" />
                    <div>
                      <h4 className="font-medium text-gray-900">Yield Trends</h4>
                      <p className="text-sm text-gray-500">Historical yield data</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 border border-gray-200 rounded-lg hover:border-green-300 transition cursor-pointer">
                  <div className="flex items-center space-x-3">
                    <FiDroplet className="text-blue-500" />
                    <div>
                      <h4 className="font-medium text-gray-900">Water Usage</h4>
                      <p className="text-sm text-gray-500">Irrigation efficiency</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 border border-gray-200 rounded-lg hover:border-green-300 transition cursor-pointer">
                  <div className="flex items-center space-x-3">
                    <FiAlertTriangle className="text-orange-500" />
                    <div>
                      <h4 className="font-medium text-gray-900">Issue Reports</h4>
                      <p className="text-sm text-gray-500">Problem identification</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 border border-gray-200 rounded-lg hover:border-green-300 transition cursor-pointer">
                  <div className="flex items-center space-x-3">
                    <FiCalendar className="text-green-500" />
                    <div>
                      <h4 className="font-medium text-gray-900">Seasonal Analysis</h4>
                      <p className="text-sm text-gray-500">Seasonal performance</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* No Data State */}
        {!analytics && !loading && (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <FiBarChart2 className="text-gray-400 text-4xl mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No analytics data available</h3>
            <p className="text-gray-500">Analytics data will appear here once you have farmers and fields set up.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsPage; 