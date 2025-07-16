import React, { useEffect, useState } from 'react';
import apiRoutes from '../services/apiRoutes';
import { FiUser, FiArrowLeft } from 'react-icons/fi';
import { Link } from 'react-router-dom';

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fields, setFields] = useState([]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await apiRoutes.getProfile();
        setProfile(response.data.user);
        setFields(response.data.fields || []);
        setError(null);
      } catch (err) {
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  if (error) return <div className="flex justify-center items-center min-h-screen text-red-500">{error}</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F9FAF6] to-[#F5E9DA] flex items-center justify-center font-sans">
      <div className="bg-white rounded-2xl shadow-xl p-10 w-full max-w-lg flex flex-col items-center border-2 border-green-200">
        <div className="w-full mb-4">
          <Link to="/" className="flex items-center text-green-700 hover:text-green-900 transition-colors">
            <FiArrowLeft className="mr-2" />
            डॅशबोर्डकडे परत जा
          </Link>
        </div>
        <div className="bg-green-100 rounded-full p-4 mb-4">
          <FiUser className="text-green-700 text-5xl" />
        </div>
        <h2 className="text-2xl font-bold text-green-900 mb-2 font-[Mukta]">माझे प्रोफाइल</h2>
        <div className="w-full mt-4 space-y-3">
          <div className="flex justify-between border-b pb-2">
            <span className="text-gray-600 font-semibold">नाव:</span>
            <span className="text-green-900 font-bold">{profile?.name}</span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="text-gray-600 font-semibold">ईमेल:</span>
            <span className="text-green-900 font-bold">{profile?.email}</span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="text-gray-600 font-semibold">फोन:</span>
            <span className="text-green-900 font-bold">{profile?.phoneNumber}</span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="text-gray-600 font-semibold">भूमिका:</span>
            <span className="text-green-900 font-bold">{profile?.role}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 font-semibold">भाषा:</span>
            <span className="text-green-900 font-bold">{profile?.preferredLanguage === 'marathi' ? 'मराठी' : 'English'}</span>
          </div>
        </div>
      </div>
      {/* Fields Section */}
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg mt-8 border-2 border-green-200">
        <h3 className="text-xl font-bold text-green-800 mb-4">Fields</h3>
        {fields.length === 0 ? (
          <div className="text-gray-500">No fields found for your profile.</div>
        ) : (
          <ul className="space-y-4">
            {fields.map((field) => (
              <li key={field._id} className="border-b pb-2">
                <div className="font-semibold text-green-900">{field.name}</div>
                <div className="text-sm text-gray-700">Location: {field.location?.address?.village || ''}, {field.location?.address?.district || ''}, {field.location?.address?.state || ''}</div>
                <div className="text-sm text-gray-700">Area: {field.location?.area?.value} {field.location?.area?.unit}</div>
                <div className="text-sm text-gray-700">Current Crop: {field.currentCrop?.name || 'N/A'}</div>
                <div className="text-sm text-gray-700">Status: {field.status}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Profile; 