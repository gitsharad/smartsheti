import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import api from '../utils/api';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define the navigation stack param list
type RootStackParamList = {
  Dashboard: undefined;
  // ...other routes if needed
};

interface Field {
  fieldId: string;
  name: string;
}

const FDSS = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [field, setField] = useState('');
  const [fields, setFields] = useState<Field[]>([]);
  const [fieldsLoading, setFieldsLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [weather, setWeather] = useState<any>(null);
  const [insights, setInsights] = useState<any[]>([]);

  // Fetch farmer's assigned fields
  const fetchFarmerFields = async () => {
    setFieldsLoading(true);
    try {
      const response = await api.get('/fields');
      const userFields = response.data.fields || [];
      setFields(userFields);

      // Set the first field as default if available
      if (userFields.length > 0) {
        setField(userFields[0].fieldId);
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
      setField('plot1');
    } finally {
      setFieldsLoading(false);
    }
  };

  const fetchData = async (selectedField: string) => {
    if (!selectedField) return;
    
    setLoading(true);
    try {
      const [weatherRes, insightsRes] = await Promise.all([
        api.get(`/fdss/weather/current?fieldId=${selectedField}`),
        api.get(`/fdss/insights?fieldId=${selectedField}`),
      ]);
      setWeather(weatherRes.data);
      setInsights(Array.isArray(insightsRes.data.insights) ? insightsRes.data.insights : []);
    } catch (error: any) {
      console.error('Error fetching FDSS data:', error);
      Alert.alert('Error', 'Failed to fetch weather or insights.');
      setWeather(null);
      setInsights([]);
    } finally {
      setLoading(false);
    }
  };

  // Load fields on component mount
  useEffect(() => {
    fetchFarmerFields();
  }, []);

  // Fetch insights and weather when field changes
  useEffect(() => {
    if (field) {
      fetchData(field);
    }
  }, [field]);

  const resetState = () => {
    setField('');
    setWeather(null);
    setInsights([]);
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      return () => {
        resetState();
      };
    }, [])
  );

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#fee2e2';
      case 'medium': return '#fef9c3';
      case 'low': return '#bbf7d0';
      default: return '#e0e7ef';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <MaterialIcons name="error" size={20} color="#dc2626" style={{ marginRight: 6 }} />;
      case 'medium': return <MaterialIcons name="schedule" size={20} color="#ca8a04" style={{ marginRight: 6 }} />;
      case 'low': return <MaterialIcons name="check-circle" size={20} color="#16a34a" style={{ marginRight: 6 }} />;
      default: return <MaterialCommunityIcons name="lightbulb-on-outline" size={20} color="#166534" style={{ marginRight: 6 }} />;
    }
  };

  return (
    <ScrollView style={[styles.container, { marginTop: 32 }]}>
      <View style={styles.headerRow}>
        <MaterialCommunityIcons name="lightbulb-on-outline" size={28} color="#facc15" style={{ marginRight: 8 }} />
        <Text style={styles.header}>शेत निर्णय समर्थन प्रणाली</Text>
      </View>
      
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>शेत निवडा</Text>
        {fieldsLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#22c55e" />
            <Text style={styles.loadingText}>शेत लोड करत आहे...</Text>
          </View>
        ) : fields.length > 0 ? (
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={field}
              style={styles.picker}
              onValueChange={(itemValue) => setField(itemValue)}>
              {fields.map((fieldItem) => (
                <Picker.Item 
                  key={fieldItem.fieldId} 
                  label={`${fieldItem.name} (${fieldItem.fieldId})`} 
                  value={fieldItem.fieldId} 
                />
              ))}
            </Picker>
          </View>
        ) : (
          <View style={styles.noFieldsContainer}>
            <Text style={styles.noFieldsText}>कोणतेही शेत उपलब्ध नाहीत</Text>
            <Text style={styles.noFieldsSubtext}>कृपया प्रशासकाशी संपर्क साधा</Text>
          </View>
        )}
      </View>

      {!field && !fieldsLoading && fields.length > 0 && (
        <View style={styles.card}>
          <View style={styles.noSelectionContainer}>
            <MaterialCommunityIcons name="lightbulb-on-outline" size={48} color="#d1d5db" />
            <Text style={styles.noSelectionText}>शेत निवडा</Text>
            <Text style={styles.noSelectionSubtext}>सूचना मिळवण्यासाठी वरील ड्रॉपडाउनमधून शेत निवडा</Text>
          </View>
        </View>
      )}

      {field && (
        <>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>हवामान माहिती</Text>
            {loading ? <ActivityIndicator size="small" color="#22c55e" /> : weather ? (
              <View style={styles.weatherRow}>
                <View style={styles.weatherCard}>
                  <View style={[styles.weatherIconCircle, { backgroundColor: '#fef9c3' }] }>
                    <MaterialCommunityIcons name="thermometer" size={24} color="#dc2626" />
                  </View>
                  <Text style={styles.weatherLabel}>तापमान</Text>
                  <Text style={styles.weatherValue}>{weather.temperature}°C</Text>
                </View>
                <View style={styles.weatherCard}>
                  <View style={[styles.weatherIconCircle, { backgroundColor: '#bbf7d0' }] }>
                    <MaterialCommunityIcons name="water-percent" size={24} color="#2563eb" />
                  </View>
                  <Text style={styles.weatherLabel}>आर्द्रता</Text>
                  <Text style={styles.weatherValue}>{weather.humidity}%</Text>
                </View>
                <View style={styles.weatherCard}>
                  <View style={[styles.weatherIconCircle, { backgroundColor: '#fee2e2' }] }>
                    <MaterialCommunityIcons name="weather-rainy" size={24} color="#ca8a04" />
                  </View>
                  <Text style={styles.weatherLabel}>पाऊस संधी</Text>
                  <Text style={styles.weatherValue}>{weather.rainChance}%</Text>
                </View>
              </View>
            ) : <Text>माहिती उपलब्ध नाही.</Text>}
          </View>
          
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>सल्ला/सूचना</Text>
            {loading ? <ActivityIndicator size="small" color="#22c55e" /> : (
              insights.length > 0 ? insights.map((item, idx) => (
                <View key={idx} style={[styles.insightCard, { backgroundColor: getPriorityColor(item.priority), borderLeftColor: item.priority === 'high' ? '#dc2626' : item.priority === 'medium' ? '#facc15' : '#22c55e', borderLeftWidth: 4 }] }>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {getPriorityIcon(item.priority)}
                    <Text style={{ fontWeight: 'bold', color: '#166534' }}>{item.type === 'alert' ? '⚠️' : '💡'} {item.message?.marathi || item.message}</Text>
                  </View>
                  <Text style={styles.timestamp}>{item.timestamp ? new Date(item.timestamp).toLocaleString('en-IN') : ''}</Text>
                </View>
              )) : <Text>सल्ला/सूचना उपलब्ध नाही.</Text>
            )}
          </View>
        </>
      )}
      
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('Dashboard')}>
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
  pickerContainer: {
    minHeight: 40,
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 8,
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  picker: {
    width: '100%',
    color: '#166534',
  },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8, color: '#166534' },
  weatherRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  weatherCard: { flex: 1, alignItems: 'center', padding: 12, borderRadius: 12, marginHorizontal: 4 },
  weatherLabel: { fontSize: 14, color: '#64748b', marginTop: 4 },
  weatherValue: { fontSize: 18, fontWeight: 'bold', color: '#166534', marginTop: 2 },
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
  weatherIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  insightCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  timestamp: { fontSize: 12, color: '#64748b', marginTop: 4 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginLeft: 10,
    color: '#64748b',
    fontSize: 14,
  },
  noFieldsContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    marginTop: 10,
  },
  noFieldsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#dc2626',
    marginBottom: 5,
  },
  noFieldsSubtext: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  noSelectionContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    marginTop: 10,
  },
  noSelectionText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#166534',
    marginTop: 10,
  },
  noSelectionSubtext: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 5,
  },
});

export default FDSS; 