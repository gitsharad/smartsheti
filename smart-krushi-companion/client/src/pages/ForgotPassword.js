import React, { useState } from 'react';
import apiRoutes from '../services/apiRoutes';
import { useNavigate } from 'react-router-dom';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');
    try {
      await apiRoutes.forgotPassword(email);
      setMessage('If this email is registered, a password reset link has been sent.');
    } catch (err) {
      setError('Failed to send reset link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F9FAF6] to-[#F5E9DA] flex items-center justify-center font-sans">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-10 w-full max-w-md flex flex-col items-center border-2 border-green-200">
        <h2 className="text-2xl font-bold text-green-900 mb-6 font-[Mukta]">पासवर्ड विसरलात?</h2>
        <p className="mb-6 text-gray-700 text-center">तुमचा ईमेल पत्ता टाका. आम्ही तुम्हाला पासवर्ड रिसेट करण्यासाठी लिंक पाठवू.</p>
        <input
          type="email"
          className="w-full border px-3 py-2 rounded mb-4"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <button
          type="submit"
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition mb-4"
          disabled={loading}
        >
          {loading ? 'Sending...' : 'Send Reset Link'}
        </button>
        {message && <div className="text-green-700 mb-2">{message}</div>}
        {error && <div className="text-red-500 mb-2">{error}</div>}
        <div className="mt-4 text-center w-full">
          <button type="button" className="text-blue-600 underline" onClick={() => navigate('/login')}>Back to Login</button>
        </div>
      </form>
    </div>
  );
};

export default ForgotPassword; 