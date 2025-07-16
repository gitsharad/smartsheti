import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiMap, 
  FiSearch, 
  FiFilter, 
  FiEye, 
  FiAlertTriangle,
  FiArrowLeft,
  FiDroplet,
  FiThermometer,
  FiActivity,
  FiTrendingUp,
  FiTrendingDown,
  FiCheckCircle,
  FiXCircle,
  FiInfo
} from 'react-icons/fi';
import { api } from '../services/authService';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const FieldMonitoring = () => {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedField, setSelectedField] = useState(null);
  const [showFieldDetails, setShowFieldDetails] = useState(false);
  const [fieldDetailsLoading, setFieldDetailsLoading] = useState(false);
  const [fieldDetailsError, setFieldDetailsError] = useState('');
  const [sensorData, setSensorData] = useState(null);
  const [sensorDataLoading, setSensorDataLoading] = useState(false);
  const [sensorDataError, setSensorDataError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadFields();
  }, [currentPage, filterStatus]);

  const loadFields = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/coordinator/field-overview', {
        params: {
          page: currentPage,
          limit: 10
        }
      });
      
      setFields(response.data.fields);
      setTotalPages(response.data.pagination.totalPages);
    } catch (err) {
      setError('Failed to load fields');
      console.error('Error loading fields:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (e) => {
    setFilterStatus(e.target.value);
    setCurrentPage(1);
  };

  const handleFieldClick = async (field) => {
    setFieldDetailsLoading(true);
    setFieldDetailsError('');
    setShowFieldDetails(true);
    setSensorData(null);
    setSensorDataLoading(true);
    setSensorDataError('');
    try {
      const res = await api.get(`/admin/fields/${field._id}`);
      setSelectedField(res.data.field);
      // Fetch sensor data
      const sensorRes = await api.get(`/admin/fields/${field._id}/sensor-data?days=7`);
      setSensorData(sensorRes.data);
    } catch (e) {
      setFieldDetailsError('Failed to load field details.');
      setSelectedField(null);
      setSensorDataError('Failed to load sensor data.');
      setSensorData(null);
    } finally {
      setFieldDetailsLoading(false);
      setSensorDataLoading(false);
    }
  };

  const filteredFields = fields.filter(field => {
    const matchesSearch = field.fieldName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         field.fieldId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         field.owner?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || field.status.toLowerCase() === filterStatus.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'good':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'alert':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getMoistureColor = (moisture) => {
    if (moisture < 30) return 'text-red-600';
    if (moisture < 50) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getTemperatureColor = (temperature) => {
    if (temperature > 35) return 'text-red-600';
    if (temperature > 30) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case 'good':
        return <FiCheckCircle className="text-green-500" />;
      case 'warning':
        return <FiAlertTriangle className="text-yellow-500" />;
      case 'alert':
        return <FiXCircle className="text-red-500" />;
      default:
        return <FiInfo className="text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F9FAF6] to-[#F5E9DA] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-green-800">Loading fields...</p>
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
              <h1 className="text-3xl md:text-4xl font-bold text-green-800 tracking-tight font-[Baloo Bhaina 2]">Field Monitoring</h1>
              <p className="text-green-700 text-sm md:text-base font-semibold">Monitor all fields managed by your farmers</p>
            </div>
          </div>
        </header>

        {/* Search and Filter */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search fields..."
                value={searchTerm}
                onChange={handleSearch}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            
            <div className="relative">
              <FiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                value={filterStatus}
                onChange={handleFilterChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="good">Good</option>
                <option value="warning">Warning</option>
                <option value="alert">Alert</option>
              </select>
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

        {/* Fields Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFields.map((field) => (
            <div
              key={field._id}
              className="bg-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all duration-300 cursor-pointer"
              onClick={() => handleFieldClick(field)}
            >
              {/* Field Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <FiMap className="text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{field.fieldName || field.fieldId}</h3>
                    <p className="text-sm text-gray-500">{field.owner?.name}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  {getStatusIcon(field.status)}
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(field.status)}`}>
                    {field.status}
                  </span>
                </div>
              </div>

              {/* Sensor Data */}
              {field.lastSensorData && (
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FiDroplet className="text-blue-500" />
                      <span className="text-sm text-gray-600">Moisture</span>
                    </div>
                    <span className={`font-semibold ${getMoistureColor(field.lastSensorData.moisture)}`}>
                      {field.lastSensorData.moisture}%
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FiThermometer className="text-red-500" />
                      <span className="text-sm text-gray-600">Temperature</span>
                    </div>
                    <span className={`font-semibold ${getTemperatureColor(field.lastSensorData.temperature)}`}>
                      {field.lastSensorData.temperature}°C
                    </span>
                  </div>
                </div>
              )}

              {/* Field Info */}
              <div className="border-t pt-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Crop</p>
                    <p className="font-medium text-gray-900">{field.cropType || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Area</p>
                    <p className="font-medium text-gray-900">{field.area || 'N/A'} acres</p>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFieldClick(field);
                  }}
                  className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  <FiEye className="mr-2" />
                  View Details
                </button>
              </div>
            </div>
          ))}
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

        {/* Field Details Modal */}
        {showFieldDetails && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Field Details</h3>
                  <button
                    onClick={() => setShowFieldDetails(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <FiXCircle className="text-xl" />
                  </button>
                </div>
                {fieldDetailsLoading ? (
                  <div className="text-green-800 text-center py-8">Loading field details...</div>
                ) : fieldDetailsError ? (
                  <div className="text-red-600 text-center py-8">{fieldDetailsError}</div>
                ) : selectedField ? (
                  <div className="space-y-4">
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Field Name</p>
                        <p className="font-medium text-gray-900">{selectedField.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Owner</p>
                        <p className="font-medium text-gray-900">{selectedField.owner?.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Crop Type</p>
                        <p className="font-medium text-gray-900">{selectedField.currentCrop?.name || 'Not specified'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Area</p>
                        <p className="font-medium text-gray-900">{selectedField.location?.area?.value || 'N/A'} {selectedField.location?.area?.unit || ''}</p>
                      </div>
                    </div>
                    {/* Soil Info */}
                    <div className="border-t pt-4">
                      <h4 className="font-medium text-green-900 mb-2">Soil Information</h4>
                      {selectedField.soilInfo ? (
                        <ul className="text-sm text-gray-700 space-y-1">
                          <li>Type: {selectedField.soilInfo.type || 'N/A'}</li>
                          <li>pH: {selectedField.soilInfo.ph || 'N/A'}</li>
                          <li>Organic Matter: {selectedField.soilInfo.organicMatter || 'N/A'}</li>
                          <li>Nitrogen: {selectedField.soilInfo.nitrogen || 'N/A'}</li>
                          <li>Phosphorus: {selectedField.soilInfo.phosphorus || 'N/A'}</li>
                          <li>Potassium: {selectedField.soilInfo.potassium || 'N/A'}</li>
                          <li>Last Tested: {selectedField.soilInfo.lastTested ? new Date(selectedField.soilInfo.lastTested).toLocaleDateString() : 'N/A'}</li>
                        </ul>
                      ) : <div className="text-gray-500 text-sm">No soil info available.</div>}
                    </div>
                    {/* Irrigation Info */}
                    <div className="border-t pt-4">
                      <h4 className="font-medium text-green-900 mb-2">Irrigation</h4>
                      {selectedField.irrigation ? (
                        <ul className="text-sm text-gray-700 space-y-1">
                          <li>Type: {selectedField.irrigation.type || 'N/A'}</li>
                          <li>Automation: {selectedField.irrigation.automation ? 'Yes' : 'No'}</li>
                          <li>Schedule: {selectedField.irrigation.schedule?.frequency || 'N/A'} {selectedField.irrigation.schedule?.duration ? `(${selectedField.irrigation.schedule.duration} min)` : ''}</li>
                        </ul>
                      ) : <div className="text-gray-500 text-sm">No irrigation info available.</div>}
                    </div>
                    {/* Crop History */}
                    <div className="border-t pt-4">
                      <h4 className="font-medium text-green-900 mb-2">Crop History</h4>
                      {selectedField.cropHistory && selectedField.cropHistory.length > 0 ? (
                        <ul className="text-sm text-gray-700 space-y-1">
                          {selectedField.cropHistory.map((c, idx) => (
                            <li key={idx} className="border-b py-1">
                              <span className="font-semibold">{c.crop}</span> ({c.variety || 'N/A'}) - {c.season || 'N/A'}<br/>
                              Planted: {c.plantedDate ? new Date(c.plantedDate).toLocaleDateString() : 'N/A'}, Harvested: {c.harvestedDate ? new Date(c.harvestedDate).toLocaleDateString() : 'N/A'}<br/>
                              Yield: {c.yield || 'N/A'} {c.yieldUnit || ''}
                              {c.notes && <div className="text-xs text-gray-500">Notes: {c.notes}</div>}
                            </li>
                          ))}
                        </ul>
                      ) : <div className="text-gray-500 text-sm">No crop history available.</div>}
                    </div>
                    {/* Financials */}
                    <div className="border-t pt-4">
                      <h4 className="font-medium text-green-900 mb-2">Financials</h4>
                      {selectedField.financial ? (
                        <ul className="text-sm text-gray-700 space-y-1">
                          <li>Investment: Seeds: {selectedField.financial.investment?.seeds || 0}, Fertilizers: {selectedField.financial.investment?.fertilizers || 0}, Pesticides: {selectedField.financial.investment?.pesticides || 0}, Labor: {selectedField.financial.investment?.labor || 0}, Irrigation: {selectedField.financial.investment?.irrigation || 0}, Other: {selectedField.financial.investment?.other || 0}</li>
                          <li>Revenue: Expected: {selectedField.financial.revenue?.expected || 0}, Actual: {selectedField.financial.revenue?.actual || 0}</li>
                          <li>Profit: {selectedField.financial.profit || 0}</li>
                        </ul>
                      ) : <div className="text-gray-500 text-sm">No financial info available.</div>}
                    </div>
                    {/* Notes */}
                    <div className="border-t pt-4">
                      <h4 className="font-medium text-green-900 mb-2">Notes</h4>
                      {selectedField.notes && selectedField.notes.length > 0 ? (
                        <ul className="text-sm text-gray-700 space-y-1">
                          {selectedField.notes.map((n, idx) => (
                            <li key={idx} className="border-b py-1">
                              {n.content}
                              <div className="text-xs text-gray-500">By: {n.author?.name || n.author || 'Unknown'} on {n.createdAt ? new Date(n.createdAt).toLocaleDateString() : 'N/A'}</div>
                            </li>
                          ))}
                        </ul>
                      ) : <div className="text-gray-500 text-sm">No notes available.</div>}
                    </div>
                    {/* Sensor Data Timeline */}
                    <div className="border-t pt-4">
                      <h4 className="font-medium text-green-900 mb-2">Sensor Data Timeline (Last 7 Days)</h4>
                      {sensorDataLoading ? (
                        <div className="text-green-800">Loading sensor data...</div>
                      ) : sensorDataError ? (
                        <div className="text-red-600">{sensorDataError}</div>
                      ) : sensorData && sensorData.sensors ? (
                        <div className="space-y-6">
                          {sensorData.sensors.map((sensor, idx) => (
                            <div key={sensor.type} className="bg-gray-50 rounded p-2">
                              <h5 className="font-semibold mb-1 capitalize">{sensor.type} Chart</h5>
                              {sensor.readings.length > 0 ? (
                                <Line
                                  data={{
                                    labels: sensor.readings.map(r => new Date(r.timestamp).toLocaleString()),
                                    datasets: [
                                      {
                                        label: `${sensor.type.charAt(0).toUpperCase() + sensor.type.slice(1)}`,
                                        data: sensor.readings.map(r => r.value),
                                        borderColor: sensor.type === 'moisture' ? 'rgba(34,197,94,1)' : 'rgba(239,68,68,1)',
                                        backgroundColor: sensor.type === 'moisture' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
                                        tension: 0.3,
                                        fill: true,
                                        pointRadius: 2
                                      }
                                    ]
                                  }}
                                  options={{
                                    responsive: true,
                                    plugins: {
                                      legend: { display: false },
                                      title: { display: false }
                                    },
                                    scales: {
                                      x: { title: { display: true, text: 'Time' }, ticks: { maxTicksLimit: 8 } },
                                      y: { title: { display: true, text: sensor.type === 'moisture' ? 'Moisture (%)' : 'Temperature (°C)' } }
                                    }
                                  }}
                                  height={180}
                                />
                              ) : (
                                <div className="text-gray-500 text-sm">No {sensor.type} data available.</div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FieldMonitoring; 