import React, { useState } from 'react';
import { FiEye, FiEyeOff, FiX, FiLock, FiCheck, FiAlertCircle } from 'react-icons/fi';
import apiRoutes from '../services/apiRoutes';

const PasswordChangeModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.currentPassword.trim()) {
      newErrors.currentPassword = 'सध्याचा पासवर्ड आवश्यक आहे';
    }

    if (!formData.newPassword.trim()) {
      newErrors.newPassword = 'नवीन पासवर्ड आवश्यक आहे';
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'पासवर्ड किमान 8 अक्षरे असले पाहिजे';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.newPassword)) {
      newErrors.newPassword = 'पासवर्ड मध्ये मोठे अक्षर, लहान अक्षर आणि संख्या असली पाहिजे';
    }

    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'पासवर्डची पुष्टी आवश्यक आहे';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'पासवर्ड जुळत नाहीत';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setLoading(true);
      await apiRoutes.changePassword(formData.currentPassword, formData.newPassword);
      
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 2000);
    } catch (error) {
      const errorMessage = error.response?.data?.message?.marathi || 
                          error.response?.data?.error || 
                          'पासवर्ड बदलण्यात त्रुटी आली';
      setErrors({ submit: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setErrors({});
    setSuccess(false);
    setShowPasswords({
      current: false,
      new: false,
      confirm: false
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-green-900 flex items-center">
            <FiLock className="mr-2" />
            पासवर्ड बदला
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FiX className="text-xl" />
          </button>
        </div>

        {success ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiCheck className="text-green-600 text-2xl" />
            </div>
            <h3 className="text-lg font-semibold text-green-900 mb-2">
              पासवर्ड यशस्वीरित्या बदलला!
            </h3>
            <p className="text-gray-600">
              आपला पासवर्ड यशस्वीरित्या अपडेट झाला आहे.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Current Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                सध्याचा पासवर्ड *
              </label>
              <div className="relative">
                <input
                  type={showPasswords.current ? 'text' : 'password'}
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                    errors.currentPassword ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="सध्याचा पासवर्ड प्रविष्ट करा"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('current')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.current ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              {errors.currentPassword && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <FiAlertCircle className="mr-1" />
                  {errors.currentPassword}
                </p>
              )}
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                नवीन पासवर्ड *
              </label>
              <div className="relative">
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                    errors.newPassword ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="नवीन पासवर्ड प्रविष्ट करा"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('new')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.new ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              {errors.newPassword && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <FiAlertCircle className="mr-1" />
                  {errors.newPassword}
                </p>
              )}
              <div className="mt-2 text-xs text-gray-500">
                <p>पासवर्ड मध्ये खालील गोष्टी असल्या पाहिजेत:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li className={formData.newPassword.length >= 8 ? 'text-green-600' : ''}>
                    किमान 8 अक्षरे
                  </li>
                  <li className={/(?=.*[a-z])/.test(formData.newPassword) ? 'text-green-600' : ''}>
                    एक लहान अक्षर
                  </li>
                  <li className={/(?=.*[A-Z])/.test(formData.newPassword) ? 'text-green-600' : ''}>
                    एक मोठे अक्षर
                  </li>
                  <li className={/(?=.*\d)/.test(formData.newPassword) ? 'text-green-600' : ''}>
                    एक संख्या
                  </li>
                </ul>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                पासवर्डची पुष्टी *
              </label>
              <div className="relative">
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                    errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="पासवर्ड पुन्हा प्रविष्ट करा"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('confirm')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.confirm ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <FiAlertCircle className="mr-1" />
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm flex items-center">
                  <FiAlertCircle className="mr-2" />
                  {errors.submit}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                रद्द करा
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'बदलत आहे...' : 'पासवर्ड बदला'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default PasswordChangeModal; 