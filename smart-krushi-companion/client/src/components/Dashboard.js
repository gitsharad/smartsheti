import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiThermometer, FiDroplet, FiFeather, FiMap, FiBarChart, FiCamera, FiUser, FiPlus } from 'react-icons/fi';
import SensorChart from './SensorChart';
import AlertCard from './AlertCard';
import ChatbotBox from './ChatbotBox';
import apiRoutes from '../services/apiRoutes';
import authService from '../services/authService';

const Dashboard = () => {
  const [currentData, setCurrentData] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [noDataMsg, setNoDataMsg] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [fields, setFields] = useState([]);
  const [selectedFieldId, setSelectedFieldId] = useState('');
  const [fieldsLoading, setFieldsLoading] = useState(true);
  const threshold = 25;
  const navigate = useNavigate();

  useEffect(() => {
    // Get current user from localStorage
    const user = JSON.parse(localStorage.getItem('user')) || {};
    setCurrentUser(user);

    // Fetch farmer's fields
    const fetchFields = async () => {
      setFieldsLoading(true);
      try {
        const response = await apiRoutes.getSensorData();
        const userFields = response.data.fields || [];
        setFields(userFields);
        
        if (userFields.length > 0) {
          setSelectedFieldId(userFields[0].fieldId);
        }
      } catch (error) {
        console.error('Error fetching fields:', error);
      } finally {
        setFieldsLoading(false);
      }
    };

    fetchFields();
  }, []);

  useEffect(() => {
    if (!selectedFieldId) return;

    // Fetch latest sensor data
    apiRoutes.getLatestSensorData(selectedFieldId)
      .then(response => setCurrentData(response.data))
      .catch(error => console.error('Error fetching latest data:', error));
      
    // Fetch last 24h data
    apiRoutes.getSensorData24h(selectedFieldId)
      .then(response => {
        setChartData(response.data.data);
        if (response.data.data.length === 0) {
          setNoDataMsg(response.data.message.english);
        } else {
          setNoDataMsg('');
        }
      })
      .catch(error => console.error('Error fetching 24h data:', error));
  }, [selectedFieldId]);

  // Role-based user management links
  const getUserManagementLinks = () => {
    if (!currentUser || !currentUser.role) return null;

    const links = [];

    // Superadmin can add admins, coordinators, and farmers
    if (currentUser.role === 'superadmin') {
      links.push(
        { to: '/add-admin', label: 'Add Admin', color: 'bg-blue-600 hover:bg-blue-700' },
        { to: '/add-coordinator', label: 'Add Coordinator', color: 'bg-green-600 hover:bg-green-700' },
        { to: '/add-farmer', label: 'Add Farmer', color: 'bg-orange-600 hover:bg-orange-700' }
      );
    }
    // Admin can add coordinators and farmers
    else if (currentUser.role === 'admin') {
      links.push(
        { to: '/add-coordinator', label: 'Add Coordinator', color: 'bg-green-600 hover:bg-green-700' },
        { to: '/add-farmer', label: 'Add Farmer', color: 'bg-orange-600 hover:bg-orange-700' }
      );
    }
    // Coordinator can add farmers
    else if (currentUser.role === 'coordinator') {
      links.push(
        { to: '/add-farmer', label: 'Add Farmer', color: 'bg-orange-600 hover:bg-orange-700' }
      );
    }

    return links;
  };

  const moduleCards = [
    {
      title: 'रोग ओळख',
      description: 'पानांचे फोटो अपलोड करून रोगांची ओळख करा',
      icon: <FiCamera className="text-4xl text-green-700" />,
      path: '/disease-detector',
      color: 'from-green-100 to-green-50',
      borderColor: 'border-green-300'
    },
    {
      title: 'शेत निर्णय',
      description: 'सेंसर डेटा आणि हवामानावर आधारित सूचना',
      icon: <FiBarChart className="text-4xl text-yellow-600" />,
      path: '/fdss',
      color: 'from-yellow-100 to-yellow-50',
      borderColor: 'border-yellow-300'
    },
    {
      title: 'जमीन आरोग्य',
      description: 'मातीची माहिती आणि पीक योजना',
      icon: <FiFeather className="text-4xl text-orange-600" />,
      path: '/land-report',
      color: 'from-orange-100 to-orange-50',
      borderColor: 'border-orange-300'
    }
  ];

  const userManagementLinks = getUserManagementLinks();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F9FAF6] to-[#F5E9DA] p-0 md:p-6 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex flex-col md:flex-row items-center justify-between py-6 px-4 md:px-0 mb-6 bg-white rounded-b-3xl shadow-md">
          <div className="flex items-center space-x-4">
            <img src="/logo-smartsheti.svg" alt="SmartSheti Logo" className="w-14 h-14" />
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-green-800 tracking-tight font-[Baloo Bhaina 2]">स्मार्टशेती</h1>
              <p className="text-green-700 text-sm md:text-base font-semibold">नवीन युगातील शेतकरी साथी</p>
            </div>
          </div>
          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            {/* User Management Links */}
            {userManagementLinks && userManagementLinks.map((link, index) => (
              <Link
                key={index}
                to={link.to}
                className={`flex items-center px-3 py-2 text-white rounded-lg transition ${link.color}`}
              >
                <FiPlus className="mr-1" />
                {link.label}
              </Link>
            ))}
            <Link to="/profile" className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
              <FiUser className="mr-2" />
              माझे प्रोफाइल
            </Link>
            <button
              className="px-4 py-2 bg-yellow-400 text-green-900 rounded-lg font-bold shadow hover:bg-yellow-500 transition"
              onClick={() => { authService.logout(); navigate('/login'); }}
            >
              लॉगआउट
            </button>
          </div>
        </header>

        {/* Welcome Message & Quick Stats */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-8 px-4 md:px-0">
          <div className="mb-4 md:mb-0">
            <h2 className="text-2xl font-bold text-green-900 font-[Baloo Bhaina 2]">नमस्कार, शेतकरी मित्र!</h2>
            <p className="text-gray-700 mt-1">आपल्या शेतासाठी स्मार्टशेती डॅशबोर्डमध्ये स्वागत आहे.</p>
          </div>
          <div className="flex space-x-4">
            <div className="flex flex-col items-center bg-green-50 border-2 border-green-200 rounded-xl px-6 py-3 shadow">
              <FiDroplet className="text-green-600 text-2xl mb-1" />
              <span className="text-xs text-gray-500">मातीची आर्द्रता</span>
              <span className="text-xl font-bold text-green-900">{currentData ? currentData.moisture : '--'}%</span>
            </div>
            <div className="flex flex-col items-center bg-yellow-50 border-2 border-yellow-200 rounded-xl px-6 py-3 shadow">
              <FiThermometer className="text-yellow-600 text-2xl mb-1" />
              <span className="text-xs text-gray-500">तापमान</span>
              <span className="text-xl font-bold text-yellow-900">{currentData ? currentData.temperature : '--'}°C</span>
            </div>
          </div>
        </div>

        {/* Module Navigation */}
        <div className="grid md:grid-cols-3 gap-6 mb-8 px-4 md:px-0">
          {moduleCards.map((card, index) => (
            <Link
              key={index}
              to={card.path}
              className={`bg-white rounded-2xl shadow-xl p-6 border-2 ${card.borderColor} hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1`}
            >
              <div className={`bg-gradient-to-br ${card.color} rounded-xl p-4 mb-4 flex justify-center`}>
                {card.icon}
              </div>
              <h3 className="text-xl font-semibold text-green-900 mb-2 font-[Baloo Bhaina 2]">{card.title}</h3>
              <p className="text-gray-700">{card.description}</p>
            </Link>
          ))}
        </div>

        {/* Charts and Alerts */}
        <div className="grid lg:grid-cols-2 gap-8 px-4 md:px-0">
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-xl font-semibold text-green-900 mb-4 flex items-center font-[Baloo Bhaina 2]">
              <FiMap className="mr-2" />
              २४ तासांचा डेटा
            </h2>
            {noDataMsg ? (
              <p className="text-center text-gray-500">{noDataMsg}</p>
            ) : (
              <SensorChart data={chartData} />
            )}
          </div>
          <div className="space-y-6">
            <AlertCard moisture={currentData ? currentData.moisture : 100} threshold={threshold} />
            <ChatbotBox latestData={currentData} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 