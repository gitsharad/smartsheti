import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, Button, ActivityIndicator, StyleSheet, ScrollView, Alert, TouchableOpacity, Dimensions } from 'react-native';
import api from '../utils/api';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LineChart } from 'react-native-chart-kit';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Buffer } from 'buffer';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';

// Define the navigation stack param list
type RootStackParamList = {
  Dashboard: undefined;
  // ...other routes if needed
};

const getSoilHealthScore = (data: any) => {
  if (!data) return 0;
  let score = 0;
  const ph = parseFloat(data.ph);
  if (ph >= 6.0 && ph <= 7.5) score += 25;
  else if (ph >= 5.5 && ph <= 8.0) score += 15;
  else score += 5;
  const n = parseFloat(data.nitrogen);
  const p = parseFloat(data.phosphorus);
  const k = parseFloat(data.potassium);
  if (n >= 140 && n <= 200) score += 25;
  else if (n >= 100 && n <= 250) score += 15;
  else score += 5;
  if (p >= 10 && p <= 20) score += 25;
  else if (p >= 5 && p <= 30) score += 15;
  else score += 5;
  if (k >= 100 && k <= 200) score += 25;
  else if (k >= 50 && k <= 300) score += 15;
  else score += 5;
  return Math.min(100, score);
};

const getScoreColor = (score: number) => {
  if (score >= 80) return { color: '#16a34a', bg: '#bbf7d0' };
  if (score >= 60) return { color: '#ca8a04', bg: '#fef9c3' };
  return { color: '#dc2626', bg: '#fee2e2' };
};

const LandReport = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [soilData, setSoilData] = useState({ ph: '', nitrogen: '', phosphorus: '', potassium: '', organicMatter: '', location: '' });
  const [lat, setLat] = useState('');
  const [lon, setLon] = useState('');
  const [ndvi, setNdvi] = useState<any[]>([]);
  const [fieldId, setFieldId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(null);

  const handleInputChange = (name: string, value: string) => {
    setSoilData(prev => ({ ...prev, [name]: value }));
  };

  const fetchNDVI = async () => {
    if (!lat || !lon) {
      Alert.alert('त्रुटी', 'कृपया अक्षांश आणि रेखांश भरा');
      return;
    }
    setLoading(true);
    try {
      const regRes = await api.post('/ndvi/register-field', { lat: parseFloat(lat), lon: parseFloat(lon), radius: 500, name: 'My Farm' });
      const regData = regRes.data;
      const newFieldId = regData.fieldId;
      setFieldId(newFieldId);
      const ndviRes = await api.get(`/ndvi/time-series?fieldId=${newFieldId}`);
      setNdvi(ndviRes.data.ndvi || []);
      Alert.alert('NDVI', 'NDVI डेटा मिळाला!');
    } catch (err: any) {
      console.error('NDVI fetch error:', err);
      Alert.alert('त्रुटी', 'NDVI मिळवताना त्रुटी: ' + (err?.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    if (!soilData.ph || !soilData.nitrogen || !soilData.phosphorus || !soilData.potassium) {
      Alert.alert('त्रुटी', 'कृपया सर्व मुळभूत माहिती भरा');
      return;
    }
    setLoading(true);
    try {
      const response = await api.post('/land/report', { ...soilData, ndvi });
      setReport(response.data.report);
    } catch (error: any) {
      console.error('Report error:', error);
      Alert.alert('त्रुटी', 'अहवाल तयार करताना त्रुटी: ' + (error?.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    if (!report) return;
    try {
      const response = await api.post('/land/download-pdf', report, { responseType: 'arraybuffer' });
      const pdfUri = FileSystem.cacheDirectory + 'land-health-report.pdf';
      const base64 = Buffer.from(response.data, 'binary').toString('base64');
      await FileSystem.writeAsStringAsync(pdfUri, base64, { encoding: FileSystem.EncodingType.Base64 });
      await Sharing.shareAsync(pdfUri);
    } catch (error) {
      Alert.alert('PDF डाउनलोड त्रुटी', 'PDF डाउनलोड करण्यात अडचण आली.');
      console.error('PDF download error:', error);
    }
  };

  // Add a function to reset all state
  const resetState = () => {
    setSoilData({ ph: '', nitrogen: '', phosphorus: '', potassium: '', organicMatter: '', location: '' });
    setLat('');
    setLon('');
    setNdvi([]);
    setFieldId('');
    setReport(null);
  };

  useFocusEffect(
    useCallback(() => {
      return () => {
        resetState();
      };
    }, [])
  );

  // Prepare NDVI chart data with safety checks (at least 2 valid points)
  const validNdvi = Array.isArray(ndvi) && ndvi.length > 1 && ndvi.every(n => typeof n.ndvi === 'number' && isFinite(n.ndvi));
  const ndviChartData = validNdvi
    ? {
        labels: ndvi.map((n: any, i: number) => (n.date ? new Date(n.date).toLocaleDateString('en-IN') : `${i+1}`)),
        datasets: [{ data: ndvi.map((n: any) => n.ndvi) }],
      }
    : null;
  console.log('NDVI:', ndvi);
  console.log('ndviChartData:', ndviChartData);

  const soilScore = getSoilHealthScore(soilData);
  const scoreColor = getScoreColor(soilScore);

  return (
    <ScrollView style={[styles.container, { marginTop: 32 }]}>
      {/* Header with Icon */}
      <View style={styles.headerRow}>
        <MaterialCommunityIcons name="file-document-outline" size={28} color="#22c55e" style={{ marginRight: 8 }} />
        <Text style={styles.header}>जमीन आरोग्य अहवाल</Text>
      </View>
      <View style={styles.card}>
        <View style={styles.formGroup}>
          <View style={styles.inputRow}><Feather name="activity" size={18} color="#22c55e" style={{ marginRight: 6 }} /><Text>pH मूल्य:</Text></View>
          <TextInput style={styles.input} keyboardType="decimal-pad" value={soilData.ph} onChangeText={v => handleInputChange('ph', v)} placeholder="6.5" />
          <View style={styles.inputRow}><Feather name="droplet" size={18} color="#22c55e" style={{ marginRight: 6 }} /><Text>नायट्रोजन (mg/kg):</Text></View>
          <TextInput style={styles.input} keyboardType="decimal-pad" value={soilData.nitrogen} onChangeText={v => handleInputChange('nitrogen', v)} placeholder="150" />
          <View style={styles.inputRow}><Feather name="feather" size={18} color="#22c55e" style={{ marginRight: 6 }} /><Text>फॉस्फरस (mg/kg):</Text></View>
          <TextInput style={styles.input} keyboardType="decimal-pad" value={soilData.phosphorus} onChangeText={v => handleInputChange('phosphorus', v)} placeholder="15" />
          <View style={styles.inputRow}><Feather name="droplet" size={18} color="#22c55e" style={{ marginRight: 6 }} /><Text>पोटॅशियम (mg/kg):</Text></View>
          <TextInput style={styles.input} keyboardType="decimal-pad" value={soilData.potassium} onChangeText={v => handleInputChange('potassium', v)} placeholder="120" />
          <View style={styles.inputRow}><Feather name="percent" size={18} color="#22c55e" style={{ marginRight: 6 }} /><Text>सेंद्रिय पदार्थ (%):</Text></View>
          <TextInput style={styles.input} keyboardType="decimal-pad" value={soilData.organicMatter} onChangeText={v => handleInputChange('organicMatter', v)} placeholder="2.5" />
          <View style={styles.inputRow}><MaterialCommunityIcons name="map-marker" size={18} color="#22c55e" style={{ marginRight: 6 }} /><Text>अक्षांश (Latitude):</Text></View>
          <TextInput style={styles.input} keyboardType="decimal-pad" value={lat} onChangeText={setLat} placeholder="18.5204" />
          <View style={styles.inputRow}><MaterialCommunityIcons name="map-marker" size={18} color="#22c55e" style={{ marginRight: 6 }} /><Text>रेखांश (Longitude):</Text></View>
          <TextInput style={styles.input} keyboardType="decimal-pad" value={lon} onChangeText={setLon} placeholder="73.8567" />
        </View>
        <TouchableOpacity style={styles.actionBtn} onPress={fetchNDVI} disabled={loading}>
          <MaterialCommunityIcons name="satellite-variant" size={20} color="#fff" />
          <Text style={styles.actionBtnText}>{loading ? 'NDVI मिळवत आहे...' : 'NDVI मिळवा'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={generateReport} disabled={loading}>
          <MaterialCommunityIcons name="file-document-edit-outline" size={20} color="#fff" />
          <Text style={styles.actionBtnText}>{loading ? 'अहवाल तयार करत आहे...' : 'अहवाल तयार करा'}</Text>
        </TouchableOpacity>
        {loading && <ActivityIndicator size="large" color="#22c55e" style={{ marginTop: 16 }} />}
      </View>
      <View style={[styles.scoreBox, { backgroundColor: scoreColor.bg }]}> 
        <MaterialCommunityIcons name="star-circle" size={22} color={scoreColor.color} style={{ marginRight: 6 }} />
        <Text style={[styles.scoreText, { color: scoreColor.color }]}>Soil Health Score: {soilScore}/100</Text>
      </View>
      {validNdvi ? (
        <View style={styles.card}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <MaterialCommunityIcons name="chart-line" size={22} color="#22c55e" style={{ marginRight: 6 }} />
            <Text style={{ fontWeight: 'bold', marginBottom: 8 }}>NDVI Line Chart</Text>
          </View>
          <LineChart
            data={ndviChartData as any}
            width={Dimensions.get('window').width - 48}
            height={180}
            chartConfig={{
              backgroundColor: '#fff',
              backgroundGradientFrom: '#bbf7d0',
              backgroundGradientTo: '#f0fdf4',
              decimalPlaces: 2,
              color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(22, 101, 52, ${opacity})`,
              style: { borderRadius: 16 },
              propsForDots: { r: '4', strokeWidth: '2', stroke: '#22c55e' },
            }}
            bezier
            style={{ borderRadius: 12 }}
          />
        </View>
      ) : ndvi.length > 0 ? (
        <Text style={{ color: 'red', marginVertical: 8 }}>NDVI डेटा अवैध आहे.</Text>
      ) : (
        <Text style={{ color: 'gray', marginVertical: 8 }}>NDVI डेटा उपलब्ध नाही.</Text>
      )}
      {report && (
        <View style={styles.card}>
          <Text style={styles.reportTitle}>अहवाल</Text>
          {/* Location Analysis Section */}
          {report.locationAnalysis && (
            <View style={{ marginTop: 12 }}>
              <Text style={{ fontWeight: 'bold', color: '#166534' }}>स्थान विश्लेषण:</Text>
              <Text>प्रदेश: {report.locationAnalysis.region}</Text>
              <Text>हवामान: {report.locationAnalysis.climate}</Text>
              <Text>माती प्रकार: {report.locationAnalysis.soilType}</Text>
              {report.locationAnalysis.marketAdvantages?.length > 0 && (
                <Text>बाजार फायदे: {report.locationAnalysis.marketAdvantages.join(', ')}</Text>
              )}
              {report.locationAnalysis.challenges?.length > 0 && (
                <Text>आव्हाने: {report.locationAnalysis.challenges.join(', ')}</Text>
              )}
              {report.locationAnalysis.recommendations?.length > 0 && (
                <Text>शिफारसी: {report.locationAnalysis.recommendations.join(', ')}</Text>
              )}
            </View>
          )}
          {/* Soil Health Analysis Section */}
          {report.soilAnalysis && (
            <View style={{ marginTop: 12 }}>
              <Text style={{ fontWeight: 'bold', color: '#166534' }}>माती आरोग्य विश्लेषण:</Text>
              <Text>एकूण आरोग्य स्कोअर: {report.soilAnalysis.overallScore}/100</Text>
              <Text>एकूण आरोग्य स्थिती: {report.soilAnalysis.overallHealth}</Text>
              <Text>pH: {report.soilAnalysis.ph?.value} ({report.soilAnalysis.ph?.status})</Text>
              <Text>→ सूचना: {report.soilAnalysis.ph?.recommendation}</Text>
              <Text>नायट्रोजन: {report.soilAnalysis.nitrogen?.value} ({report.soilAnalysis.nitrogen?.status})</Text>
              <Text>→ सूचना: {report.soilAnalysis.nitrogen?.recommendation}</Text>
              <Text>फॉस्फरस: {report.soilAnalysis.phosphorus?.value} ({report.soilAnalysis.phosphorus?.status})</Text>
              <Text>→ सूचना: {report.soilAnalysis.phosphorus?.recommendation}</Text>
              <Text>पोटॅशियम: {report.soilAnalysis.potassium?.value} ({report.soilAnalysis.potassium?.status})</Text>
              <Text>→ सूचना: {report.soilAnalysis.potassium?.recommendation}</Text>
              {report.soilAnalysis.organicMatter && (
                <>
                  <Text>जैविक पदार्थ: {report.soilAnalysis.organicMatter.value} ({report.soilAnalysis.organicMatter.status})</Text>
                  <Text>→ सूचना: {report.soilAnalysis.organicMatter.recommendation}</Text>
                </>
              )}
            </View>
          )}
          {/* Crop Recommendations Section */}
          {report.cropRecommendations && report.cropRecommendations.length > 0 && (
            <View style={{ marginTop: 12 }}>
              <Text style={{ fontWeight: 'bold', color: '#166534', marginBottom: 4 }}>पीक शिफारसी:</Text>
              {report.cropRecommendations.map((crop: any, idx: number) => (
                <View key={idx} style={{ marginBottom: 4 }}>
                  <Text style={{ fontWeight: 'bold' }}>{idx + 1}. {crop.name} ({crop.season})</Text>
                  <Text>योग्यता: {crop.suitability}% | श्रेणी: {crop.category}</Text>
                  <Text>बाजार: {crop.marketPotential} | गुंतवणूक: {crop.investmentRequired}</Text>
                  <Text>कारण: {crop.reason}</Text>
                </View>
              ))}
            </View>
          )}
          {/* NDVI and PDF download remain as before */}
          {report.ndvi && Array.isArray(report.ndvi) && report.ndvi.length > 0 && (
            <View style={{ marginTop: 12 }}>
              <Text style={{ fontWeight: 'bold' }}>NDVI उपग्रह निरीक्षण:</Text>
              {report.ndvi.slice(-3).map((ndviPoint: any, idx: number) => (
                <Text key={idx}>{new Date(ndviPoint.date).toLocaleDateString('mr-IN')} - NDVI: {ndviPoint.ndvi}</Text>
              ))}
              <Text>सरासरी NDVI (३० दिवस): {(
                report.ndvi.length > 0
                  ? (report.ndvi.reduce((sum: number, p: any) => sum + (p.ndvi || 0), 0) / report.ndvi.length).toFixed(2)
                  : 'N/A'
              )}</Text>
            </View>
          )}
          <TouchableOpacity style={styles.pdfButton} onPress={downloadPDF}>
            <MaterialCommunityIcons name="download" size={20} color="#fff" />
            <Text style={styles.pdfButtonText}>PDF डाउनलोड करा</Text>
          </TouchableOpacity>
        </View>
      )}
      <TouchableOpacity style={styles.backButton} onPress={() => { resetState(); navigation.navigate('Dashboard'); }}>
        <Text style={styles.backButtonText}>{'<'} डॅशबोर्डवर परत जा</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAF6', padding: 16 },
  backButton: { marginBottom: 16, alignSelf: 'flex-start', backgroundColor: '#e6ffe6', padding: 8, borderRadius: 8 },
  backButtonText: { color: '#166534', fontWeight: 'bold' },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 16, textAlign: 'center', color: '#166534' },
  formGroup: { marginBottom: 16 },
  input: { backgroundColor: '#fff', borderRadius: 8, padding: 10, marginBottom: 8, borderWidth: 1, borderColor: '#bbf7d0' },
  ndviText: { marginVertical: 8, fontWeight: 'bold', color: '#166534' },
  reportBox: { backgroundColor: '#fff', borderRadius: 8, padding: 16, marginTop: 24 },
  reportTitle: { fontWeight: 'bold', fontSize: 18, marginBottom: 8, color: '#166534' },
  scoreBox: { borderRadius: 8, padding: 12, marginTop: 16, alignItems: 'center' },
  scoreText: { fontWeight: 'bold', fontSize: 16 },
  pdfButton: { marginTop: 16, backgroundColor: '#22c55e', padding: 12, borderRadius: 8, alignItems: 'center' },
  pdfButtonText: { color: '#fff', fontWeight: 'bold' },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#22c55e',
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
    marginBottom: 2,
  },
  actionBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default LandReport; 