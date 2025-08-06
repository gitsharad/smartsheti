import React, { useState, useEffect } from 'react';
import { FiClock, FiMapPin, FiMonitor, FiSmartphone, FiX, FiFilter, FiDownload, FiAlertTriangle, FiCheck } from 'react-icons/fi';
import apiRoutes from '../services/apiRoutes';

const LoginHistory = ({ isOpen, onClose }) => {
  const [loginHistory, setLoginHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, suspicious, recent
  const [selectedDevice, setSelectedDevice] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchLoginHistory();
    }
  }, [isOpen]);

  const fetchLoginHistory = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await apiRoutes.getLoginHistory();
      setLoginHistory(response.data.history || []);
    } catch (error) {
      setError('लॉगिन इतिहास लोड करताना त्रुटी आली');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeSession = async (sessionId) => {
    try {
      await apiRoutes.revokeSession(sessionId);
      fetchLoginHistory(); // Refresh the list
    } catch (error) {
      setError('सेशन रद्द करताना त्रुटी आली');
    }
  };

  const handleReportSuspicious = async (sessionId) => {
    try {
      await apiRoutes.reportSuspiciousActivity(sessionId);
      fetchLoginHistory(); // Refresh the list
    } catch (error) {
      setError('सशंकित क्रियाकलाप नोंदवताना त्रुटी आली');
    }
  };

  const downloadHistory = () => {
    const csvData = [
      ['Date', 'Time', 'Device', 'Location', 'IP Address', 'Status'],
      ...loginHistory.map(session => [
        new Date(session.timestamp).toLocaleDateString(),
        new Date(session.timestamp).toLocaleTimeString(),
        session.deviceType,
        session.location,
        session.ipAddress,
        session.status
      ])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'login-history.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getDeviceIcon = (deviceType) => {
    switch (deviceType?.toLowerCase()) {
      case 'mobile':
        return <FiSmartphone className="text-blue-600" />;
      case 'desktop':
      case 'computer':
        return <FiMonitor className="text-green-600" />;
      default:
        return <FiMonitor className="text-gray-600" />;
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'success':
        return <FiCheck className="text-green-600" />;
      case 'failed':
        return <FiAlertTriangle className="text-red-600" />;
      case 'suspicious':
        return <FiAlertTriangle className="text-yellow-600" />;
      default:
        return <FiClock className="text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'suspicious':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredHistory = loginHistory.filter(session => {
    if (filter === 'suspicious') {
      return session.status === 'suspicious' || session.status === 'failed';
    }
    if (filter === 'recent') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      return new Date(session.timestamp) > oneWeekAgo;
    }
    return true;
  });

  const renderSessionDetails = (session) => (
    <div className="bg-gray-50 rounded-lg p-4 mt-3">
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="font-semibold text-gray-700">IP Address:</span>
          <p className="text-gray-600">{session.ipAddress}</p>
        </div>
        <div>
          <span className="font-semibold text-gray-700">User Agent:</span>
          <p className="text-gray-600 text-xs">{session.userAgent}</p>
        </div>
        <div>
          <span className="font-semibold text-gray-700">Location:</span>
          <p className="text-gray-600">{session.location || 'Unknown'}</p>
        </div>
        <div>
          <span className="font-semibold text-gray-700">Session ID:</span>
          <p className="text-gray-600 font-mono text-xs">{session.sessionId}</p>
        </div>
      </div>
      
      <div className="flex space-x-2 mt-3">
        <button
          onClick={() => handleRevokeSession(session.sessionId)}
          className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
        >
          सेशन रद्द करा
        </button>
        {session.status === 'suspicious' && (
          <button
            onClick={() => handleReportSuspicious(session.sessionId)}
            className="px-3 py-1 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-700"
          >
            नोंदवा
          </button>
        )}
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-green-900 flex items-center">
            <FiClock className="mr-2" />
            लॉगिन इतिहास
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FiX className="text-xl" />
          </button>
        </div>

        <div className="p-6">
          {/* Filters and Actions */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex space-x-2">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">सर्व लॉगिन</option>
                <option value="recent">गेल्या आठवड्यातील</option>
                <option value="suspicious">सशंकित क्रियाकलाप</option>
              </select>
            </div>
            
            <button
              onClick={downloadHistory}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
            >
              <FiDownload className="mr-2" />
              डाउनलोड करा
            </button>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 flex items-center">
                <FiAlertTriangle className="mr-2" />
                {error}
              </p>
            </div>
          )}

          {/* Login History List */}
          <div className="max-h-[60vh] overflow-y-auto">
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="text-center py-8">
                <FiClock className="text-4xl mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">कोणताही लॉगिन इतिहास सापडला नाही</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredHistory.map((session, index) => (
                  <div key={session.sessionId || index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getDeviceIcon(session.deviceType)}
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-gray-900">
                              {session.deviceType || 'Unknown Device'}
                            </span>
                            {getStatusIcon(session.status)}
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(session.status)}`}>
                              {session.status}
                            </span>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                            <span className="flex items-center">
                              <FiClock className="mr-1" />
                              {new Date(session.timestamp).toLocaleString()}
                            </span>
                            {session.location && (
                              <span className="flex items-center">
                                <FiMapPin className="mr-1" />
                                {session.location}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => setSelectedDevice(selectedDevice === session.sessionId ? null : session.sessionId)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <FiFilter className="text-lg" />
                      </button>
                    </div>
                    
                    {selectedDevice === session.sessionId && renderSessionDetails(session)}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Security Tips */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
              <FiAlertTriangle className="mr-2" />
              सुरक्षा सल्ले
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• आपल्याला माहित नसलेले लॉगिन दिसल्यास त्वरित पासवर्ड बदला</li>
              <li>• सशंकित क्रियाकलाप नोंदवा</li>
              <li>• दोन-फॅक्टर प्रमाणीकरण वापरा</li>
              <li>• नियमितपणे लॉगिन इतिहास तपासा</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginHistory; 