import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import { api } from '../services/authService';

const AddFarmer = () => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phoneNumber: '',
    preferredLanguage: 'english',
    role: 'farmer',
    managedBy: '',
  });
  const [coordinators, setCoordinators] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Get current user from localStorage
  const currentUser = JSON.parse(localStorage.getItem('user')) || {};

  useEffect(() => {
    // Fetch coordinators if current user is admin or superadmin
    if (currentUser.role === 'admin' || currentUser.role === 'superadmin') {
      api.get('/coordinators')
        .then(res => setCoordinators(res.data.users || []))
        .catch(() => setCoordinators([]));
    }
  }, [currentUser.role]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const payload = { ...form };
      
      // If current user is coordinator, set managedBy to current user's ID
      if (currentUser.role === 'coordinator') {
        payload.managedBy = currentUser._id;
      }
      // If current user is admin or superadmin, managedBy should be selected from dropdown
      else if ((currentUser.role === 'admin' || currentUser.role === 'superadmin') && !form.managedBy) {
        setError('Please select a coordinator for the farmer.');
        setLoading(false);
        return;
      }
      
      await authService.register(payload);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to register farmer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-80">
        <h2 className="text-2xl font-bold mb-6 text-center">Add New Farmer</h2>
        {error && <div className="mb-4 text-red-500">{error}</div>}
        
        <div className="mb-4">
          <label className="block mb-1">Name</label>
          <input
            type="text"
            name="name"
            className="w-full border px-3 py-2 rounded"
            value={form.name}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block mb-1">Email</label>
          <input
            type="email"
            name="email"
            className="w-full border px-3 py-2 rounded"
            value={form.email}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block mb-1">Phone Number</label>
          <input
            type="text"
            name="phoneNumber"
            className="w-full border px-3 py-2 rounded"
            value={form.phoneNumber}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block mb-1">Password</label>
          <input
            type="password"
            name="password"
            className="w-full border px-3 py-2 rounded"
            value={form.password}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block mb-1">Preferred Language</label>
          <select
            name="preferredLanguage"
            className="w-full border px-3 py-2 rounded"
            value={form.preferredLanguage}
            onChange={handleChange}
          >
            <option value="english">English</option>
            <option value="marathi">Marathi</option>
          </select>
        </div>
        
        {/* Coordinator dropdown for admin/superadmin registering a farmer */}
        {(currentUser.role === 'admin' || currentUser.role === 'superadmin') && (
          <div className="mb-4">
            <label className="block mb-1">Coordinator</label>
            <select
              name="managedBy"
              className="w-full border px-3 py-2 rounded"
              value={form.managedBy}
              onChange={handleChange}
              required
            >
              <option value="">Select Coordinator</option>
              {coordinators.map(coord => (
                <option key={coord._id} value={coord._id}>
                  {coord.name} ({coord.email})
                </option>
              ))}
            </select>
          </div>
        )}
        
        <button
          type="submit"
          className="w-full bg-orange-600 text-white py-2 rounded hover:bg-orange-700 transition"
          disabled={loading}
        >
          {loading ? 'Adding Farmer...' : 'Add Farmer'}
        </button>
        
        <div className="mt-4 text-center">
          <button 
            type="button" 
            className="text-blue-600 underline" 
            onClick={() => navigate('/')}
          >
            Back to Dashboard
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddFarmer; 