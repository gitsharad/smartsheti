import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Dimensions, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import api from '../utils/api';
import { saveToken } from '../utils/secureStore';

interface RegisterScreenProps {
  navigation: any;
  onRegister: () => void;
}

const { width, height } = Dimensions.get('window');

const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation, onRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('त्रुटी', 'कृपया सर्व फील्ड भरा');
      return;
    }
    
    if (password !== confirmPassword) {
      Alert.alert('त्रुटी', 'पासवर्ड जुळत नाही');
      return;
    }
    
    if (password.length < 6) {
      Alert.alert('त्रुटी', 'पासवर्ड किमान 6 अक्षरे असले पाहिजे');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/register', { email, password, name });
      await saveToken('accessToken', res.data.accessToken);
      await saveToken('refreshToken', res.data.refreshToken);
      Alert.alert('यशस्वी', 'नोंदणी यशस्वी झाली');
      onRegister();
    } catch (err: any) {
      Alert.alert('त्रुटी', err?.response?.data?.message?.english || 'अज्ञात त्रुटी');
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Background with gradient-like effect */}
        <View style={styles.backgroundGradient}>
          <View style={styles.gradientOverlay} />
        </View>
        
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.logoContainer}>
            <MaterialCommunityIcons name="account-plus" size={60} color="#fff" />
          </View>
          <Text style={styles.appTitle}>नवीन खाते</Text>
          <Text style={styles.appSubtitle}>स्मार्ट कृषी साथीदार</Text>
        </View>

        {/* Register Card */}
        <View style={styles.card}>
          <Text style={styles.welcomeText}>नोंदणी करा</Text>
          <Text style={styles.subtitleText}>तुमचे खाते तयार करा</Text>
          
          <View style={styles.form}>
            {/* Name Input */}
            <View style={styles.inputContainer}>
              <Feather name="user" size={20} color="#22c55e" style={styles.inputIcon} />
              <TextInput 
                style={styles.input} 
                placeholder="पूर्ण नाव" 
                value={name} 
                onChangeText={setName}
                placeholderTextColor="#9ca3af"
              />
            </View>

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Feather name="mail" size={20} color="#22c55e" style={styles.inputIcon} />
              <TextInput 
                style={styles.input} 
                placeholder="ईमेल पत्ता" 
                value={email} 
                onChangeText={setEmail} 
                autoCapitalize="none" 
                keyboardType="email-address"
                placeholderTextColor="#9ca3af"
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Feather name="lock" size={20} color="#22c55e" style={styles.inputIcon} />
              <TextInput 
                style={styles.input} 
                placeholder="पासवर्ड" 
                value={password} 
                onChangeText={setPassword} 
                secureTextEntry={!showPassword}
                placeholderTextColor="#9ca3af"
              />
              <TouchableOpacity 
                style={styles.eyeIcon} 
                onPress={() => setShowPassword(!showPassword)}
              >
                <Feather name={showPassword ? "eye-off" : "eye"} size={20} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputContainer}>
              <Feather name="lock" size={20} color="#22c55e" style={styles.inputIcon} />
              <TextInput 
                style={styles.input} 
                placeholder="पासवर्ड पुन्हा भरा" 
                value={confirmPassword} 
                onChangeText={setConfirmPassword} 
                secureTextEntry={!showConfirmPassword}
                placeholderTextColor="#9ca3af"
              />
              <TouchableOpacity 
                style={styles.eyeIcon} 
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Feather name={showConfirmPassword ? "eye-off" : "eye"} size={20} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            {/* Register Button */}
            <TouchableOpacity 
              style={[styles.registerButton, loading && styles.registerButtonDisabled]} 
              onPress={handleRegister} 
              disabled={loading}
            >
              {loading ? (
                <Text style={styles.registerButtonText}>नोंदणी करत आहे...</Text>
              ) : (
                <>
                  <Feather name="user-plus" size={20} color="#fff" />
                  <Text style={styles.registerButtonText}>नोंदणी करा</Text>
                </>
              )}
      </TouchableOpacity>
          </View>

          {/* Login Link */}
          <View style={styles.loginSection}>
            <Text style={styles.loginText}>आधीपासून खाते आहे? </Text>
      <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.loginLink}>लॉगिन करा</Text>
      </TouchableOpacity>
    </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAF6',
  },
  scrollContainer: {
    flexGrow: 1,
    minHeight: height,
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.4,
    backgroundColor: '#22c55e',
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(22, 163, 74, 0.8)',
  },
  headerSection: {
    alignItems: 'center',
    paddingTop: height * 0.08,
    paddingBottom: 40,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  appSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 24,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 12,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#166534',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  form: {
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
    paddingVertical: 16,
  },
  eyeIcon: {
    padding: 4,
  },
  registerButton: {
    backgroundColor: '#22c55e',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  registerButtonDisabled: {
    backgroundColor: '#9ca3af',
    shadowOpacity: 0,
    elevation: 0,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  loginSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  loginText: {
    fontSize: 16,
    color: '#6b7280',
  },
  loginLink: {
    fontSize: 16,
    color: '#22c55e',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});

export default RegisterScreen; 