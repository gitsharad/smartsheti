import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/authService';
import { handleApiError } from '../services/errorHandler';

const GPSFieldMapping = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fieldLocations, setFieldLocations] = useState([]);
  const [selectedField, setSelectedField] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [stats, setStats] = useState({});
  const [userLocation, setUserLocation] = useState(null);
  const [nearbyFields, setNearbyFields] = useState([]);
  const [weatherStations, setWeatherStations] = useState([]);
  
  // Form state for adding new field location
  const [formData, setFormData] = useState({
    fieldId: '',
    name: '',
    coordinates: [0, 0],
    area: { value: 0, unit: 'acres' },
    elevation: { value: 0, unit: 'meters' },
    soilType: 'unknown',
    irrigationType: 'unknown',
    metadata: {
      village: '',
      taluka: '',
      district: '',
      state: '',
      pincode: '',
      nearestTown: '',
      distanceFromTown: 0
    }
  });

  useEffect(() => {
    fetchFieldLocations();
    fetchStatistics();
    getUserLocation();
  }, []);

  const fetchFieldLocations = async () => {
    try {
      const response = await api.get('/gps-mapping');
      setFieldLocations(response.data.fieldLocations || []);
    } catch (err) {
      setError(handleApiError(err, 'Failed to fetch field locations'));
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await api.get('/gps-mapping/statistics');
      setStats(response.data.stats || {});
    } catch (err) {
      console.error('Failed to fetch statistics:', err);
    }
  };

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([longitude, latitude]);
          fetchNearbyFields(longitude, latitude);
          fetchWeatherStations(longitude, latitude);
        },
        (error) => {
          console.log('Location access denied:', error);
          // Set default location (Mumbai, India)
          setUserLocation([72.8777, 19.0760]);
        }
      );
    }
  };

  const fetchNearbyFields = async (longitude, latitude, radius = 10) => {
    try {
      const response = await api.get('/gps-mapping/mobile/nearby', {
        params: { longitude, latitude, radius }
      });
      setNearbyFields(response.data.fieldLocations || []);
    } catch (err) {
      console.error('Failed to fetch nearby fields:', err);
    }
  };

  const fetchWeatherStations = async (longitude, latitude, radius = 50) => {
    try {
      const response = await api.get('/gps-mapping/mobile/weather-stations', {
        params: { longitude, latitude, radius }
      });
      setWeatherStations(response.data.weatherStations || []);
    } catch (err) {
      console.error('Failed to fetch weather stations:', err);
    }
  };

  const handleAddField = async () => {
    try {
      const response = await api.post('/gps-mapping', formData);
      setShowAddModal(false);
      fetchFieldLocations();
      fetchStatistics();
      
      // Reset form
      setFormData({
        fieldId: '',
        name: '',
        coordinates: [0, 0],
        area: { value: 0, unit: 'acres' },
        elevation: { value: 0, unit: 'meters' },
        soilType: 'unknown',
        irrigationType: 'unknown',
        metadata: {
          village: '',
          taluka: '',
          district: '',
          state: '',
          pincode: '',
          nearestTown: '',
          distanceFromTown: 0
        }
      });
      
      alert('Field location added successfully!');
    } catch (err) {
      setError(handleApiError(err, 'Failed to add field location'));
    }
  };

  const handleUpdateLocation = async (fieldId, coordinates) => {
    try {
      await api.put(`/gps-mapping/mobile/location/${fieldId}`, {
        coordinates,
        accuracy: 95,
        surveyMethod: 'mobile_gps'
      });
      fetchFieldLocations();
      alert('Field location updated successfully!');
    } catch (err) {
      setError(handleApiError(err, 'Failed to update field location'));
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      fallow: 'bg-yellow-100 text-yellow-800',
      sold: 'bg-red-100 text-red-800'
    };
    return colors[status] || colors.active;
  };

  const getSoilTypeColor = (soilType) => {
    const colors = {
      clay: 'bg-red-100 text-red-800',
      loam: 'bg-green-100 text-green-800',
      sandy: 'bg-yellow-100 text-yellow-800',
      silt: 'bg-blue-100 text-blue-800',
      peaty: 'bg-purple-100 text-purple-800',
      chalky: 'bg-gray-100 text-gray-800',
      unknown: 'bg-gray-100 text-gray-600'
    };
    return colors[soilType] || colors.unknown;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading GPS field mapping...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">GPS Field Mapping</h1>
          <p className="text-gray-600">Manage field locations, boundaries, and GPS coordinates</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Fields</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.overview?.totalFields || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Area</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.overview?.totalArea ? `${stats.overview.totalArea.toFixed(1)} acres` : '0 acres'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Elevation</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.overview?.avgElevation ? `${stats.overview.avgElevation.toFixed(0)}m` : '0m'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Weather Stations</p>
                <p className="text-2xl font-semibold text-gray-900">{weatherStations.length}</p>
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
                Add Field Location
              </button>
              
              <button
                onClick={() => setShowMapModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                View Map
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={fetchFieldLocations}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Field Locations List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Main Field Locations */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Your Fields</h2>
            {fieldLocations.length === 0 ? (
              <div className="bg-white p-8 rounded-lg shadow text-center">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Fields Mapped</h3>
                <p className="text-gray-600 mb-4">Add your first field location to get started with GPS mapping.</p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  Add First Field
                </button>
              </div>
            ) : (
              fieldLocations.map((field) => (
                <div key={field._id} className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{field.name}</h3>
                      <p className="text-sm text-gray-600">Field ID: {field.fieldId}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(field.status)}`}>
                      {field.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Coordinates</p>
                      <p className="text-sm text-gray-900">
                        {field.location.coordinates[1].toFixed(6)}, {field.location.coordinates[0].toFixed(6)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Area</p>
                      <p className="text-sm text-gray-900">
                        {field.area.value} {field.area.unit}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Soil Type</p>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getSoilTypeColor(field.soilType)}`}>
                        {field.soilType}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Location</p>
                      <p className="text-sm text-gray-900">
                        {field.metadata.village}, {field.metadata.district}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedField(field)}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => handleUpdateLocation(field.fieldId, field.location.coordinates)}
                        className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                      >
                        Update GPS
                      </button>
                    </div>
                    
                    <span className="text-xs text-gray-500">
                      {new Date(field.lastSurvey.date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Nearby Fields & Weather */}
          <div className="space-y-6">
            {/* Nearby Fields */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Nearby Fields</h2>
              <div className="space-y-4">
                {nearbyFields.length === 0 ? (
                  <div className="bg-white p-4 rounded-lg shadow text-center">
                    <p className="text-gray-600">No nearby fields found</p>
                  </div>
                ) : (
                  nearbyFields.slice(0, 3).map((field) => (
                    <div key={field._id} className="bg-white p-4 rounded-lg shadow">
                      <h4 className="font-medium text-gray-900">{field.name}</h4>
                      <p className="text-sm text-gray-600">
                        {field.metadata.village}, {field.metadata.district}
                      </p>
                      <p className="text-xs text-gray-500">
                        {field.area.value} {field.area.unit}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Weather Stations */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Weather Stations</h2>
              <div className="space-y-4">
                {weatherStations.length === 0 ? (
                  <div className="bg-white p-4 rounded-lg shadow text-center">
                    <p className="text-gray-600">No weather stations nearby</p>
                  </div>
                ) : (
                  weatherStations.slice(0, 3).map((station) => (
                    <div key={station.stationId} className="bg-white p-4 rounded-lg shadow">
                      <h4 className="font-medium text-gray-900">{station.location}</h4>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div>
                          <p className="text-xs text-gray-600">Temperature</p>
                          <p className="text-sm font-medium">{station.currentWeather.temperature.toFixed(1)}°C</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Humidity</p>
                          <p className="text-sm font-medium">{station.currentWeather.humidity.toFixed(0)}%</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Add Field Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">Add Field Location</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Field Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.coordinates[1]}
                    onChange={(e) => setFormData({
                      ...formData, 
                      coordinates: [formData.coordinates[0], parseFloat(e.target.value)]
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.coordinates[0]}
                    onChange={(e) => setFormData({
                      ...formData, 
                      coordinates: [parseFloat(e.target.value), formData.coordinates[1]]
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Area Value</label>
                  <input
                    type="number"
                    value={formData.area.value}
                    onChange={(e) => setFormData({
                      ...formData, 
                      area: {...formData.area, value: parseFloat(e.target.value)}
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Area Unit</label>
                  <select
                    value={formData.area.unit}
                    onChange={(e) => setFormData({
                      ...formData, 
                      area: {...formData.area, unit: e.target.value}
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="acres">Acres</option>
                    <option value="hectares">Hectares</option>
                    <option value="sq_meters">Square Meters</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Soil Type</label>
                  <select
                    value={formData.soilType}
                    onChange={(e) => setFormData({...formData, soilType: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="unknown">Unknown</option>
                    <option value="clay">Clay</option>
                    <option value="loam">Loam</option>
                    <option value="sandy">Sandy</option>
                    <option value="silt">Silt</option>
                    <option value="peaty">Peaty</option>
                    <option value="chalky">Chalky</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Village</label>
                  <input
                    type="text"
                    value={formData.metadata.village}
                    onChange={(e) => setFormData({
                      ...formData, 
                      metadata: {...formData.metadata, village: e.target.value}
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">District</label>
                  <input
                    type="text"
                    value={formData.metadata.district}
                    onChange={(e) => setFormData({
                      ...formData, 
                      metadata: {...formData.metadata, district: e.target.value}
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
                  onClick={handleAddField}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Add Field
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Map Modal */}
        {showMapModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Field Map</h2>
                <button
                  onClick={() => setShowMapModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="bg-gray-200 h-96 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
                  </svg>
                  <p className="text-gray-600">Interactive map will be integrated here</p>
                  <p className="text-sm text-gray-500 mt-2">Features: Field boundaries, GPS tracking, weather overlay</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GPSFieldMapping; 