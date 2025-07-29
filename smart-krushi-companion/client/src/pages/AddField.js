import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiArrowLeft, 
  FiMapPin, 
  FiDroplet, 
  FiThermometer, 
  FiActivity,
  FiSave,
  FiX,
  FiPlus,
  FiTrash2
} from 'react-icons/fi';
import { api } from '../services/authService';

const AddField = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [farmers, setFarmers] = useState([]);
  const [selectedFarmer, setSelectedFarmer] = useState('');
  
  // Helper function to get current user role
  const getCurrentUserRole = () => {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    return user?.role;
  };

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    fieldId: '',
    location: {
      coordinates: {
        lat: null,
        lng: null
      },
      address: {
        state: '',
        district: '',
        village: '',
        pincode: '',
        fullAddress: ''
      },
      area: {
        value: '',
        unit: 'acres'
      }
    },
    soilInfo: {
      type: '',
      ph: '',
      organicMatter: '',
      nitrogen: '',
      phosphorus: '',
      potassium: '',
      lastTested: ''
    },
    currentCrop: {
      name: '',
      variety: '',
      plantedDate: '',
      expectedHarvest: '',
      status: 'planning',
      yield: {
        expected: '',
        actual: '',
        unit: 'kg'
      }
    },
    sensors: [],
    irrigation: {
      type: 'manual',
      automation: false,
      schedule: {
        frequency: '',
        duration: '',
        timeSlots: []
      }
    }
  });

  // Load farmers for admin/coordinator
  useEffect(() => {
    const loadFarmers = async () => {
      try {
        const response = await api.get('/admin/farmers');
        setFarmers(response.data.farmers || []);
      } catch (err) {
        console.error('Error loading farmers:', err);
      }
    };

    // Get user role from user object
    const userRole = getCurrentUserRole();
    
    console.log('Current user:', localStorage.getItem('user')); // Debug log
    console.log('Current user role:', userRole); // Debug log
    
    // Only load farmers if user is admin or coordinator
    if (userRole === 'admin' || userRole === 'coordinator') {
      loadFarmers();
    }
  }, []);

  const handleInputChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleNestedInputChange = (section, subsection, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [subsection]: {
          ...prev[section][subsection],
          [field]: value
        }
      }
    }));
  };

  const handleLocationChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      location: {
        ...prev.location,
        coordinates: {
          ...prev.location.coordinates,
          [field]: value
        }
      }
    }));
  };

  const handleAddressChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      location: {
        ...prev.location,
        address: {
          ...prev.location.address,
          [field]: value
        }
      }
    }));
  };

  const addSensor = () => {
    const newSensor = {
      sensorId: '',
      type: 'moisture',
      location: {
        lat: null,
        lng: null
      },
      status: 'active'
    };
    setFormData(prev => ({
      ...prev,
      sensors: [...prev.sensors, newSensor]
    }));
  };

  const removeSensor = (index) => {
    setFormData(prev => ({
      ...prev,
      sensors: prev.sensors.filter((_, i) => i !== index)
    }));
  };

  const updateSensor = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      sensors: prev.sensors.map((sensor, i) => 
        i === index ? { ...sensor, [field]: value } : sensor
      )
    }));
  };

  const addTimeSlot = () => {
    setFormData(prev => ({
      ...prev,
      irrigation: {
        ...prev.irrigation,
        schedule: {
          ...prev.irrigation.schedule,
          timeSlots: [...prev.irrigation.schedule.timeSlots, '']
        }
      }
    }));
  };

  const removeTimeSlot = (index) => {
    setFormData(prev => ({
      ...prev,
      irrigation: {
        ...prev.irrigation,
        schedule: {
          ...prev.irrigation.schedule,
          timeSlots: prev.irrigation.schedule.timeSlots.filter((_, i) => i !== index)
        }
      }
    }));
  };

  const updateTimeSlot = (index, value) => {
    setFormData(prev => ({
      ...prev,
      irrigation: {
        ...prev.irrigation,
        schedule: {
          ...prev.irrigation.schedule,
          timeSlots: prev.irrigation.schedule.timeSlots.map((slot, i) => 
            i === index ? value : slot
          )
        }
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validate required fields
      if (!formData.name || !formData.fieldId) {
        setError('Field name and Field ID are required');
        setLoading(false);
        return;
      }

      const submitData = {
        ...formData,
        farmerId: selectedFarmer || undefined
      };

      // Remove empty values
      Object.keys(submitData).forEach(key => {
        if (submitData[key] === '' || submitData[key] === null) {
          delete submitData[key];
        }
      });

      console.log('Submitting field data:', submitData);
      const response = await api.post('/fields', submitData);
      
      console.log('Field created successfully:', response.data);
      setSuccess('✅ Field created successfully! Redirecting to dashboard in 2 seconds...');
      
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err) {
      console.error('Field creation error:', err);
      setError(err.response?.data?.message?.english || err.response?.data?.error || 'Failed to create field');
    } finally {
      setLoading(false);
    }
  };

  const generateFieldId = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    const fieldId = `FLD${timestamp}${random}`;
    setFormData(prev => ({ ...prev, fieldId }));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg bg-white shadow-sm hover:bg-gray-50"
            >
              <FiArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Add New Field</h1>
              <p className="text-gray-600">Create a new field for monitoring</p>
            </div>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 p-6 bg-green-50 border-2 border-green-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg className="w-6 h-6 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-green-800 font-semibold text-lg">{success}</p>
                  <p className="text-green-600 text-sm mt-1">You will be redirected automatically, or click the button below.</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/')}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        )}
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Field Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter field name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Field ID *
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    required
                    value={formData.fieldId}
                    onChange={(e) => setFormData(prev => ({ ...prev, fieldId: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="FLD123456"
                  />
                  <button
                    type="button"
                    onClick={generateFieldId}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  >
                    Generate
                  </button>
                </div>
              </div>

              {/* Farmer Selection for Admin/Coordinator */}
              {(() => {
                const userRole = getCurrentUserRole();
                return (userRole === 'admin' || userRole === 'coordinator');
              })() && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assign to Farmer
                  </label>
                  <select
                    value={selectedFarmer}
                    onChange={(e) => setSelectedFarmer(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select a farmer (optional)</option>
                    {farmers.map(farmer => (
                      <option key={farmer._id} value={farmer._id}>
                        {farmer.name} - {farmer.phone}
                      </option>
                    ))}
                  </select>
                  {farmers.length === 0 && (
                    <p className="text-sm text-gray-500 mt-1">No farmers loaded. Check if you're logged in as admin/coordinator.</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Location Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FiMapPin className="w-5 h-5 mr-2" />
              Location Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Latitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.location.coordinates.lat || ''}
                  onChange={(e) => handleLocationChange('lat', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="19.7515"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Longitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.location.coordinates.lng || ''}
                  onChange={(e) => handleLocationChange('lng', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="75.7139"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State
                </label>
                <input
                  type="text"
                  value={formData.location.address.state}
                  onChange={(e) => handleAddressChange('state', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Maharashtra"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  District
                </label>
                <input
                  type="text"
                  value={formData.location.address.district}
                  onChange={(e) => handleAddressChange('district', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Aurangabad"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Village
                </label>
                <input
                  type="text"
                  value={formData.location.address.village}
                  onChange={(e) => handleAddressChange('village', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Village name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pincode
                </label>
                <input
                  type="text"
                  value={formData.location.address.pincode}
                  onChange={(e) => handleAddressChange('pincode', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="431001"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Area Value
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.location.area.value}
                  onChange={(e) => handleNestedInputChange('location', 'area', 'value', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="5.0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Area Unit
                </label>
                <select
                  value={formData.location.area.unit}
                  onChange={(e) => handleNestedInputChange('location', 'area', 'unit', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="acres">Acres</option>
                  <option value="hectares">Hectares</option>
                  <option value="sq_meters">Square Meters</option>
                </select>
              </div>
            </div>
          </div>

          {/* Soil Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Soil Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Soil Type
                </label>
                <select
                  value={formData.soilInfo.type}
                  onChange={(e) => handleInputChange('soilInfo', 'type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select soil type</option>
                  <option value="black">Black Soil</option>
                  <option value="red">Red Soil</option>
                  <option value="laterite">Laterite Soil</option>
                  <option value="alluvial">Alluvial Soil</option>
                  <option value="mountain">Mountain Soil</option>
                  <option value="desert">Desert Soil</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  pH Level
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="14"
                  value={formData.soilInfo.ph || ''}
                  onChange={(e) => handleInputChange('soilInfo', 'ph', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="6.5"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Organic Matter (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={formData.soilInfo.organicMatter || ''}
                  onChange={(e) => handleInputChange('soilInfo', 'organicMatter', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="2.5"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nitrogen (kg/ha)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.soilInfo.nitrogen || ''}
                  onChange={(e) => handleInputChange('soilInfo', 'nitrogen', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="150"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phosphorus (kg/ha)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.soilInfo.phosphorus || ''}
                  onChange={(e) => handleInputChange('soilInfo', 'phosphorus', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="25"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Potassium (kg/ha)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.soilInfo.potassium || ''}
                  onChange={(e) => handleInputChange('soilInfo', 'potassium', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="200"
                />
              </div>
            </div>
          </div>

          {/* Current Crop Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Crop Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Crop Name
                </label>
                <input
                  type="text"
                  value={formData.currentCrop.name}
                  onChange={(e) => handleInputChange('currentCrop', 'name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Wheat"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Variety
                </label>
                <input
                  type="text"
                  value={formData.currentCrop.variety}
                  onChange={(e) => handleInputChange('currentCrop', 'variety', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="HD 2967"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Planted Date
                </label>
                <input
                  type="date"
                  value={formData.currentCrop.plantedDate}
                  onChange={(e) => handleInputChange('currentCrop', 'plantedDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expected Harvest Date
                </label>
                <input
                  type="date"
                  value={formData.currentCrop.expectedHarvest}
                  onChange={(e) => handleInputChange('currentCrop', 'expectedHarvest', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Crop Status
                </label>
                <select
                  value={formData.currentCrop.status}
                  onChange={(e) => handleInputChange('currentCrop', 'status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="planning">Planning</option>
                  <option value="prepared">Prepared</option>
                  <option value="planted">Planted</option>
                  <option value="growing">Growing</option>
                  <option value="flowering">Flowering</option>
                  <option value="fruiting">Fruiting</option>
                  <option value="harvested">Harvested</option>
                  <option value="fallow">Fallow</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expected Yield
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.currentCrop.yield.expected || ''}
                  onChange={(e) => handleNestedInputChange('currentCrop', 'yield', 'expected', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="5000"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Yield Unit
                </label>
                <select
                  value={formData.currentCrop.yield.unit}
                  onChange={(e) => handleNestedInputChange('currentCrop', 'yield', 'unit', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="kg">Kilograms (kg)</option>
                  <option value="quintal">Quintal</option>
                  <option value="ton">Ton</option>
                </select>
              </div>
            </div>
          </div>

          {/* Sensors Configuration */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <FiActivity className="w-5 h-5 mr-2" />
                Sensors Configuration
              </h2>
              <button
                type="button"
                onClick={addSensor}
                className="flex items-center px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
              >
                <FiPlus className="w-4 h-4 mr-1" />
                Add Sensor
              </button>
            </div>
            
            {formData.sensors.map((sensor, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-900">Sensor {index + 1}</h3>
                  <button
                    type="button"
                    onClick={() => removeSensor(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sensor ID
                    </label>
                    <input
                      type="text"
                      value={sensor.sensorId}
                      onChange={(e) => updateSensor(index, 'sensorId', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="SENSOR001"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sensor Type
                    </label>
                    <select
                      value={sensor.type}
                      onChange={(e) => updateSensor(index, 'type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="moisture">Moisture</option>
                      <option value="temperature">Temperature</option>
                      <option value="humidity">Humidity</option>
                      <option value="ph">pH</option>
                      <option value="nitrogen">Nitrogen</option>
                      <option value="weather">Weather</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={sensor.status}
                      onChange={(e) => updateSensor(index, 'status', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="offline">Offline</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
            
            {formData.sensors.length === 0 && (
              <p className="text-gray-500 text-center py-4">No sensors added yet. Click "Add Sensor" to add one.</p>
            )}
          </div>

          {/* Irrigation System */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FiDroplet className="w-5 h-5 mr-2" />
              Irrigation System
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Irrigation Type
                </label>
                <select
                  value={formData.irrigation.type}
                  onChange={(e) => handleInputChange('irrigation', 'type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="manual">Manual</option>
                  <option value="drip">Drip Irrigation</option>
                  <option value="sprinkler">Sprinkler</option>
                  <option value="flood">Flood Irrigation</option>
                  <option value="canal">Canal Irrigation</option>
                  <option value="none">None</option>
                </select>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="automation"
                  checked={formData.irrigation.automation}
                  onChange={(e) => handleInputChange('irrigation', 'automation', e.target.checked)}
                  className="w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="automation" className="ml-2 block text-sm text-gray-900">
                  Automated Irrigation
                </label>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Frequency
                </label>
                <input
                  type="text"
                  value={formData.irrigation.schedule.frequency}
                  onChange={(e) => handleNestedInputChange('irrigation', 'schedule', 'frequency', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Daily, Weekly, etc."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.irrigation.schedule.duration || ''}
                  onChange={(e) => handleNestedInputChange('irrigation', 'schedule', 'duration', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="30"
                />
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Time Slots
                </label>
                <button
                  type="button"
                  onClick={addTimeSlot}
                  className="flex items-center px-2 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                >
                  <FiPlus className="w-3 h-3 mr-1" />
                  Add Time
                </button>
              </div>
              
              {formData.irrigation.schedule.timeSlots.map((slot, index) => (
                <div key={index} className="flex items-center space-x-2 mb-2">
                  <input
                    type="time"
                    value={slot}
                    onChange={(e) => updateTimeSlot(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <button
                    type="button"
                    onClick={() => removeTimeSlot(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <FiSave className="w-4 h-4 mr-2" />
                  Create Field
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddField; 