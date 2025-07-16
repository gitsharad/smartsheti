import React, { useEffect, useState } from 'react';
import Dashboard from '../components/Dashboard';
import apiRoutes from '../services/apiRoutes';

const Home = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await apiRoutes.getProfile();
        setProfile(response.data.user);
        setError(null);
      } catch (err) {
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      <h1>Welcome, {profile?.name || 'User'}!</h1>
      {/* Render more profile info as needed */}
    </div>
  );
};

export default Home; 