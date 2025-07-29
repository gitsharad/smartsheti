import React, { useState, useEffect } from 'react';
import { Shield, Lock, Award, Eye, Users, TrendingUp, CheckCircle, Star, Clock } from 'lucide-react';

const TrustDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [trustData, setTrustData] = useState(null);

  useEffect(() => {
    fetchTrustData();
  }, []);

  const fetchTrustData = async () => {
    try {
      const mockData = {
        systemHealth: {
          uptime: 99.9,
          responseTime: 200,
          dataAccuracy: 98,
          userSatisfaction: 4.5
        },
        security: {
          incidents: 0,
          lastIncident: null,
          certifications: 3
        },
        compliance: {
          gdpr: true,
          iso27001: true,
          soc2: true
        },
        userTrust: {
          averageRating: 4.6,
          totalReviews: 1250,
          verifiedReviews: 1180
        },
        socialImpact: {
          farmersServed: 5000,
          yieldImprovement: 25,
          costSavings: 1500000,
          waterSaved: 5000000,
          carbonReduction: 25000
        }
      };
      setTrustData(mockData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching trust data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: Shield },
    { id: 'security', name: 'Security', icon: Lock },
    { id: 'transparency', name: 'Transparency', icon: Eye },
    { id: 'community', name: 'Community', icon: Users },
    { id: 'impact', name: 'Social Impact', icon: TrendingUp }
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold">Trust Score</h3>
            <p className="text-green-100">Comprehensive trust assessment</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold">98.5</div>
            <div className="text-green-100">/ 100</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          title="System Uptime"
          value={`${trustData.systemHealth.uptime}%`}
          icon={CheckCircle}
          color="green"
          description="Last 30 days"
        />
        <MetricCard
          title="Avg. Response Time"
          value={`${trustData.systemHealth.responseTime}ms`}
          icon={Clock}
          color="blue"
          description="API response time"
        />
        <MetricCard
          title="Data Accuracy"
          value={`${trustData.systemHealth.dataAccuracy}%`}
          icon={Award}
          color="purple"
          description="Sensor data precision"
        />
        <MetricCard
          title="User Satisfaction"
          value={trustData.systemHealth.userSatisfaction}
          icon={Star}
          color="yellow"
          description="Average rating"
        />
        <MetricCard
          title="Security Incidents"
          value={trustData.security.incidents}
          icon={Shield}
          color="red"
          description="Last 30 days"
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Trust Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Transparency, security, and reliability metrics for AI Krishi
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                      activeTab === tab.id
                        ? 'border-green-500 text-green-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        <div className="mb-8">
          {activeTab === 'overview' && renderOverview()}
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ title, value, icon: Icon, color, description }) => {
  const colorClasses = {
    green: 'text-green-600',
    blue: 'text-blue-600',
    yellow: 'text-yellow-600',
    red: 'text-red-600',
    purple: 'text-purple-600'
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <div className="flex items-center">
        <div className={`p-2 rounded-lg bg-${color}-100`}>
          <Icon className={`w-6 h-6 ${colorClasses[color]}`} />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
      </div>
    </div>
  );
};

export default TrustDashboard; 