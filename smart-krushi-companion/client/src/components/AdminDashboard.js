import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiUsers, FiUserPlus, FiMap, FiAlertTriangle, FiBarChart2, FiPlus, FiLogOut, FiActivity } from 'react-icons/fi';
import authService from '../services/authService';
import CoordinatorList from './CoordinatorList';
import FarmerList from './FarmerList';
import FieldMap from './FieldMap';
import FieldList from './FieldList';
import AlertList from './AlertList';
import AnalyticsPanel from './AnalyticsPanel';
import { api } from '../services/authService';

const AdminDashboard = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [stats, setStats] = useState({
    totalCoordinators: 0,
    totalFarmers: 0,
    activeFields: 0,
    recentAlerts: 0
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Get current user from localStorage
    const user = JSON.parse(localStorage.getItem('user')) || {};
    setCurrentUser(user);
    // Fetch real stats from API
    setLoadingStats(true);
    api.get('/admin/overview')
      .then(res => {
        setStats(res.data);
      })
      .catch(() => {
        setStats({ totalCoordinators: 0, totalFarmers: 0, activeFields: 0, recentAlerts: 0 });
      })
      .finally(() => setLoadingStats(false));
  }, []);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F9FAF6] to-[#F5E9DA] p-0 md:p-6 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex flex-col md:flex-row items-center justify-between py-6 px-4 md:px-0 mb-6 bg-white rounded-b-3xl shadow-md">
          <div className="flex items-center space-x-4">
            <img src="/logo-smartsheti.svg" alt="SmartSheti Logo" className="w-14 h-14" />
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-green-800 tracking-tight font-[Baloo Bhaina 2]">स्मार्टशेती</h1>
              <p className="text-green-700 text-sm md:text-base font-semibold">Admin Dashboard</p>
            </div>
          </div>
          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            <Link to="/profile" className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
              <FiUsers className="mr-2" />
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

        {/* Overview Stats */}
        {loadingStats ? (
          <div className="text-center text-green-800 mb-8">Loading stats...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 px-4 md:px-0">
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
              <div className="flex items-center">
                <FiUsers className="text-blue-500 text-3xl mr-4" />
                <div>
                  <p className="text-gray-500 text-sm">Coordinators</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalCoordinators}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
              <div className="flex items-center">
                <FiUserPlus className="text-green-500 text-3xl mr-4" />
                <div>
                  <p className="text-gray-500 text-sm">Farmers</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalFarmers}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
              <div className="flex items-center">
                <FiMap className="text-purple-500 text-3xl mr-4" />
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
                  <p className="text-gray-500 text-sm">Recent Alerts</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.recentAlerts}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mb-8 px-4 md:px-0">
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h3 className="text-xl font-semibold text-green-900 mb-6 flex items-center">
              <FiActivity className="mr-2" />
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link to="/add-coordinator" className="flex flex-col items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition">
                <FiPlus className="text-blue-600 text-2xl mb-2" />
                <span className="text-sm font-medium text-blue-900">Add Coordinator</span>
              </Link>
              <Link to="/add-farmer" className="flex flex-col items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition">
                <FiPlus className="text-green-600 text-2xl mb-2" />
                <span className="text-sm font-medium text-green-900">Add Farmer</span>
              </Link>
              <Link to="/analytics" className="flex flex-col items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition">
                <FiBarChart2 className="text-purple-600 text-2xl mb-2" />
                <span className="text-sm font-medium text-purple-900">Analytics</span>
              </Link>
              <Link to="/alerts" className="flex flex-col items-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition">
                <FiAlertTriangle className="text-orange-600 text-2xl mb-2" />
                <span className="text-sm font-medium text-orange-900">Alerts</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-8 px-4 md:px-0">
          {/* Coordinator Management */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
            <h3 className="text-xl font-semibold text-green-900 mb-4 flex items-center">
              <FiUsers className="mr-2" />
              Coordinators
            </h3>
            <CoordinatorList />
          </div>
          {/* Farmer Management */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
            <h3 className="text-xl font-semibold text-green-900 mb-4 flex items-center">
              <FiUserPlus className="mr-2" />
              Farmers
            </h3>
            <FarmerList />
          </div>
        </div>
        <div className="grid lg:grid-cols-2 gap-8 px-4 md:px-0">
          {/* Field Monitoring */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
            <h3 className="text-xl font-semibold text-green-900 mb-4 flex items-center">
              <FiMap className="mr-2" />
              Field Monitoring
            </h3>
            <div className="space-y-4">
              <FieldMap />
              <FieldList />
            </div>
          </div>
          {/* Alerts & Analytics */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
            <h3 className="text-xl font-semibold text-green-900 mb-4 flex items-center">
              <FiAlertTriangle className="mr-2" />
              Alerts & Analytics
            </h3>
            <div className="space-y-4">
              <AlertList />
              <AnalyticsPanel />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 