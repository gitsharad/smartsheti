import React, { useState, useCallback } from 'react';
import { View, Text, Button, Image, ActivityIndicator, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import api, { API_BASE_URL } from '../utils/api';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';

// Define the navigation stack param list
type RootStackParamList = {
  Dashboard: undefined;
  // ...other routes if needed
};

const DiseaseDetector = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [image, setImage] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImage(result.assets[0].uri);
      setImageName(result.assets[0].fileName || result.assets[0].uri.split('/').pop() || 'image.jpg');
      setResult(null);
    }
  };

  const removeImage = () => {
    setImage(null);
    setImageName(null);
    setResult(null);
  };

  const analyzeDisease = async () => {
    if (!image) return;
    setAnalyzing(true);
    setResult(null);
    try {
      const formData = new FormData();
      // @ts-ignore
      formData.append('image', {
        uri: image,
        name: imageName || 'photo.jpg',
        type: 'image/jpeg',
      });
      const response = await api.post('/disease/detect', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setResult(response.data);
    } catch (error: any) {
      console.error('Error analyzing disease:', error);
      Alert.alert('Analysis failed', error?.response?.data?.error || 'Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  // Render severity as colored dots
  const renderSeverityDots = (severity: number) => (
    <View style={{ flexDirection: 'row', marginVertical: 4 }}>
      {[1,2,3,4,5].map(i => (
        <View key={i} style={{ width: 14, height: 14, borderRadius: 7, marginHorizontal: 2, backgroundColor: i <= severity ? '#dc2626' : '#e5e7eb' }} />
      ))}
    </View>
  );

  // Add a function to reset all state (customize as needed)
  const resetState = () => {
    setImage(null);
    setImageName(null);
    setResult(null);
    setAnalyzing(false);
  };

  useFocusEffect(
    useCallback(() => {
      return () => {
        resetState();
      };
    }, [])
  );

  return (
    <View style={[styles.container, { marginTop: 32 }]}> 
      {/* Header with Icon */}
      <View style={styles.headerRow}>
        <MaterialCommunityIcons name="virus-outline" size={28} color="#22c55e" style={{ marginRight: 8 }} />
        <Text style={styles.header}>पिकांची रोग ओळख</Text>
      </View>
      <View style={styles.card}>
        <TouchableOpacity style={styles.imagePickerBtn} onPress={pickImage}>
          <MaterialCommunityIcons name={image ? 'image-edit' : 'image-plus'} size={28} color="#fff" />
          <Text style={styles.imagePickerText}>{image ? 'फोटो बदला' : 'फोटो निवडा'}</Text>
        </TouchableOpacity>
        {image && (
          <View style={{ alignItems: 'center', marginBottom: 12 }}>
            <Image source={{ uri: image }} style={styles.image} />
            <Text style={styles.imageName}>{imageName}</Text>
            <TouchableOpacity style={styles.removeButton} onPress={removeImage}>
              <MaterialIcons name="delete" size={20} color="#dc2626" />
              <Text style={styles.removeButtonText}>फोटो काढा</Text>
            </TouchableOpacity>
          </View>
        )}
        {image && (
          <TouchableOpacity style={styles.analyzeBtn} onPress={analyzeDisease} disabled={analyzing}>
            <MaterialCommunityIcons name="magnify" size={22} color="#fff" />
            <Text style={styles.analyzeBtnText}>{analyzing ? 'विश्लेषण करत आहे...' : 'रोग ओळखा'}</Text>
          </TouchableOpacity>
        )}
        {analyzing && <ActivityIndicator size="large" color="#22c55e" style={{ marginTop: 16 }} />}
      </View>
      {result && (
        <View style={styles.resultCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <MaterialCommunityIcons name="alert-decagram" size={22} color="#dc2626" style={{ marginRight: 6 }} />
            <Text style={styles.resultTitle}>निष्कर्ष</Text>
          </View>
          <View style={styles.resultRow}><MaterialCommunityIcons name="bug-outline" size={18} color="#166534" style={{ marginRight: 4 }} /><Text style={styles.resultLabel}>रोग:</Text><Text style={styles.resultValue}>{result.disease}</Text></View>
          <View style={styles.resultRow}><MaterialCommunityIcons name="circle-slice-5" size={18} color="#dc2626" style={{ marginRight: 4 }} /><Text style={styles.resultLabel}>गंभीरता:</Text>{renderSeverityDots(Number(result.severity))}</View>
          <View style={styles.resultRow}><MaterialCommunityIcons name="percent" size={18} color="#16a34a" style={{ marginRight: 4 }} /><Text style={styles.resultLabel}>विश्वास:</Text><Text style={styles.resultValue}>{result.confidence}%</Text></View>
          <View style={styles.resultRow}><MaterialCommunityIcons name="alert-circle-outline" size={18} color="#b91c1c" style={{ marginRight: 4 }} /><Text style={styles.resultLabel}>लक्षणे:</Text><Text style={styles.resultValue}>{result.symptoms}</Text></View>
          <View style={styles.resultRow}><MaterialCommunityIcons name="medical-bag" size={18} color="#22c55e" style={{ marginRight: 4 }} /><Text style={styles.resultLabel}>उपचार:</Text><Text style={styles.resultValue}>{result.treatment?.join(', ')}</Text></View>
          <View style={styles.resultRow}><MaterialCommunityIcons name="shield-check" size={18} color="#15803d" style={{ marginRight: 4 }} /><Text style={styles.resultLabel}>प्रतिबंध:</Text><Text style={styles.resultValue}>{result.prevention?.join(', ')}</Text></View>
        </View>
      )}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('Dashboard')}>
        <Text style={styles.backButtonText}>{'<'} डॅशबोर्डवर परत जा</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#F9FAF6' },
  backButton: { marginBottom: 16, alignSelf: 'flex-start', backgroundColor: '#e6ffe6', padding: 8, borderRadius: 8 },
  backButtonText: { color: '#166534', fontWeight: 'bold' },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 16, textAlign: 'center', color: '#166534' },
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
  imagePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#22c55e',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  imagePickerText: { color: '#fff', fontWeight: 'bold' },
  image: { width: '100%', height: 200, borderRadius: 12, marginBottom: 8, resizeMode: 'cover' },
  imageName: { color: '#64748b', fontSize: 12, marginBottom: 4 },
  removeButton: { flexDirection: 'row', alignItems: 'center', marginTop: 4, alignSelf: 'center' },
  removeButtonText: { color: '#dc2626', marginLeft: 4, fontWeight: 'bold' },
  analyzeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#166534',
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
  },
  analyzeBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  resultCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginTop: 18,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  resultTitle: { fontWeight: 'bold', fontSize: 18, marginBottom: 8, color: '#166534' },
  resultLabel: { fontWeight: 'bold', marginTop: 8, color: '#166534' },
  resultValue: { color: '#166534', marginBottom: 2 },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
});

export default DiseaseDetector; 