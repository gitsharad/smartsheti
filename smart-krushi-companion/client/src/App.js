import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import DiseaseDetector from './pages/DiseaseDetector';
import FDSS from './pages/FDSS';
import LandReport from './pages/LandReport';
import Dashboard from './components/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import ForgotPassword from './pages/ForgotPassword';
import AddAdmin from './pages/AddAdmin';
import AddCoordinator from './pages/AddCoordinator';
import AddFarmer from './pages/AddFarmer';
import CoordinatorDashboard from './components/CoordinatorDashboard';
import FarmerManagement from './pages/FarmerManagement';
import FieldMonitoring from './pages/FieldMonitoring';
import AlertsPage from './pages/AlertsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import AdminDashboard from './components/AdminDashboard';
import './index.css';

// Role-based dashboard component
const RoleBasedDashboard = () => {
  const user = JSON.parse(localStorage.getItem('user')) || {};
  const accessToken = localStorage.getItem('accessToken');
  
  // If no user is logged in, redirect to login
  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  // Route based on user role
  switch (user.role) {
    case 'coordinator':
      return <CoordinatorDashboard />;
    case 'admin':
      return <AdminDashboard />;
    case 'superadmin':
    case 'farmer':
    default:
      return <Dashboard />;
  }
};

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/" element={<RoleBasedDashboard />} />
          <Route path="/disease-detector" element={<DiseaseDetector />} />
          <Route path="/fdss" element={<FDSS />} />
          <Route path="/land-report" element={<LandReport />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/add-admin" element={<AddAdmin />} />
          <Route path="/add-coordinator" element={<AddCoordinator />} />
          <Route path="/add-farmer" element={<AddFarmer />} />
          <Route path="/coordinator-dashboard" element={<CoordinatorDashboard />} />
          <Route path="/farmers" element={<FarmerManagement />} />
          <Route path="/fields" element={<FieldMonitoring />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App; 