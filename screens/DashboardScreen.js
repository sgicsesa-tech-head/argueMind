import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme, shadows, typography } from '../theme';
import { FirebaseService } from '../firebase/gameService';
import { useFirebase } from '../hooks/useFirebase';

const DashboardScreen = ({ navigation }) => {
  const { user, userData, gameState, loading: firebaseLoading, logout } = useFirebase();

  // Redirect to Login if no active user session
  useEffect(() => {
    if (!firebaseLoading && !user) {
      navigation.replace('Login');
    }
  }, [user, firebaseLoading, navigation]);

  const userProfile = userData || user;

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to leave this team session?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          onPress: async () => {
            if (logout) {
              await logout();
            } else {
              await FirebaseService.signOut();
            }
            navigation.replace('Login');
          },
        },
      ]
    );
  };

  const handleRound1Press = () => {
    if (gameState?.round1Active) {
      navigation.navigate('Game', { roundNumber: 1 });
    } else {
      Alert.alert('Round 1', 'Round 1 is not currently active. Please wait for the admin to start the round.');
    }
  };

  const handleRound2Press = () => {
    if (gameState?.round2Active) {
      if (userProfile?.qualified) {
        navigation.navigate('Round2Game');
      } else {
        Alert.alert('Round 2', 'You are not qualified for Round 2. Only top teams from Round 1 can participate.');
      }
    } else {
      Alert.alert('Round 2', 'Round 2 is not currently active. Please wait for the admin to start the round.');
    }
  };

  if (firebaseLoading && !userProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }



  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>{userProfile?.teamName || 'Team'}</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.intro}>
          <Image style={styles.logo} source={require('../assets/csesa.png')} />
          <Text style={styles.welcomeText}>Welcome to ArgueMind</Text>
          <Text style={styles.subtitleText}>
            {gameState?.gameStarted ? 'Game is in progress' : 'Waiting for game to start...'}
          </Text>
        </View>

        {userProfile && (
          <View style={styles.statsContainer}>
            <Text style={styles.statsTitle}>Your Stats</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Round 1 Score</Text>
                <Text style={styles.statValue}>{userProfile.round1Score || 0}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Round 2 Score</Text>
                <Text style={styles.statValue}>{userProfile.round2Score || 0}</Text>
              </View>
            </View>
            {userProfile.qualified && (
              <View style={styles.qualifiedBadge}>
                <Text style={styles.qualifiedText}>✓ Qualified for Round 2</Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.content}>
          <TouchableOpacity 
            style={[
              styles.roundButton, 
              !gameState?.round1Active && styles.disabledButton
            ]}
            onPress={handleRound1Press}
            disabled={!gameState?.round1Active}
          >
            <Text style={[
              styles.roundButtonText,
              !gameState?.round1Active && styles.disabledButtonText
            ]}>
              Round 1: Word Challenge
            </Text>
            <Text style={[
              styles.roundSubtext,
              !gameState?.round1Active && styles.disabledButtonText
            ]}>
              {gameState?.round1Active ? 'Active - Tap to join' : 'Waiting for admin to start'}
            </Text>
          </TouchableOpacity>

          {/* View Round 1 Standings Button - Only show when round 1 is complete */}
          {!gameState?.round1Active && gameState?.currentRound >= 2 && (
            <TouchableOpacity 
              style={styles.standingsButton}
              onPress={() => navigation.navigate('Standings', { round: 1, isAdmin: false })}
            >
              <Text style={styles.standingsButtonText}>📊 View Round 1 Standings</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={[
              styles.roundButton,
              (!gameState?.round2Active || !userProfile?.qualified) && styles.disabledButton
            ]}
            onPress={handleRound2Press}
            disabled={!gameState?.round2Active || !userProfile?.qualified}
          >
            <Text style={[
              styles.roundButtonText,
              (!gameState?.round2Active || !userProfile?.qualified) && styles.disabledButtonText
            ]}>
              Round 2: Quiz Battle
            </Text>
            <Text style={[
              styles.roundSubtext,
              (!gameState?.round2Active || !userProfile?.qualified) && styles.disabledButtonText
            ]}>
              {!userProfile?.qualified ? 'Qualify in Round 1 first' : 
               gameState?.round2Active ? 'Active - Tap to join' : 'Waiting for admin to start'}
            </Text>
          </TouchableOpacity>

          {/* Show Eliminated Message for users who didn't qualify */}
          {!userProfile?.qualified && !gameState?.round1Active && gameState?.currentRound >= 2 && (
            <View style={styles.eliminatedContainer}>
              <Text style={styles.eliminatedText}>❌ Not Qualified for Round 2</Text>
              <Text style={styles.eliminatedSubtext}>
                Only top 10-15 teams from Round 1 advance to Round 2
              </Text>
            </View>
          )}

          {/* View Round 2 Standings Button - Only show when round 2 is complete */}
          {!gameState?.round2Active && gameState?.gameEnded && userProfile?.qualified && (
            <TouchableOpacity 
              style={styles.standingsButton}
              onPress={() => navigation.navigate('Standings', { round: 2, isAdmin: false })}
            >
              <Text style={styles.standingsButtonText}>📊 View Round 2 Standings</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    marginTop: 10,
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
  scrollView: {
    flex: 1,
  },
  welcomeText: {
    ...typography.h2,
  },
  subtitleText: {
    ...typography.caption,
    textAlign: 'center',
    marginTop: 5,
  },
  intro: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  logo: {
    width: 250,
    height: 250,
    marginBottom: 20,
  },
  statsContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 20,
    ...shadows.medium,
  },
  statsTitle: {
    ...typography.h3,
    marginBottom: 15,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    ...typography.caption,
    marginBottom: 5,
  },
  statValue: {
    ...typography.h3,
    color: theme.primary,
  },
  qualifiedBadge: {
    marginTop: 15,
    backgroundColor: theme.success,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'center',
  },
  qualifiedText: {
    color: theme.textPrimary,
    fontWeight: '600',
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
  content: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  roundButton: {
    backgroundColor: theme.primary,
    borderRadius: 15,
    paddingVertical: 20,
    paddingHorizontal: 20,
    marginVertical: 10,
    alignItems: 'center',
    ...shadows.large,
  },
  disabledButton: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    ...shadows.small,
  },
  roundButtonText: {
    color: theme.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  roundSubtext: {
    color: theme.textSecondary,
    fontSize: 14,
  },
  disabledButtonText: {
    color: theme.textMuted,
  },
  eliminatedContainer: {
    backgroundColor: theme.error + '30',
    borderRadius: 12,
    padding: 20,
    marginVertical: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.error,
  },
  eliminatedText: {
    color: theme.error,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  eliminatedSubtext: {
    color: theme.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
  standingsButton: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    paddingVertical: 15,
    marginTop: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
    ...shadows.small,
  },
  standingsButtonText: {
    color: theme.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DashboardScreen;
