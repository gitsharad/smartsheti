import React, { useState, useEffect } from 'react';
import { api } from '../services/authService';
import { handleApiError } from '../services/errorHandler';

const IoTSensorManagement = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sensors, setSensors] = useState([]);
  const [selectedSensor, setSelectedSensor] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [stats, setStats] = useState({});
  const [offlineSensors, setOfflineSensors] = useState([]);
  const [maintenanceSchedule, setMaintenanceSchedule] = useState([]);
  const [dataQualityReport, setDataQualityReport] = useState({});
  
  // Form state for adding new sensor
  const [formData, setFormData] = useState({
    sensorId: '',
    fieldId: '',
    name: '',
    type: 'soil_moisture',
    manufacturer: '',
    model: '',
    location: {
      coordinates: [0, 0],
      elevation: 0,
      depth: 10
    },
    specifications: {
      measurementRange: { min: 0, max: 100, unit: '%' },
      accuracy: 95,
      resolution: 0.1,
      samplingRate: 1,
      batteryLife: 8760,
      powerSource: 'battery'
    },
    configuration: {
      samplingInterval: 3600,
      transmissionInterval: 3600,
      alertThresholds: { low: 20, high: 80, critical: 10 },
      dataRetention: 90
    }
  });

  // Form state for maintenance
  const [maintenanceData, setMaintenanceData] = useState({
    type: 'cleaning',
    description: '',
    technician: '',
    cost: 0,
    nextMaintenance: ''
  });

  useEffect(() => {
    fetchSensors();
    fetchStatistics();
    fetchOfflineSensors();
    fetchMaintenanceSchedule();
    fetchDataQualityReport();
  }, []);

  const fetchSensors = async () => {
    try {
      const response = await api.get('/iot-sensors');
      setSensors(response.data.sensors || []);
    } catch (err) {
      setError(handleApiError(err, 'Failed to fetch sensors'));
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await api.get('/iot-sensors/statistics');
      setStats(response.data.stats || {});
    } catch (err) {
      console.error('Failed to fetch statistics:', err);
    }
  };

  const fetchOfflineSensors = async () => {
    try {
      const response = await api.get('/iot-sensors/offline');
      setOfflineSensors(response.data.sensors || []);
    } catch (err) {
      console.error('Failed to fetch offline sensors:', err);
    }
  };

  const fetchMaintenanceSchedule = async () => {
    try {
      const response = await api.get('/iot-sensors/maintenance-schedule');
      setMaintenanceSchedule(response.data.maintenanceSchedule || []);
    } catch (err) {
      console.error('Failed to fetch maintenance schedule:', err);
    }
  };

  const fetchDataQualityReport = async () => {
    try {
      const response = await api.get('/iot-sensors/data-quality-report');
      setDataQualityReport(response.data.qualityReport || {});
    } catch (err) {
      console.error('Failed to fetch data quality report:', err);
    }
  };

  const handleAddSensor = async () => {
    try {
      const response = await api.post('/iot-sensors', formData);
      setShowAddModal(false);
      fetchSensors();
      fetchStatistics();
      
      // Reset form
      setFormData({
        sensorId: '',
        fieldId: '',
        name: '',
        type: 'soil_moisture',
        manufacturer: '',
        model: '',
        location: {
          coordinates: [0, 0],
          elevation: 0,
          depth: 10
        },
        specifications: {
          measurementRange: { min: 0, max: 100, unit: '%' },
          accuracy: 95,
          resolution: 0.1,
          samplingRate: 1,
          batteryLife: 8760,
          powerSource: 'battery'
        },
        configuration: {
          samplingInterval: 3600,
          transmissionInterval: 3600,
          alertThresholds: { low: 20, high: 80, critical: 10 },
          dataRetention: 90
        }
      });
      
      alert('Sensor added successfully!');
    } catch (err) {
      setError(handleApiError(err, 'Failed to add sensor'));
    }
  };

  const handleAddMaintenance = async () => {
    try {
      await api.post(`/iot-sensors/${selectedSensor._id}/maintenance`, maintenanceData);
      setShowMaintenanceModal(false);
      fetchSensors();
      fetchMaintenanceSchedule();
      
      // Reset form
      setMaintenanceData({
        type: 'cleaning',
        description: '',
        technician: '',
        cost: 0,
        nextMaintenance: ''
      });
      
      alert('Maintenance record added successfully!');
    } catch (err) {
      setError(handleApiError(err, 'Failed to add maintenance record'));
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      maintenance: 'bg-yellow-100 text-yellow-800',
      error: 'bg-red-100 text-red-800',
      offline: 'bg-red-100 text-red-800'
    };
    return colors[status] || colors.inactive;
  };

  const getSensorTypeIcon = (type) => {
    const icons = {
      soil_moisture: '💧',
      temperature: '🌡️',
      humidity: '💨',
      ph_sensor: '🧪',
      nitrogen_sensor: '🌱',
      phosphorus_sensor: '🌱',
      potassium_sensor: '🌱',
      light_intensity: '☀️',
      wind_speed: '💨',
      rainfall: '🌧️',
      pressure: '📊',
      co2_sensor: '🌿',
      multi_sensor: '🔧'
    };
    return icons[type] || '📡';
  };

  const getBatteryColor = (level) => {
    if (level >= 80) return 'text-green-600';
    if (level >= 50) return 'text-yellow-600';
    if (level >= 20) return 'text-orange-600';
    return 'text-red-600';
  };

  const getSignalColor = (strength) => {
    if (strength >= 80) return 'text-green-600';
    if (strength >= 50) return 'text-yellow-600';
    if (strength >= 30) return 'text-orange-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading IoT sensor management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">IoT Sensor Management</h1>
          <p className="text-gray-600">Monitor and manage your IoT sensors, real-time data, and device health</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <span className="text-2xl">📡</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Sensors</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.overview?.totalSensors || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <span className="text-2xl">✅</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.overview?.activeSensors || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <span className="text-2xl">❌</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Offline</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.overview?.offlineSensors || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <span className="text-2xl">🔋</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Battery</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.overview?.avgBatteryLevel ? `${stats.overview.avgBatteryLevel.toFixed(0)}%` : '0%'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <span className="text-2xl">📶</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Signal</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.overview?.avgSignalStrength ? `${stats.overview.avgSignalStrength.toFixed(0)}%` : '0%'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Add New Sensor
              </button>
              
              <button
                onClick={fetchSensors}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Refresh Data
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                Last updated: {new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sensors List */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Your Sensors</h2>
            {sensors.length === 0 ? (
              <div className="bg-white p-8 rounded-lg shadow text-center">
                <span className="text-6xl mb-4 block">📡</span>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Sensors Found</h3>
                <p className="text-gray-600 mb-4">Add your first IoT sensor to start monitoring your fields.</p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  Add First Sensor
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {sensors.map((sensor) => (
                  <div key={sensor._id} className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{getSensorTypeIcon(sensor.type)}</span>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{sensor.name}</h3>
                          <p className="text-sm text-gray-600">ID: {sensor.sensorId} • Field: {sensor.fieldId}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(sensor.status)}`}>
                        {sensor.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Type</p>
                        <p className="text-sm text-gray-900 capitalize">{sensor.type.replace('_', ' ')}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Battery</p>
                        <p className={`text-sm font-medium ${getBatteryColor(sensor.health.batteryLevel)}`}>
                          {sensor.health.batteryLevel}%
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Signal</p>
                        <p className={`text-sm font-medium ${getSignalColor(sensor.health.signalStrength)}`}>
                          {sensor.health.signalStrength}%
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Uptime</p>
                        <p className="text-sm text-gray-900">{sensor.uptimeDays || 0} days</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setSelectedSensor(sensor)}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => {
                            setSelectedSensor(sensor);
                            setShowMaintenanceModal(true);
                          }}
                          className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700"
                        >
                          Add Maintenance
                        </button>
                      </div>
                      
                      <span className="text-xs text-gray-500">
                        Last heartbeat: {sensor.health.lastHeartbeat ? 
                          new Date(sensor.health.lastHeartbeat).toLocaleString() : 'Never'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Offline Sensors */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Offline Sensors</h2>
              <div className="space-y-4">
                {offlineSensors.length === 0 ? (
                  <div className="bg-white p-4 rounded-lg shadow text-center">
                    <p className="text-gray-600">All sensors online</p>
                  </div>
                ) : (
                  offlineSensors.slice(0, 3).map((sensor) => (
                    <div key={sensor._id} className="bg-white p-4 rounded-lg shadow">
                      <h4 className="font-medium text-gray-900">{sensor.name}</h4>
                      <p className="text-sm text-gray-600">{sensor.sensorId}</p>
                      <p className="text-xs text-red-600">
                        Offline since: {sensor.health.lastHeartbeat ? 
                          new Date(sensor.health.lastHeartbeat).toLocaleString() : 'Unknown'}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Maintenance Schedule */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Maintenance Due</h2>
              <div className="space-y-4">
                {maintenanceSchedule.length === 0 ? (
                  <div className="bg-white p-4 rounded-lg shadow text-center">
                    <p className="text-gray-600">No maintenance due</p>
                  </div>
                ) : (
                  maintenanceSchedule.slice(0, 3).map((item, index) => (
                    <div key={index} className="bg-white p-4 rounded-lg shadow">
                      <h4 className="font-medium text-gray-900">{item.name}</h4>
                      <p className="text-sm text-gray-600">{item.sensorId}</p>
                      {item.daysUntilCalibration && (
                        <p className="text-xs text-yellow-600">
                          Calibration due in {item.daysUntilCalibration} days
                        </p>
                      )}
                      {item.daysUntilMaintenance && (
                        <p className="text-xs text-orange-600">
                          Maintenance due in {item.daysUntilMaintenance} days
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Data Quality Summary */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Data Quality</h2>
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Period:</span>
                    <span className="text-sm font-medium">{dataQualityReport.period || '7 days'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Sensors:</span>
                    <span className="text-sm font-medium">{dataQualityReport.stats?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Avg Quality:</span>
                    <span className="text-sm font-medium text-green-600">
                      {dataQualityReport.stats?.length > 0 ? 
                        `${(dataQualityReport.stats.reduce((sum, stat) => sum + (stat.avgConfidence || 0), 0) / dataQualityReport.stats.length).toFixed(1)}%` : 
                        'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Add Sensor Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">Add New IoT Sensor</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sensor ID</label>
                  <input
                    type="text"
                    value={formData.sensorId}
                    onChange={(e) => setFormData({...formData, sensorId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Field ID</label>
                  <input
                    type="text"
                    value={formData.fieldId}
                    onChange={(e) => setFormData({...formData, fieldId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sensor Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sensor Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="soil_moisture">Soil Moisture</option>
                    <option value="temperature">Temperature</option>
                    <option value="humidity">Humidity</option>
                    <option value="ph_sensor">pH Sensor</option>
                    <option value="nitrogen_sensor">Nitrogen Sensor</option>
                    <option value="phosphorus_sensor">Phosphorus Sensor</option>
                    <option value="potassium_sensor">Potassium Sensor</option>
                    <option value="light_intensity">Light Intensity</option>
                    <option value="wind_speed">Wind Speed</option>
                    <option value="rainfall">Rainfall</option>
                    <option value="pressure">Pressure</option>
                    <option value="co2_sensor">CO2 Sensor</option>
                    <option value="multi_sensor">Multi Sensor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Manufacturer</label>
                  <input
                    type="text"
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({...formData, manufacturer: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) => setFormData({...formData, model: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.location.coordinates[1]}
                    onChange={(e) => setFormData({
                      ...formData, 
                      location: {
                        ...formData.location,
                        coordinates: [formData.location.coordinates[0], parseFloat(e.target.value)]
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.location.coordinates[0]}
                    onChange={(e) => setFormData({
                      ...formData, 
                      location: {
                        ...formData.location,
                        coordinates: [parseFloat(e.target.value), formData.location.coordinates[1]]
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddSensor}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Add Sensor
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Maintenance Modal */}
        {showMaintenanceModal && selectedSensor && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h2 className="text-xl font-bold mb-4">Add Maintenance Record</h2>
              <p className="text-sm text-gray-600 mb-4">Sensor: {selectedSensor.name}</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Maintenance Type</label>
                  <select
                    value={maintenanceData.type}
                    onChange={(e) => setMaintenanceData({...maintenanceData, type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="cleaning">Cleaning</option>
                    <option value="calibration">Calibration</option>
                    <option value="repair">Repair</option>
                    <option value="replacement">Replacement</option>
                    <option value="inspection">Inspection</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={maintenanceData.description}
                    onChange={(e) => setMaintenanceData({...maintenanceData, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    rows="3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Technician</label>
                  <input
                    type="text"
                    value={maintenanceData.technician}
                    onChange={(e) => setMaintenanceData({...maintenanceData, technician: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cost (₹)</label>
                  <input
                    type="number"
                    value={maintenanceData.cost}
                    onChange={(e) => setMaintenanceData({...maintenanceData, cost: parseFloat(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Next Maintenance Date</label>
                  <input
                    type="date"
                    value={maintenanceData.nextMaintenance}
                    onChange={(e) => setMaintenanceData({...maintenanceData, nextMaintenance: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowMaintenanceModal(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddMaintenance}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Add Record
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IoTSensorManagement; 