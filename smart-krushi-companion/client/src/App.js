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
import AddField from './pages/AddField';
import AdvancedAnalytics from './pages/AdvancedAnalytics';
import AIRecommendations from './pages/AIRecommendations';
import GPSFieldMapping from './pages/GPSFieldMapping';
import CoordinatorDashboard from './components/CoordinatorDashboard';
import FarmerManagement from './pages/FarmerManagement';
import FieldMonitoring from './pages/FieldMonitoring';
import AlertsPage from './pages/AlertsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import AdminDashboard from './components/AdminDashboard';
import TrustDashboard from './components/TrustDashboard';
import './index.css';

// Protected route component for admin/coordinator only
const ProtectedAdminRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem('user')) || {};
  const accessToken = localStorage.getItem('accessToken');
  
  // If no user is logged in, redirect to login
  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  // If user is not admin or coordinator, redirect to dashboard
  if (user.role !== 'admin' && user.role !== 'coordinator') {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Protected route component for all authenticated users
const ProtectedRoute = ({ children }) => {
  const accessToken = localStorage.getItem('accessToken');
  
  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Role-based dashboard component
const RoleBasedDashboard = () => {
  const user = JSON.parse(localStorage.getItem('user')) || {};
  
  if (user.role === 'admin') {
    return <AdminDashboard />;
  } else if (user.role === 'coordinator') {
    return <CoordinatorDashboard />;
  } else {
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
          <Route path="/add-admin" element={<ProtectedAdminRoute><AddAdmin /></ProtectedAdminRoute>} />
          <Route path="/add-coordinator" element={<ProtectedAdminRoute><AddCoordinator /></ProtectedAdminRoute>} />
          <Route path="/add-farmer" element={<ProtectedAdminRoute><AddFarmer /></ProtectedAdminRoute>} />
          <Route path="/add-field" element={<ProtectedAdminRoute><AddField /></ProtectedAdminRoute>} />
          <Route path="/coordinator-dashboard" element={<CoordinatorDashboard />} />
          <Route path="/farmers" element={<ProtectedAdminRoute><FarmerManagement /></ProtectedAdminRoute>} />
          <Route path="/fields" element={<FieldMonitoring />} />
          <Route path="/alerts" element={<ProtectedAdminRoute><AlertsPage /></ProtectedAdminRoute>} />
          <Route path="/analytics" element={<ProtectedAdminRoute><AnalyticsPage /></ProtectedAdminRoute>} />
          <Route path="/advanced-analytics" element={<ProtectedAdminRoute><AdvancedAnalytics /></ProtectedAdminRoute>} />
          <Route path="/ai-recommendations" element={<ProtectedAdminRoute><AIRecommendations /></ProtectedAdminRoute>} />
          <Route path="/gps-field-mapping" element={<ProtectedAdminRoute><GPSFieldMapping /></ProtectedAdminRoute>} />
          <Route path="/trust" element={<ProtectedRoute><TrustDashboard /></ProtectedRoute>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App; 