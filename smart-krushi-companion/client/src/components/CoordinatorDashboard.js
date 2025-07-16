import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FiUsers, 
  FiMap, 
  FiAlertTriangle, 
  FiBarChart2, 
  FiPlus, 
  FiMessageSquare, 
  FiFileText,
  FiUser,
  FiLogOut,
  FiTrendingUp,
  FiDroplet,
  FiThermometer,
  FiActivity
} from 'react-icons/fi';
import authService from '../services/authService';
import FieldMap from './FieldMap';
import FieldList from './FieldList';
import FarmerList from './FarmerList';
import AlertList from './AlertList';

const CoordinatorDashboard = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalFarmers: 0,
    activeFields: 0,
    alertsThisWeek: 0,
    averageYield: 0
  });
  const [managedFarmers, setManagedFarmers] = useState([]);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Get current user from localStorage
    const user = JSON.parse(localStorage.getItem('user')) || {};
    setCurrentUser(user);
    
    // Load coordinator data
    loadCoordinatorData();
  }, []);

  const loadCoordinatorData = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API calls
      // For now, using mock data
      setStats({
        totalFarmers: 15,
        activeFields: 23,
        alertsThisWeek: 8,
        averageYield: 85
      });
      
      setManagedFarmers([
        { id: 1, name: 'Rajesh Patil', phone: '+91-98765-43210', fields: 3, status: 'Active' },
        { id: 2, name: 'Sunita Devi', phone: '+91-98766-54321', fields: 2, status: 'Active' },
        { id: 3, name: 'Amit Kumar', phone: '+91-98767-65432', fields: 4, status: 'Alert' }
      ]);
      
      setRecentAlerts([
        { id: 1, type: 'moisture', message: 'Low moisture detected in Plot B2', farmer: 'Amit Kumar', severity: 'high' },
        { id: 2, type: 'pest', message: 'Pest alert in Plot A1', farmer: 'Rajesh Patil', severity: 'medium' },
        { id: 3, type: 'irrigation', message: 'Irrigation needed in 3 fields', farmer: 'Multiple', severity: 'low' }
      ]);
    } catch (error) {
      console.error('Error loading coordinator data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F9FAF6] to-[#F5E9DA] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-green-800">Loading Coordinator Dashboard...</p>
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
            <img src="/logo-smartsheti.svg" alt="SmartSheti Logo" className="w-14 h-14" />
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-green-800 tracking-tight font-[Baloo Bhaina 2]">स्मार्टशेती</h1>
              <p className="text-green-700 text-sm md:text-base font-semibold">Coordinator Dashboard</p>
            </div>
          </div>
          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            <Link to="/add-farmer" className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition">
              <FiPlus className="mr-2" />
              Add Farmer
            </Link>
            <Link to="/profile" className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
              <FiUser className="mr-2" />
              Profile
            </Link>
            <button
              className="px-4 py-2 bg-yellow-400 text-green-900 rounded-lg font-bold shadow hover:bg-yellow-500 transition"
              onClick={handleLogout}
            >
              <FiLogOut className="inline mr-2" />
              Logout
            </button>
          </div>
        </header>

        {/* Welcome Message */}
        <div className="mb-8 px-4 md:px-0">
          <h2 className="text-2xl font-bold text-green-900 font-[Baloo Bhaina 2]">
            Welcome back, {currentUser?.name || 'Coordinator'}!
          </h2>
          <p className="text-gray-700 mt-1">Manage your farmers and monitor their fields</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 px-4 md:px-0">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center">
              <FiUsers className="text-blue-500 text-3xl mr-4" />
              <div>
                <p className="text-gray-500 text-sm">Total Farmers</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalFarmers}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center">
              <FiMap className="text-green-500 text-3xl mr-4" />
              <div>
                <p className="text-gray-500 text-sm">Active Fields</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeFields}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
            <div className="flex items-center">
              <FiAlertTriangle className="text-orange-500 text-3xl mr-4" />
              <div>
                <p className="text-gray-500 text-sm">Alerts This Week</p>
                <p className="text-2xl font-bold text-gray-900">{stats.alertsThisWeek}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
            <div className="flex items-center">
              <FiTrendingUp className="text-purple-500 text-3xl mr-4" />
              <div>
                <p className="text-gray-500 text-sm">Avg Yield</p>
                <p className="text-2xl font-bold text-gray-900">{stats.averageYield}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-8 px-4 md:px-0">
          {/* Managed Farmers */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-green-900 flex items-center">
                <FiUsers className="mr-2" />
                My Farmers
              </h3>
              <Link to="/farmers" className="text-green-600 hover:text-green-700 text-sm font-medium">
                View All
              </Link>
            </div>
            <FarmerList role="coordinator" />
          </div>
          {/* Recent Alerts */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-green-900 flex items-center">
                <FiAlertTriangle className="mr-2" />
                Recent Alerts
              </h3>
              <Link to="/alerts" className="text-green-600 hover:text-green-700 text-sm font-medium">
                View All
              </Link>
            </div>
            <AlertList role="coordinator" />
          </div>
        </div>
        {/* Field Map and List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8 px-4 md:px-0">
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h3 className="text-xl font-semibold text-green-900 flex items-center mb-4">
              <FiMap className="mr-2" />
              Field Map
            </h3>
            <FieldMap role="coordinator" />
          </div>
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h3 className="text-xl font-semibold text-green-900 flex items-center mb-4">
              <FiActivity className="mr-2" />
              Field List
            </h3>
            <FieldList role="coordinator" />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 px-4 md:px-0">
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h3 className="text-xl font-semibold text-green-900 mb-6 flex items-center">
              <FiActivity className="mr-2" />
              Quick Actions
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link to="/add-farmer" className="flex flex-col items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition">
                <FiPlus className="text-green-600 text-2xl mb-2" />
                <span className="text-sm font-medium text-green-900">Add Farmer</span>
              </Link>
              
              <Link to="/analytics" className="flex flex-col items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition">
                <FiBarChart2 className="text-blue-600 text-2xl mb-2" />
                <span className="text-sm font-medium text-blue-900">Analytics</span>
              </Link>
              
              <Link to="/alerts" className="flex flex-col items-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition">
                <FiAlertTriangle className="text-orange-600 text-2xl mb-2" />
                <span className="text-sm font-medium text-orange-900">Alerts</span>
              </Link>
              
              <Link to="/fields" className="flex flex-col items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition">
                <FiMap className="text-purple-600 text-2xl mb-2" />
                <span className="text-sm font-medium text-purple-900">Field Monitoring</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoordinatorDashboard; 