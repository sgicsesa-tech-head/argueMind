import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme, shadows, typography } from '../theme';

const DashboardScreen = ({ navigation }) => {
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          onPress: () => navigation.navigate('Login'),
        },
      ]
    );
  };



  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
            <Text style={styles.welcomeText}>Team Name</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.intro}>
        <Image style={styles.logo} source={require('../assets/csesa.png')} />
        <Text style={styles.welcomeText}>Welcome to Argue Mind</Text>
      </View>
      <View style={styles.content}>
        <TouchableOpacity 
          style={styles.roundButton}
          onPress={() => navigation.navigate('Game', { roundNumber: 1 })}
        >
          <Text style={styles.roundButtonText}>Round 1</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.roundButton}
          onPress={() => navigation.navigate('Round2Game')}
        >
          <Text style={styles.roundButtonText}>Round 2</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: theme.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  welcomeText: {
    ...typography.h2,
  },
  logo: {
    marginBottom: 10,
    width: 250,
    height: 250,
  },
  logoutButton: {
    backgroundColor: theme.error,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    ...shadows.small,
  },
  logoutButtonText: {
    color: theme.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  intro: {
    alignItems: 'center',
    marginTop: 50,
    marginBottom: -25,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    alignItems: 'center',
    height: "50%"
  },
  roundButton: {
    width: "75%",
    height: '15%',
    backgroundColor: theme.primary,
    borderRadius: 8,
    paddingVertical: 15,
    paddingHorizontal: 30,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.medium,
  },
  roundButtonText: {
    color: theme.textPrimary,
    fontSize: 20,
    fontWeight: 'bold',
  },
});

export default DashboardScreen;
