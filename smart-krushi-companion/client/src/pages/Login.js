import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import { FiFeather } from 'react-icons/fi';

const isMobile = () => /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
  (navigator.userAgent || '').toLowerCase()
);

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [otpMode, setOtpMode] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const navigate = useNavigate();

  // Email/password login (web and mobile)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await authService.login(email, password);
      navigate('/');
    } catch (err) {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  // Mobile OTP: request OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('मोबाईल OTP लॉगिन पुढील आवृत्तीत उपलब्ध होईल. सध्या कृपया ईमेल लॉगिन वापरा.');
  };

  // Mobile OTP: verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('मोबाईल OTP लॉगिन पुढील आवृत्तीत उपलब्ध होईल. सध्या कृपया ईमेल लॉगिन वापरा.');
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
      <form onSubmit={otpMode ? (otpSent ? handleVerifyOtp : handleSendOtp) : handleSubmit} className="relative z-10 bg-white p-10 rounded-2xl shadow-xl w-full max-w-md flex flex-col items-center border-2 border-green-200">
        <div className="bg-green-100 rounded-full p-3 mb-4">
          <FiFeather className="text-green-700 text-3xl" />
        </div>
        <h2 className="text-2xl font-bold mb-6 text-center text-green-900 font-[Mukta]">स्मार्टशेती लॉगिन</h2>
        {error && <div className="mb-4 text-red-500">{error}</div>}
        {/* Tabs for mobile: Email/Password or OTP */}
        {isMobile() && (
          <div className="flex mb-6 w-full">
            <button type="button" className={`flex-1 py-2 rounded-l ${!otpMode ? 'bg-green-600 text-white' : 'bg-gray-200 text-green-700'}`} onClick={() => setOtpMode(false)}>Email Login</button>
            <button type="button" className={`flex-1 py-2 rounded-r ${otpMode ? 'bg-green-600 text-white' : 'bg-gray-200 text-green-700'}`} onClick={() => setOtpMode(true)}>OTP Login</button>
          </div>
        )}
        {/* Email/password login (always for web, optional for mobile) */}
        {!otpMode && (
          <>
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
          </>
        )}
        {/* OTP login (mobile only) */}
        {otpMode && isMobile() && (
          <>
            <div className="mb-6 p-6 bg-green-50 border border-green-200 rounded-lg text-center">
              <div className="text-4xl mb-4">📱</div>
              <h3 className="text-xl font-bold text-green-800 mb-2">मोबाईल OTP लॉगिन</h3>
              <p className="text-green-600 font-semibold mb-3">लवकरच येणार आहे!</p>
              <p className="text-gray-600 mb-4">
                आम्ही तुम्हाला सुरक्षित मोबाईल OTP लॉगिन आणत आहोत. हे वैशिष्ट्य पुढील आवृत्तीत उपलब्ध होईल.
              </p>
              <div className="grid grid-cols-1 gap-3 mb-4 text-sm text-gray-600">
                <div className="flex items-center justify-center">
                  <span className="mr-2">🛡️</span>
                  <span>सुरक्षित SMS-आधारित प्रमाणीकरण</span>
                </div>
                <div className="flex items-center justify-center">
                  <span className="mr-2">⚡</span>
                  <span>त्वरित एक-टॅप लॉगिन</span>
                </div>
                <div className="flex items-center justify-center">
                  <span className="mr-2">🔒</span>
                  <span>वाढीव सुरक्षा</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOtpMode(false)}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-semibold"
              >
                ईमेल लॉगिन वापरा
              </button>
            </div>
          </>
        )}
        <div className="mt-2 text-center w-full">
          <button type="button" className="text-green-700 underline" onClick={() => navigate('/forgot-password')}>Forgot Password?</button>
        </div>
      </form>
    </div>
  );
};

export default Login; 