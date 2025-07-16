import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import api from '../utils/api';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const ChatbotScreen = () => {
  const navigation = useNavigation();
  const [messages, setMessages] = useState([
    { from: 'bot', text: 'नमस्कार! मी तुमचा स्मार्ट कृषी चॅटबोट आहे. तुमचे प्रश्न विचारा.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = { from: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const res = await api.post('/chatbot', { message: userMsg.text });
      const botMsg = { from: 'bot', text: res.data.reply || 'माफ करा, मला समजले नाही.' };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      setMessages(prev => [...prev, { from: 'bot', text: 'सर्व्हरशी संपर्क साधता आला नाही.' }]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#F9FAF6' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
    >
      {/* Header with Close/Back Button */}
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>स्मार्ट कृषी चॅटबोट</Text>
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color="#166534" />
        </TouchableOpacity>
      </View>
      <ScrollView
        ref={scrollViewRef}
        style={{ flex: 1, paddingHorizontal: 16, paddingTop: 8 }}
        contentContainerStyle={{ paddingBottom: 0 }}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        keyboardShouldPersistTaps="handled"
      >
        {messages.map((msg, idx) => (
          <View key={idx} style={[styles.bubble, msg.from === 'user' ? styles.userBubble : styles.botBubble]}>
            <Text style={{ color: msg.from === 'user' ? '#fff' : '#166534', fontSize: 16 }}>{msg.text}</Text>
          </View>
        ))}
        {loading && <ActivityIndicator size="small" color="#22c55e" style={{ marginTop: 8 }} />}
      </ScrollView>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="तुमचा प्रश्न लिहा..."
          onSubmitEditing={sendMessage}
          editable={!loading}
          returnKeyType="send"
        />
        <TouchableOpacity style={styles.sendBtn} onPress={sendMessage} disabled={loading}>
          <Ionicons name="send" size={22} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 48 : 24,
    paddingBottom: 8,
    backgroundColor: '#F9FAF6',
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#166534',
  },
  closeBtn: {
    padding: 4,
    marginLeft: 8,
  },
  bubble: {
    maxWidth: '80%',
    padding: 14,
    borderRadius: 18,
    marginVertical: 6,
    marginHorizontal: 4,
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#22c55e',
    borderBottomRightRadius: 6,
  },
  botBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#e6ffe6',
    borderBottomLeftRadius: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#bbf7d0',
    marginHorizontal: 0,
    marginBottom: 0,
    borderRadius: 16,
    marginLeft: 8,
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  input: {
    flex: 1,
    backgroundColor: '#F9FAF6',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    marginRight: 10,
    fontSize: 16,
  },
  sendBtn: {
    backgroundColor: '#22c55e',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  sendBtnText: { color: '#fff', fontWeight: 'bold' },
});

export default ChatbotScreen; 