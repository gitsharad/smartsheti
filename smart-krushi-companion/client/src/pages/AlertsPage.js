import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiAlertTriangle, 
  FiSearch, 
  FiFilter, 
  FiEye, 
  FiArrowLeft,
  FiDroplet,
  FiThermometer,
  FiActivity,
  FiCheckCircle,
  FiXCircle,
  FiInfo,
  FiClock,
  FiUser,
  FiMap,
  FiBell,
  FiBellOff
} from 'react-icons/fi';
import { api } from '../services/authService';

const AlertsPage = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [showAlertDetails, setShowAlertDetails] = useState(false);
  const [unreadAlerts, setUnreadAlerts] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    loadAlerts();
  }, [currentPage, filterSeverity, filterType]);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/coordinator/alerts', {
        params: {
          page: currentPage,
          limit: 10
        }
      });
      
      setAlerts(response.data.alerts);
      setTotalPages(response.data.pagination.totalPages);
      
      // Count unread alerts
      const unread = response.data.alerts.filter(alert => !alert.read).length;
      setUnreadAlerts(unread);
    } catch (err) {
      setError('Failed to load alerts');
      console.error('Error loading alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    if (name === 'severity') {
      setFilterSeverity(value);
    } else if (name === 'type') {
      setFilterType(value);
    }
    setCurrentPage(1);
  };

  const handleAlertClick = (alert) => {
    setSelectedAlert(alert);
    setShowAlertDetails(true);
  };

  const handleMarkAsRead = async (alertId) => {
    try {
      // TODO: Implement mark as read API
      // await api.patch(`/coordinator/alerts/${alertId}/read`);
      
      // Update local state
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId ? { ...alert, read: true } : alert
      ));
      setUnreadAlerts(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking alert as read:', err);
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = alert.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alert.farmer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alert.fieldName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = filterSeverity === 'all' || alert.severity === filterSeverity;
    const matchesType = filterType === 'all' || alert.type === filterType;
    return matchesSearch && matchesSeverity && matchesType;
  });

  const getSeverityColor = (severity) => {
    switch (severity.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'low':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type) => {
    switch (type.toLowerCase()) {
      case 'moisture':
        return <FiDroplet className="text-blue-500" />;
      case 'temperature':
        return <FiThermometer className="text-red-500" />;
      case 'pest':
        return <FiAlertTriangle className="text-orange-500" />;
      case 'irrigation':
        return <FiActivity className="text-green-500" />;
      default:
        return <FiInfo className="text-gray-500" />;
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity.toLowerCase()) {
      case 'high':
        return <FiXCircle className="text-red-500" />;
      case 'medium':
        return <FiAlertTriangle className="text-orange-500" />;
      case 'low':
        return <FiInfo className="text-yellow-500" />;
      default:
        return <FiInfo className="text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F9FAF6] to-[#F5E9DA] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-green-800">Loading alerts...</p>
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
              <h1 className="text-3xl md:text-4xl font-bold text-green-800 tracking-tight font-[Baloo Bhaina 2]">Alerts</h1>
              <p className="text-green-700 text-sm md:text-base font-semibold">
                Monitor alerts from your farmers' fields
                {unreadAlerts > 0 && (
                  <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    {unreadAlerts} new
                  </span>
                )}
              </p>
            </div>
          </div>
        </header>

        {/* Search and Filter */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search alerts..."
                value={searchTerm}
                onChange={handleSearch}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            
            <div className="relative">
              <FiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                name="severity"
                value={filterSeverity}
                onChange={handleFilterChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">All Severity</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div className="relative">
              <FiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                name="type"
                value={filterType}
                onChange={handleFilterChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="moisture">Moisture</option>
                <option value="temperature">Temperature</option>
                <option value="pest">Pest</option>
                <option value="irrigation">Irrigation</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  // TODO: Implement mark all as read
                  alert('Mark all as read feature coming soon!');
                }}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Mark All Read
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

        {/* Alerts List */}
        <div className="space-y-4">
          {filteredAlerts.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
              <FiBellOff className="text-gray-400 text-4xl mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No alerts found</h3>
              <p className="text-gray-500">There are no alerts matching your current filters.</p>
            </div>
          ) : (
            filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`bg-white rounded-2xl shadow-xl p-6 border-l-4 ${
                  alert.severity === 'high' ? 'border-red-500' :
                  alert.severity === 'medium' ? 'border-orange-500' :
                  'border-yellow-500'
                } ${!alert.read ? 'ring-2 ring-blue-200' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="flex items-center space-x-2">
                      {getTypeIcon(alert.type)}
                      {getSeverityIcon(alert.severity)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-medium text-gray-900">{alert.message}</h3>
                        {!alert.read && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            New
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <FiUser className="text-gray-400" />
                          <span>Farmer: {alert.farmer}</span>
                        </div>
                        {alert.fieldName && (
                          <div className="flex items-center space-x-2">
                            <FiMap className="text-gray-400" />
                            <span>Field: {alert.fieldName}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-2">
                          <FiClock className="text-gray-400" />
                          <span>{new Date(alert.createdAt).toLocaleString()}</span>
                        </div>
                      </div>

                      {alert.value && alert.threshold && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Current Value:</span>
                            <span className="font-medium text-gray-900">{alert.value}</span>
                            <span className="text-gray-600">Threshold:</span>
                            <span className="font-medium text-gray-900">{alert.threshold}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getSeverityColor(alert.severity)}`}>
                      {alert.severity}
                    </span>
                    <button
                      onClick={() => handleAlertClick(alert)}
                      className="p-2 text-gray-400 hover:text-gray-600 transition"
                    >
                      <FiEye className="text-lg" />
                    </button>
                    {!alert.read && (
                      <button
                        onClick={() => handleMarkAsRead(alert.id)}
                        className="p-2 text-blue-400 hover:text-blue-600 transition"
                      >
                        <FiCheckCircle className="text-lg" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <nav className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-3 py-2 text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </nav>
          </div>
        )}

        {/* Alert Details Modal */}
        {showAlertDetails && selectedAlert && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Alert Details</h3>
                  <button
                    onClick={() => setShowAlertDetails(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <FiXCircle className="text-xl" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  {/* Alert Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Type</p>
                      <p className="font-medium text-gray-900 capitalize">{selectedAlert.type}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Severity</p>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(selectedAlert.severity)}`}>
                        {selectedAlert.severity}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Farmer</p>
                      <p className="font-medium text-gray-900">{selectedAlert.farmer}</p>
                    </div>
                    {selectedAlert.fieldName && (
                      <div>
                        <p className="text-sm text-gray-500">Field</p>
                        <p className="font-medium text-gray-900">{selectedAlert.fieldName}</p>
                      </div>
                    )}
                  </div>

                  {/* Message */}
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Message</p>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedAlert.message}</p>
                  </div>

                  {/* Sensor Data */}
                  {selectedAlert.value && selectedAlert.threshold && (
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Sensor Data</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <p className="text-sm text-gray-600">Current Value</p>
                          <p className="font-bold text-lg">{selectedAlert.value}</p>
                        </div>
                        <div className="bg-orange-50 p-3 rounded-lg">
                          <p className="text-sm text-gray-600">Threshold</p>
                          <p className="font-bold text-lg">{selectedAlert.threshold}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Timestamp */}
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Created At</p>
                    <p className="text-gray-900">{new Date(selectedAlert.createdAt).toLocaleString()}</p>
                  </div>

                  {/* Actions */}
                  <div className="border-t pt-4">
                    <div className="flex space-x-3">
                      {!selectedAlert.read && (
                        <button
                          onClick={() => {
                            handleMarkAsRead(selectedAlert.id);
                            setShowAlertDetails(false);
                          }}
                          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        >
                          Mark as Read
                        </button>
                      )}
                      <button
                        onClick={() => {
                          // TODO: Navigate to field details
                          alert('Field details feature coming soon!');
                        }}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                      >
                        View Field
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlertsPage; 