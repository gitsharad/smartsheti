import * as React from 'react';
import { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import DashboardScreen from './screens/DashboardScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import { getToken, deleteToken } from './utils/secureStore';
import { ActivityIndicator, View } from 'react-native';
import DiseaseDetector from './screens/DiseaseDetector';
import FDSS from './screens/FDSS';
import LandReport from './screens/LandReport';
import ChatbotScreen from './screens/ChatbotScreen';

const Stack = createStackNavigator();

export const authEvents = {
  listeners: [] as (() => void)[],
  subscribe(fn: () => void) { this.listeners.push(fn); },
  emit() { this.listeners.forEach(fn => fn()); }
};

function isJwtExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (!payload.exp) return false;
    const now = Math.floor(Date.now() / 1000);
    return payload.exp < now;
  } catch {
    return true;
  }
}

export function useAuthState() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  useEffect(() => {
    const checkAuth = async () => {
      const token = await getToken('accessToken');
      console.log(token);
      {token}
      if (token && !isJwtExpired(token)) {
        setIsAuthenticated(true);
      } else {
        if (token) await deleteToken('accessToken');
        await deleteToken('refreshToken');
        setIsAuthenticated(false);
      }
    };
    checkAuth();
    const listener = () => checkAuth();
    authEvents.subscribe(listener);
    return () => {
      authEvents.listeners = authEvents.listeners.filter(fn => fn !== listener);
    };
  }, []);
  return [isAuthenticated, () => authEvents.emit()] as const;
}

export default function App() {
  const [isAuthenticated, emitAuthEvent] = useAuthState();

  if (isAuthenticated === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#00b300" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            <Stack.Screen name="Dashboard">
              {props => <DashboardScreen {...props} onLogout={emitAuthEvent} />}
            </Stack.Screen>
            <Stack.Screen name="DiseaseDetector" component={DiseaseDetector}/>
            <Stack.Screen name="FDSS" component={FDSS}  />
            <Stack.Screen name="LandReport" component={LandReport}  />
            <Stack.Screen name="Chatbot" component={ChatbotScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login">
              {props => <LoginScreen {...props} onLogin={emitAuthEvent} />}
            </Stack.Screen>
            <Stack.Screen name="Register">
              {props => <RegisterScreen {...props} onRegister={emitAuthEvent} />}
            </Stack.Screen>
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
} 