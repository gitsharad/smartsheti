import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import { FiFeather } from 'react-icons/fi';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await authService.login(email, password);
      navigate('/'); // Redirect to dashboard or home
    } catch (err) {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F9FAF6] to-[#F5E9DA] relative font-sans">
      {/* Decorative SVGs */}
      <svg className="absolute left-0 top-0 w-40 h-40 opacity-30 z-0" viewBox="0 0 100 100" fill="none">
        <ellipse cx="50" cy="50" rx="50" ry="30" fill="#43A047" />
        <ellipse cx="70" cy="30" rx="20" ry="10" fill="#FFD600" />
      </svg>
      <svg className="absolute right-0 bottom-0 w-40 h-40 opacity-20 z-0" viewBox="0 0 100 100" fill="none">
        <ellipse cx="50" cy="50" rx="50" ry="30" fill="#FF9800" />
        <ellipse cx="30" cy="70" rx="20" ry="10" fill="#43A047" />
      </svg>
      <form onSubmit={handleSubmit} className="relative z-10 bg-white p-10 rounded-2xl shadow-xl w-full max-w-md flex flex-col items-center border-2 border-green-200">
        <div className="bg-green-100 rounded-full p-3 mb-4">
          <FiFeather className="text-green-700 text-3xl" />
        </div>
        <h2 className="text-2xl font-bold mb-6 text-center text-green-900 font-[Mukta]">स्मार्टशेती लॉगिन</h2>
        {error && <div className="mb-4 text-red-500">{error}</div>}
        <div className="mb-4 w-full">
          <label className="block mb-1 text-gray-700">Email</label>
          <input
            type="email"
            className="w-full border px-3 py-2 rounded"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="mb-6 w-full">
          <label className="block mb-1 text-gray-700">Password</label>
          <input
            type="password"
            className="w-full border px-3 py-2 rounded"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition mb-2"
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
        <div className="mt-2 text-center w-full">
          <button type="button" className="text-green-700 underline" onClick={() => navigate('/forgot-password')}>Forgot Password?</button>
        </div>
        
      </form>
    </div>
  );
};

export default Login; 