import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Dimensions, StyleSheet } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import api from '../utils/api';
import { deleteToken } from '../utils/secureStore';

const screenWidth = Dimensions.get('window').width;

interface Field {
  fieldId: string;
  name: string;
}

const moduleCards = [
  {
    title: 'शेत निर्णय समर्थन प्रणाली',
    description: 'सेंसर डेटा आणि हवामानावर आधारित सूचना',
    path: 'FDSS',
    color: '#e6ffe6',
    icon: <MaterialCommunityIcons name="lightbulb-on-outline" size={30} color="#166534" />,
    iconBg: '#bbf7d0',
  },
  {
    title: 'रोग शोधक',
    description: 'पिकांच्या रोगांची ओळख आणि उपाय',
    path: 'DiseaseDetector',
    color: '#fef2f2',
    icon: <MaterialCommunityIcons name="microscope" size={30} color="#dc2626" />,
    iconBg: '#fecaca',
  },
  {
    title: 'भूमी अहवाल',
    description: 'NDVI आणि भूमी विश्लेषण',
    path: 'LandReport',
    color: '#f0f9ff',
    icon: <MaterialCommunityIcons name="earth" size={30} color="#2563eb" />,
    iconBg: '#bfdbfe',
  },
];

interface DashboardScreenProps {
  navigation: any;
  onLogout: () => void;
}

const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation, onLogout }) => {
  const [selectedPlot, setSelectedPlot] = useState('');
  const [fields, setFields] = useState<Field[]>([]);
  const [fieldsLoading, setFieldsLoading] = useState(true);
  const [currentData, setCurrentData] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [noDataMsg, setNoDataMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch farmer's assigned fields
  const fetchFarmerFields = async () => {
    setFieldsLoading(true);
    try {
      const response = await api.get('/fields');
      const userFields = response.data.fields || [];
      setFields(userFields);

      // Set the first field as default if available
      if (userFields.length > 0) {
        setSelectedPlot(userFields[0].fieldId);
      }
    } catch (error: any) {
      console.error('Error fetching fields:', error);
      // Fallback to hardcoded fields if API fails (for development/testing)
      const fallbackFields = [
        { fieldId: 'plot1', name: 'Plot 1' },
        { fieldId: 'plot2', name: 'Plot 2' },
        { fieldId: 'plot3', name: 'Plot 3' }
      ];
      setFields(fallbackFields);
      setSelectedPlot('plot1');
    } finally {
      setFieldsLoading(false);
    }
  };

  // Load fields on component mount
  useEffect(() => {
    fetchFarmerFields();
  }, []);

  useEffect(() => {
    if (!selectedPlot) return;
    
    // Fetch latest sensor data for selected plot
    setLoading(true);
    setErrorMsg(''); // Reset error on plot change
    setCurrentData(null);
    setChartData([]);
    
    // Fetch data in parallel for better performance
    Promise.all([
      api.get(`/sensor-data/latest?fieldId=${selectedPlot}&_=${Date.now()}`),
      api.get(`/sensor-data/24h?fieldId=${selectedPlot}&_=${Date.now()}`)
    ])
      .then(([latestRes, chartRes]) => {
        setCurrentData(latestRes.data);
        setChartData(chartRes.data.data);
        if (chartRes.data.data.length === 0) {
          setNoDataMsg(chartRes.data.message.english);
        } else {
          setNoDataMsg('');
        }
      })
      .catch(err => {
        if (err.response && err.response.status === 401) {
          setErrorMsg('Session expired or unauthorized. Please log in again.');
          Alert.alert('Unauthorized', 'Session expired or unauthorized. Please log in again.');
        } else {
          setErrorMsg('Failed to fetch sensor data. Please try again.');
          console.log('Error fetching sensor data:', err);
        }
        setCurrentData(null);
        setChartData([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [selectedPlot]);

  const handleLogout = async () => {
    await deleteToken('accessToken');
    await deleteToken('refreshToken');
    Alert.alert('Logged out');
    onLogout();
  };

  // Prepare chart data
  const chartLabels = chartData.map(d => {
    const date = new Date(d.timestamp);
    return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
  });
  const moistureData = chartData.map(d => d.moisture);
  const tempData = chartData.map(d => d.temperature);

  const lineChartData = {
    labels: chartLabels.length > 8 ? chartLabels.filter((_, i) => i % Math.ceil(chartLabels.length / 8) === 0) : chartLabels,
    datasets: [
      {
        data: moistureData,
        color: () => '#22c55e',
        strokeWidth: 2,
        label: 'ओलावा (%)',
      },
      {
        data: tempData,
        color: () => '#3b82f6',
        strokeWidth: 2,
        label: 'तापमान (°C)',
      },
    ],
    legend: ['ओलावा (%)', 'तापमान (°C)'],
  };

  const validMoisture = Array.isArray(moistureData) && moistureData.length > 1 && moistureData.every(n => typeof n === 'number' && isFinite(n));
  const validTemp = Array.isArray(tempData) && tempData.length > 1 && tempData.every(n => typeof n === 'number' && isFinite(n));
  const validChart = validMoisture && validTemp;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#00b300" />
        <Text>Loading dashboard...</Text>
      </View>
    );
  }

  // Only show full-page error for session/unauthorized errors
  if (errorMsg && errorMsg.toLowerCase().includes('unauthorized')) {
    return (
      <View style={styles.center}>
        <Text style={{ color: 'red', fontWeight: 'bold', fontSize: 16 }}>{errorMsg}</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F9FAF6' }}>
      <ScrollView contentContainerStyle={[styles.container, styles.topSpace]}>
        {/* Header with Logo and Logout Icon */}
        <View style={styles.headerRow}>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>स्मार्टशेती</Text>
            <Text style={styles.headerSubtitle}>नवीन युगातील शेतकरी साथी</Text>
          </View>
          <TouchableOpacity style={styles.logoutIconBtn} onPress={handleLogout}>
            <MaterialCommunityIcons name="logout" size={28} color="#b91c1c" />
          </TouchableOpacity>
        </View>

        {/* Welcome Message & Quick Stats */}
        <View style={styles.welcomeCard}>
          <View style={styles.welcomeRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
              <Text style={styles.welcomeTitle}>नमस्कार, शेतकरी मित्र!</Text>
              <MaterialCommunityIcons name="hand-wave" size={22} color="#22c55e" style={{ marginLeft: 6 }} />
            </View>
            <Text style={styles.welcomeMsg}>आपल्या शेतासाठी स्मार्टशेती डॅशबोर्डमध्ये स्वागत आहे.</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statsBoxRowNew}>
            <View style={styles.statsBoxNew}>
              <View style={[styles.statsIconCircle, { backgroundColor: '#bbf7d0' }] }>
                <MaterialCommunityIcons name="water-percent" size={24} color="#22c55e" />
              </View>
              <Text style={styles.statsLabelNew}>मातीची आर्द्रता</Text>
              <Text style={styles.statsValueNew}>{currentData ? currentData.moisture : '--'}%</Text>
            </View>
            <View style={styles.statsBoxNew}>
              <View style={[styles.statsIconCircle, { backgroundColor: '#fef9c3' }] }>
                <MaterialCommunityIcons name="thermometer" size={24} color="#b59f3b" />
              </View>
              <Text style={[styles.statsLabelNew, { color: '#b59f3b' }]}>तापमान</Text>
              <Text style={[styles.statsValueNew, { color: '#b59f3b' }]}>{currentData ? currentData.temperature : '--'}°C</Text>
            </View>
          </View>
        </View>

        {/* Alert if moisture is low */}
        {currentData && currentData.moisture < 25 && (
          <View style={styles.alertCard}>
            <Text style={styles.alertText}>⚠️ जमिनीतील ओलावा कमी आहे! पाणी द्या.</Text>
          </View>
        )}

        {/* 24h Data Chart */}
        <View style={styles.sectionBox}>
          <Text style={styles.sectionTitle}>२४ तासांचा डेटा</Text>
          {/* Plot Selector Pills */}
          <View style={styles.plotSelectorRow}>
            {fields.map(field => (
              <TouchableOpacity
                key={field.fieldId}
                onPress={() => setSelectedPlot(field.fieldId)}
                style={[styles.plotPill, selectedPlot === field.fieldId && styles.plotPillSelected]}
              >
                <Text style={[styles.plotPillText, selectedPlot === field.fieldId && styles.plotPillTextSelected]}>{field.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {/* Inline error message for 24h data errors */}
          {errorMsg && !errorMsg.toLowerCase().includes('unauthorized') && (
            <Text style={{ color: 'red', textAlign: 'center', marginVertical: 6 }}>{errorMsg}</Text>
          )}
          {noDataMsg ? (
            <Text style={styles.noDataMsg}>{noDataMsg}</Text>
          ) : validChart ? (
            <LineChart
              data={lineChartData}
              width={screenWidth - 40}
              height={220}
              chartConfig={{
                backgroundColor: '#fff',
                backgroundGradientFrom: '#e6ffe6',
                backgroundGradientTo: '#fffbe6',
                decimalPlaces: 1,
                color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(22, 101, 52, ${opacity})`,
                style: { borderRadius: 16 },
                propsForDots: { r: '3', strokeWidth: '2', stroke: '#22c55e' },
              }}
              bezier
              style={{ borderRadius: 12, marginVertical: 8 }}
            />
          ) : (
            <Text style={{ color: 'gray', marginVertical: 8 }}>डेटा उपलब्ध नाही.</Text>
          )}
        </View>

        {/* Module Navigation Cards with Icons */}
        <View style={styles.sectionBox}>
          <Text style={styles.sectionTitle}>स्मार्टशेती सुविधा</Text>
          <View style={styles.moduleRow}>
            {moduleCards.map((card, idx) => (
              <TouchableOpacity
                key={idx}
                style={[styles.moduleCard, { backgroundColor: card.color }]}
                onPress={() => navigation.navigate(card.path)}
                activeOpacity={0.85}
              >
                <View style={[styles.iconCircle, { backgroundColor: card.iconBg }]}>{card.icon}</View>
                <Text style={styles.moduleTitle}>{card.title}</Text>
                <Text style={styles.moduleDesc}>{card.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Floating Chatbot Button - Outside ScrollView to stay visible */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('Chatbot')}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="account-cowboy-hat" size={32} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'stretch',
    backgroundColor: '#F9FAF6',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    marginTop: 4,
    paddingHorizontal: 4,
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 12,
    marginRight: 8,
    backgroundColor: '#fff',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#166534',
    textAlign: 'center',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#15803d',
    textAlign: 'center',
    marginBottom: 16,
  },
  welcomeCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  welcomeRow: {
    marginBottom: 6,
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 10,
    borderRadius: 1,
  },
  statsBoxRowNew: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  statsBoxNew: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderRadius: 14,
    alignItems: 'center',
    paddingVertical: 18,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  statsIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  statsLabelNew: {
    fontSize: 13,
    color: '#15803d',
    marginBottom: 2,
    fontWeight: '600',
  },
  statsValueNew: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#166534',
  },
  alertCard: {
    backgroundColor: '#fee2e2',
    borderColor: '#fca5a5',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    alignItems: 'center',
  },
  alertText: {
    color: '#b91c1c',
    fontWeight: 'bold',
    fontSize: 16,
  },
  sectionBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#166534',
    marginBottom: 8,
  },
  noDataMsg: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
  },
  chartPlaceholder: {
    color: '#444',
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  moduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  moduleCard: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    elevation: 2,
  },
  moduleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#166534',
    marginBottom: 4,
  },
  moduleDesc: {
    fontSize: 13,
    color: '#444',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    backgroundColor: '#22c55e',
    borderRadius: 32,
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    zIndex: 100,
  },
  iconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.10,
    shadowRadius: 2,
    elevation: 2,
  },
  logoutIconBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#fee2e2',
    marginLeft: 8,
    elevation: 2,
  },
  topSpace: {
    paddingTop: 28,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#166534',
    marginBottom: 2,
  },
  welcomeMsg: {
    fontSize: 14,
    color: '#444',
    marginBottom: 8,
  },
  plotSelectorRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 2,
  },
  plotPill: {
    paddingVertical: 6,
    paddingHorizontal: 18,
    borderRadius: 20,
    marginHorizontal: 4,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  plotPillSelected: {
    backgroundColor: '#22c55e',
    borderWidth: 0,
  },
  plotPillText: {
    color: '#166534',
    fontWeight: 'normal',
  },
  plotPillTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default DashboardScreen; 