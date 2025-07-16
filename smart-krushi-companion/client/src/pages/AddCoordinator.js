import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';

const AddCoordinator = () => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phoneNumber: '',
    preferredLanguage: 'english',
    role: 'coordinator',
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      await authService.register(form);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to register coordinator');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-80">
        <h2 className="text-2xl font-bold mb-6 text-center">Add New Coordinator</h2>
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
        
        <button
          type="submit"
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition"
          disabled={loading}
        >
          {loading ? 'Adding Coordinator...' : 'Add Coordinator'}
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

export default AddCoordinator; 