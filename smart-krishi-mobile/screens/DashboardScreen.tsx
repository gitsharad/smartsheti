import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, Dimensions, TouchableOpacity, Alert, Image } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { deleteToken } from '../utils/secureStore';
import api from '../utils/api';
import { MaterialCommunityIcons, FontAwesome5, Feather } from '@expo/vector-icons';

const FIELD_ID = 'plot1';
const MOISTURE_THRESHOLD = 25;

const screenWidth = Dimensions.get('window').width;

const moduleCards = [
  {
    title: 'रोग ओळख',
    description: 'पानांचे फोटो अपलोड करून रोगांची ओळख करा',
    path: 'DiseaseDetector',
    color: '#e6ffe6',
    icon: <MaterialCommunityIcons name="virus-outline" size={32} color="#166534" />,
    iconBg: '#bbf7d0',
  },
  {
    title: 'शेत निर्णय',
    description: 'सेंसर डेटा आणि हवामानावर आधारित सूचना',
    path: 'FDSS',
    color: '#fffbe6',
    icon: <Feather name="activity" size={32} color="#b59f3b" />,
    iconBg: '#fef9c3',
  },
  {
    title: 'जमीन आरोग्य',
    description: 'मातीची माहिती आणि पीक योजना',
    path: 'LandReport',
    color: '#ffe6cc',
    icon: <FontAwesome5 name="leaf" size={30} color="#b45309" />,
    iconBg: '#fde68a',
  },
];

const plotOptions = [
  { id: 'plot1', label: 'शेत १' },
  { id: 'plot2', label: 'शेत २' },
  { id: 'plot3', label: 'शेत ३' },
];

interface DashboardScreenProps {
  navigation: any;
  onLogout: () => void;
}

const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation, onLogout }) => {
  const [selectedPlot, setSelectedPlot] = useState('plot1');
  const [currentData, setCurrentData] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [noDataMsg, setNoDataMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    // Fetch latest sensor data for selected plot
    setLoading(true);
    setErrorMsg(''); // Reset error on plot change
    api.get(`/sensor-data/latest?fieldId=${selectedPlot}&_=${Date.now()}`)
      .then(res => setCurrentData(res.data))
      .catch(err => {
        if (err.response && err.response.status === 401) {
          setErrorMsg('Session expired or unauthorized. Please log in again.');
          Alert.alert('Unauthorized', 'Session expired or unauthorized. Please log in again.');
        } else {
          setErrorMsg('Failed to fetch latest sensor data.');
          console.log('Error fetching latest sensor data:', err);
        }
        setCurrentData(null);
      });
    // Fetch last 24h data for selected plot
    api.get(`/sensor-data/24h?fieldId=${selectedPlot}&_=${Date.now()}`)
      .then(res => {
        setChartData(res.data.data);
        if (res.data.data.length === 0) {
          setNoDataMsg(res.data.message.english);
        } else {
          setNoDataMsg('');
        }
      })
      .catch(err => {
        if (err.response && err.response.status === 401) {
          setErrorMsg('Session expired or unauthorized. Please log in again.');
          Alert.alert('Unauthorized', 'Session expired or unauthorized. Please log in again.');
        } else {
          setErrorMsg('Failed to fetch 24h sensor data.');
          console.log('Error fetching 24h sensor data:', err);
        }
        setChartData([]);
      });
    setLoading(false);
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
    <ScrollView contentContainerStyle={[styles.container, styles.topSpace]}>
      {/* Header with Logo and Logout Icon */}
      <View style={styles.headerRow}>
        <Image source={require('../assets/icon.png')} style={styles.logo} />
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
              <Feather name="thermometer" size={24} color="#b59f3b" />
            </View>
            <Text style={[styles.statsLabelNew, { color: '#b59f3b' }]}>तापमान</Text>
            <Text style={[styles.statsValueNew, { color: '#b59f3b' }]}>{currentData ? currentData.temperature : '--'}°C</Text>
          </View>
        </View>
      </View>

      {/* Alert if moisture is low */}
      {currentData && currentData.moisture < MOISTURE_THRESHOLD && (
        <View style={styles.alertCard}>
          <Text style={styles.alertText}>⚠️ जमिनीतील ओलावा कमी आहे! पाणी द्या.</Text>
        </View>
      )}

      {/* 24h Data Chart */}
      <View style={styles.sectionBox}>
        <Text style={styles.sectionTitle}>२४ तासांचा डेटा</Text>
        {/* Plot Selector Pills */}
        <View style={styles.plotSelectorRow}>
          {plotOptions.map(plot => (
            <TouchableOpacity
              key={plot.id}
              onPress={() => setSelectedPlot(plot.id)}
              style={[styles.plotPill, selectedPlot === plot.id && styles.plotPillSelected]}
            >
              <Text style={[styles.plotPillText, selectedPlot === plot.id && styles.plotPillTextSelected]}>{plot.label}</Text>
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

      {/* Floating Chatbot Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('Chatbot')}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="account-cowboy-hat" size={32} color="#fff" />
      </TouchableOpacity>
    </ScrollView>
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