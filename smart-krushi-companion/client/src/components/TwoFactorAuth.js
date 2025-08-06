import React, { useState, useEffect } from 'react';
import { FiShield, FiX, FiCheck, FiAlertCircle, FiSmartphone, FiKey, FiDownload } from 'react-icons/fi';
import apiRoutes from '../services/apiRoutes';

const TwoFactorAuth = ({ isOpen, onClose }) => {
  const [step, setStep] = useState('overview'); // overview, setup, verify, backup
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [verificationCode, setVerificationCode] = useState('');
  const [isEnabled, setIsEnabled] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isOpen) {
      checkTwoFactorStatus();
    }
  }, [isOpen]);

  const checkTwoFactorStatus = async () => {
    try {
      const response = await apiRoutes.getTwoFactorStatus();
      setIsEnabled(response.data.isEnabled);
    } catch (error) {
      console.error('Error checking 2FA status:', error);
    }
  };

  const handleSetup = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await apiRoutes.setupTwoFactor();
      setQrCode(response.data.qrCode);
      setSecret(response.data.secret);
      setBackupCodes(response.data.backupCodes);
      setStep('setup');
    } catch (error) {
      setError('2FA सेटअप करताना त्रुटी आली');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!verificationCode.trim()) {
      setError('कृपया वेरिफिकेशन कोड प्रविष्ट करा');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await apiRoutes.verifyTwoFactor(verificationCode);
      setSuccess('दोन-फॅक्टर प्रमाणीकरण यशस्वीरित्या सक्षम केले!');
      setIsEnabled(true);
      setStep('overview');
    } catch (error) {
      setError('अवैध वेरिफिकेशन कोड');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    try {
      setLoading(true);
      setError('');
      await apiRoutes.disableTwoFactor();
      setSuccess('दोन-फॅक्टर प्रमाणीकरण यशस्वीरित्या अक्षम केले!');
      setIsEnabled(false);
    } catch (error) {
      setError('2FA अक्षम करताना त्रुटी आली');
    } finally {
      setLoading(false);
    }
  };

  const handleBackupCode = async (code) => {
    try {
      setLoading(true);
      setError('');
      await apiRoutes.verifyBackupCode(code);
      setSuccess('बॅकअप कोड वापरून लॉगिन यशस्वी!');
      setStep('overview');
    } catch (error) {
      setError('अवैध बॅकअप कोड');
    } finally {
      setLoading(false);
    }
  };

  const downloadBackupCodes = () => {
    const codesText = backupCodes.join('\n');
    const blob = new Blob([codesText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'backup-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FiShield className="text-green-600 text-2xl" />
        </div>
        <h3 className="text-xl font-semibold text-green-900 mb-2">
          दोन-फॅक्टर प्रमाणीकरण
        </h3>
        <p className="text-gray-600">
          {isEnabled 
            ? 'आपल्या खात्यासाठी दोन-फॅक्टर प्रमाणीकरण सक्षम आहे.'
            : 'आपल्या खात्यासाठी अतिरिक्त सुरक्षा जोडा.'
          }
        </p>
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 mb-2">सुरक्षा फायदे:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• आपल्या खात्यासाठी अतिरिक्त सुरक्षा स्तर</li>
          <li>• अनधिकृत प्रवेशापासून संरक्षण</li>
          <li>• स्मार्टफोनवर वेळ-आधारित कोड</li>
          <li>• बॅकअप कोड्स सुरक्षिततेसाठी</li>
        </ul>
      </div>

      <div className="flex space-x-3">
        {!isEnabled ? (
          <button
            onClick={handleSetup}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'सेटअप करत आहे...' : '2FA सेटअप करा'}
          </button>
        ) : (
          <button
            onClick={handleDisable}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'अक्षम करत आहे...' : '2FA अक्षम करा'}
          </button>
        )}
        <button
          onClick={onClose}
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          बंद करा
        </button>
      </div>
    </div>
  );

  const renderSetup = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-green-900 mb-2">
          2FA सेटअप
        </h3>
        <p className="text-gray-600">
          कृपया आपल्या स्मार्टफोनवर Google Authenticator किंवा Authy ॲप डाउनलोड करा
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="text-center mb-4">
          <h4 className="font-semibold text-gray-900 mb-2">QR कोड स्कॅन करा</h4>
          {qrCode && (
            <div className="flex justify-center">
              <img src={qrCode} alt="QR Code" className="border border-gray-200" />
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              मॅन्युअल सेटअप कोड
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={secret}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
              />
              <button
                onClick={() => navigator.clipboard.writeText(secret)}
                className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                कॉपी
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              वेरिफिकेशन कोड
            </label>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              placeholder="6 अंकांचा कोड प्रविष्ट करा"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              maxLength="6"
            />
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm flex items-center">
              <FiAlertCircle className="mr-2" />
              {error}
            </p>
          </div>
        )}

        <div className="flex space-x-3 pt-4">
          <button
            onClick={() => setStep('overview')}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            मागे जा
          </button>
          <button
            onClick={handleVerify}
            disabled={loading || !verificationCode.trim()}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'वेरिफाई करत आहे...' : 'वेरिफाई करा'}
          </button>
        </div>
      </div>
    </div>
  );

  const renderBackupCodes = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-green-900 mb-2">
          बॅकअप कोड्स
        </h3>
        <p className="text-gray-600">
          हे कोड्स सुरक्षित ठेवा. ते एकदाच वापरता येतात.
        </p>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start">
          <FiAlertCircle className="text-yellow-600 mt-0.5 mr-2" />
          <div className="text-sm text-yellow-800">
            <p className="font-semibold mb-1">सुरक्षा सल्ला:</p>
            <ul className="space-y-1">
              <li>• कोड्स सुरक्षित ठेवा</li>
              <li>• प्रत्येक कोड एकदाच वापरता येतो</li>
              <li>• आपल्या फोन गमल्यास हे कोड्स वापरा</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {backupCodes.map((code, index) => (
          <div
            key={index}
            className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-center font-mono text-sm"
          >
            {code}
          </div>
        ))}
      </div>

      <div className="flex space-x-3">
        <button
          onClick={downloadBackupCodes}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center"
        >
          <FiDownload className="mr-2" />
          डाउनलोड करा
        </button>
        <button
          onClick={() => setStep('overview')}
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          पूर्ण
        </button>
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-green-900 flex items-center">
            <FiShield className="mr-2" />
            दोन-फॅक्टर प्रमाणीकरण
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FiX className="text-xl" />
          </button>
        </div>

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700 flex items-center">
              <FiCheck className="mr-2" />
              {success}
            </p>
          </div>
        )}

        {step === 'overview' && renderOverview()}
        {step === 'setup' && renderSetup()}
        {step === 'backup' && renderBackupCodes()}
      </div>
    </div>
  );
};

export default TwoFactorAuth; 