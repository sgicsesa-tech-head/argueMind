import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import LoginScreen from './screens/LoginScreen';
import DashboardScreen from './screens/DashboardScreen';
import GameScreen from './screens/GameScreen';
import StandingsScreen from './screens/StandingsScreen';
import AdminPanel from './screens/AdminPanel';
import Round2GameScreen from './screens/Round2GameScreen';
import FinalStandingsScreen from './screens/FinalStandingsScreen';

const Stack = createStackNavigator();

export default function App() {
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
