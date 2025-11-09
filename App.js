import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { FirebaseService } from './firebase/gameService';

import LoginScreen from './screens/LoginScreen';
import DashboardScreen from './screens/DashboardScreen';
import GameScreen from './screens/GameScreen';
import StandingsScreen from './screens/StandingsScreen';
import AdminPanel from './screens/AdminPanel_new';
import Round2GameScreen from './screens/Round2GameScreen';
import FinalStandingsScreen from './screens/FinalStandingsScreen';

const Stack = createStackNavigator();

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
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <Stack.Navigator
          initialRouteName="Login"
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Dashboard" component={DashboardScreen} />
          <Stack.Screen name="Game" component={GameScreen} />
          <Stack.Screen name="Standings" component={StandingsScreen} />
          <Stack.Screen name="Admin" component={AdminPanel} />
          <Stack.Screen name="Round2Game" component={Round2GameScreen} />
          <Stack.Screen name="FinalStandings" component={FinalStandingsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
