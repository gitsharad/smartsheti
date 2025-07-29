import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Dimensions, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import api, { API_BASE_URL } from '../utils/api';
import { saveToken, deleteToken } from '../utils/secureStore';
import { authEvents } from '../utils/authEvents';

interface LoginScreenProps {
  navigation: any;
  onLogin: () => void;
}

const { width, height } = Dimensions.get('window');

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation, onLogin }) => {
  const [tab, setTab] = useState<'email' | 'phone'>('email');
  // Email/password state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  // Phone/OTP state
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  // Email/password login
  const handleEmailLogin = async () => {
    if (!email || !password) {
      Alert.alert('त्रुटी', 'कृपया सर्व फील्ड भरा');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post(`${API_BASE_URL}/auth/login`, { email, password });
      await saveToken('accessToken', res.data.accessToken);
      await saveToken('refreshToken', res.data.refreshToken);
      Alert.alert('यशस्वी', 'लॉगिन यशस्वी झाले');
      onLogin();
    } catch (err: any) {
      Alert.alert('त्रुटी', err?.response?.data?.message?.english || 'अज्ञात त्रुटी');
    }
    setLoading(false);
  };

  // Phone/OTP login - Coming Soon
  const handleSendOtp = async () => {
    Alert.alert(
      'लवकरच येणार आहे! 🚀',
      'मोबाईल OTP लॉगिन पुढील आवृत्तीत उपलब्ध होईल. सध्या कृपया ईमेल लॉगिन वापरा.',
      [
        { text: 'ईमेल लॉगिन वापरा', onPress: () => setTab('email') },
        { text: 'ठीक आहे', style: 'cancel' }
      ]
    );
  };
  
  const handleVerifyOtp = async () => {
    Alert.alert(
      'लवकरच येणार आहे! 🚀',
      'मोबाईल OTP लॉगिन पुढील आवृत्तीत उपलब्ध होईल. सध्या कृपया ईमेल लॉगिन वापरा.',
      [
        { text: 'ईमेल लॉगिन वापरा', onPress: () => setTab('email') },
        { text: 'ठीक आहे', style: 'cancel' }
      ]
    );
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
            <MaterialCommunityIcons name="sprout" size={60} color="#fff" />
          </View>
          <Text style={styles.appTitle}>स्मार्ट कृषी</Text>
          <Text style={styles.appSubtitle}>Smart Agriculture Companion</Text>
        </View>

        {/* Login Card */}
        <View style={styles.card}>
          <Text style={styles.welcomeText}>स्वागत आहे!</Text>
          <Text style={styles.subtitleText}>तुमच्या खात्यात लॉगिन करा</Text>
          
          {/* Tab Switcher */}
          <View style={styles.tabContainer}>
            <TouchableOpacity 
              style={[styles.tab, tab === 'email' && styles.tabActive]} 
              onPress={() => setTab('email')}
            >
              <Feather name="mail" size={20} color={tab === 'email' ? '#fff' : '#22c55e'} />
              <Text style={[styles.tabText, tab === 'email' && styles.tabTextActive]}>
                ईमेल
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, tab === 'phone' && styles.tabActive]} 
              onPress={() => setTab('phone')}
            >
              <Feather name="phone" size={20} color={tab === 'phone' ? '#fff' : '#22c55e'} />
              <Text style={[styles.tabText, tab === 'phone' && styles.tabTextActive]}>
                फोन
              </Text>
            </TouchableOpacity>
          </View>

          {tab === 'email' ? (
            <View style={styles.form}>
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

              {/* Login Button */}
              <TouchableOpacity 
                style={[styles.loginButton, loading && styles.loginButtonDisabled]} 
                onPress={handleEmailLogin} 
                disabled={loading}
              >
                {loading ? (
                  <Text style={styles.loginButtonText}>लॉगिन करत आहे...</Text>
                ) : (
                  <>
                    <Feather name="log-in" size={20} color="#fff" />
                    <Text style={styles.loginButtonText}>लॉगिन करा</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.form}>
              {/* Coming Soon Message */}
              <View style={styles.comingSoonContainer}>
                <MaterialCommunityIcons name="cellphone-message" size={60} color="#22c55e" />
                <Text style={styles.comingSoonTitle}>मोबाईल OTP लॉगिन</Text>
                <Text style={styles.comingSoonSubtitle}>लवकरच येणार आहे!</Text>
                <Text style={styles.comingSoonDescription}>
                  आम्ही तुम्हाला सुरक्षित मोबाईल OTP लॉगिन आणत आहोत. हे वैशिष्ट्य पुढील आवृत्तीत उपलब्ध होईल.
                </Text>
                <View style={styles.comingSoonFeatures}>
                  <View style={styles.featureItem}>
                    <Feather name="shield" size={16} color="#22c55e" />
                    <Text style={styles.featureText}>सुरक्षित SMS-आधारित प्रमाणीकरण</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Feather name="smartphone" size={16} color="#22c55e" />
                    <Text style={styles.featureText}>त्वरित एक-टॅप लॉगिन</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Feather name="lock" size={16} color="#22c55e" />
                    <Text style={styles.featureText}>वाढीव सुरक्षा</Text>
                  </View>
                </View>
                <TouchableOpacity 
                  style={styles.useEmailButton} 
                  onPress={() => setTab('email')}
                >
                  <Feather name="mail" size={20} color="#fff" />
                  <Text style={styles.useEmailButtonText}>ईमेल लॉगिन वापरा</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Register Link */}
          <View style={styles.registerSection}>
            <Text style={styles.registerText}>खाते नाही? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerLink}>नोंदणी करा</Text>
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#22c55e',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  tabText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#22c55e',
  },
  tabTextActive: {
    color: '#fff',
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
  loginButton: {
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
  loginButtonDisabled: {
    backgroundColor: '#9ca3af',
    shadowOpacity: 0,
    elevation: 0,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  registerSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  registerText: {
    fontSize: 16,
    color: '#6b7280',
  },
  registerLink: {
    fontSize: 16,
    color: '#22c55e',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  debugButton: {
    backgroundColor: '#ef4444',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  debugButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  comingSoonContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 24,
  },
  comingSoonTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#166534',
    marginTop: 16,
    marginBottom: 8,
  },
  comingSoonSubtitle: {
    fontSize: 18,
    color: '#22c55e',
    fontWeight: 'bold',
    marginBottom: 12,
  },
  comingSoonDescription: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  comingSoonFeatures: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
    width: '100%',
  },
  featureItem: {
    alignItems: 'center',
  },
  featureText: {
    fontSize: 14,
    color: '#374151',
    marginTop: 8,
    textAlign: 'center',
  },
  useEmailButton: {
    backgroundColor: '#22c55e',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 28,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  useEmailButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default LoginScreen; 