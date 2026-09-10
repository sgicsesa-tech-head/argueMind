import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { FirebaseService } from './firebase/gameService';

import LoginScreen from './screens/LoginScreen';
import DashboardScreen from './screens/DashboardScreen';
import GameScreen from './screens/GameScreen';
import StandingsScreen from './screens/StandingsScreen';
import AdminPanel from './screens/AdminPanel_new';
import Round2GameScreen from './screens/Round2GameScreen';

const Stack = createStackNavigator();

const linking = {
  prefixes: ['/', 'http://localhost:8081', 'https://arguemind.vercel.app'],
  config: {
    screens: {
      Login: '',
      Dashboard: 'dashboard',
      Game: 'game',
      Standings: 'standings',
      Admin: 'admin',
      Round2Game: 'round2',
    },
  },
};

export default function App() {
  useEffect(() => {
    // Initialize Firebase app with timer management
    FirebaseService.initialize().catch(console.error);
    
    // Cleanup on app unmount
    return () => {
      FirebaseService.cleanup();
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer linking={linking}>
          <StatusBar style="light" />
          <Stack.Navigator
            initialRouteName="Login"
            screenOptions={{
              headerShown: false,
              cardStyle: { flex: 1 },
            }}
          >
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Dashboard" component={DashboardScreen} />
            <Stack.Screen name="Game" component={GameScreen} />
            <Stack.Screen name="Standings" component={StandingsScreen} />
            <Stack.Screen name="Admin" component={AdminPanel} />
            <Stack.Screen name="Round2Game" component={Round2GameScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
