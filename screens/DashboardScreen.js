import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
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
      'Leave Session',
      'Are you sure you want to switch or leave your team session?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
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
      Alert.alert('Round 1', 'Round 1 is not currently active. Please wait for the host to begin.');
    }
  };

  const handleRound2Press = () => {
    if (gameState?.round2Active) {
      if (userProfile?.qualified) {
        navigation.navigate('Round2Game');
      } else {
        Alert.alert('Round 2', 'You are not qualified for Round 2. Only top teams from Round 1 advance.');
      }
    } else {
      Alert.alert('Round 2', 'Round 2 is not currently active. Please wait for the host to begin.');
    }
  };

  if (firebaseLoading && !userProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingText}>Loading Dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Top App Bar */}
      <View style={styles.header}>
        <View style={styles.teamBadge}>
          <Ionicons name="people" size={16} color={theme.primaryLight} style={{ marginRight: 8 }} />
          <Text style={styles.teamNameText} numberOfLines={1}>
            {userProfile?.teamName || 'Team'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="log-out-outline" size={18} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.logoWrapper}>
            <Image
              style={styles.logo}
              source={require('../assets/csesa.png')}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.heroTitle}>CSE Induction</Text>
          <View style={styles.statusIndicator}>
            <View
              style={[
                styles.statusDot,
                gameState?.gameStarted ? styles.statusDotActive : styles.statusDotInactive,
              ]}
            />
            <Text style={styles.statusText}>
              {gameState?.round1Active
                ? 'Round 1 Active'
                : gameState?.round2Active
                ? 'Round 2 Active'
                : gameState?.gameEnded
                ? 'Event Concluded'
                : 'Standby for Round 1'}
            </Text>
          </View>
        </View>

        {/* User Stats Card */}
        {userProfile && (
          <View style={styles.statsCard}>
            <Text style={styles.cardHeaderTitle}>Your Performance</Text>
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <View style={styles.statIconWrapper}>
                  <Ionicons name="pencil-outline" size={16} color={theme.primaryLight} />
                </View>
                <Text style={styles.statLabel}>Round 1</Text>
                <Text style={styles.statValue}>{userProfile.round1Score || 0}</Text>
                <Text style={styles.statUnit}>pts</Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statBox}>
                <View style={styles.statIconWrapper}>
                  <Ionicons name="flash-outline" size={16} color={theme.warning} />
                </View>
                <Text style={styles.statLabel}>Round 2</Text>
                <Text style={styles.statValue}>{userProfile.round2Score || 0}</Text>
                <Text style={styles.statUnit}>pts</Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statBox}>
                <View style={styles.statIconWrapper}>
                  <Ionicons name="trophy-outline" size={16} color={theme.success} />
                </View>
                <Text style={styles.statLabel}>Total</Text>
                <Text style={styles.statValue}>
                  {(userProfile.round1Score || 0) + (userProfile.round2Score || 0)}
                </Text>
                <Text style={styles.statUnit}>pts</Text>
              </View>
            </View>

            {userProfile.qualified && (
              <View style={styles.qualifiedBadge}>
                <Ionicons name="checkmark-circle" size={16} color={theme.success} style={{ marginRight: 6 }} />
                <Text style={styles.qualifiedText}>Qualified for Round 2</Text>
              </View>
            )}
          </View>
        )}

        {/* Round Play Cards */}
        <View style={styles.roundsContainer}>
          <Text style={styles.sectionTitle}>Competition Rounds</Text>

          {/* Round 1 Card */}
          <TouchableOpacity
            style={[
              styles.roundCard,
              !gameState?.round1Active && styles.roundCardDisabled,
              gameState?.round1Active && styles.roundCardActive,
            ]}
            onPress={handleRound1Press}
            disabled={!gameState?.round1Active}
            activeOpacity={0.8}
          >
            <View style={styles.roundIconContainer}>
              <Ionicons
                name="text-outline"
                size={24}
                color={gameState?.round1Active ? theme.textPrimary : theme.textMuted}
              />
            </View>
            <View style={styles.roundInfo}>
              <View style={styles.roundHeaderRow}>
                <Text style={[styles.roundTitle, !gameState?.round1Active && styles.textMuted]}>
                  Round 1: Word Challenge
                </Text>
                {gameState?.round1Active && (
                  <View style={styles.liveChip}>
                    <Text style={styles.liveChipText}>LIVE</Text>
                  </View>
                )}
              </View>
              <Text style={styles.roundDescription}>
                {gameState?.round1Active
                  ? 'Active now — Tap to join and submit answers'
                  : 'Word challenge will unlock when host starts Round 1'}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={gameState?.round1Active ? theme.primary : theme.textMuted}
            />
          </TouchableOpacity>

          {/* Round 2 Card */}
          <TouchableOpacity
            style={[
              styles.roundCard,
              (!gameState?.round2Active || !userProfile?.qualified) && styles.roundCardDisabled,
              gameState?.round2Active && userProfile?.qualified && styles.roundCardActive,
            ]}
            onPress={handleRound2Press}
            disabled={!gameState?.round2Active || !userProfile?.qualified}
            activeOpacity={0.8}
          >
            <View style={styles.roundIconContainer}>
              <Ionicons
                name="flash-outline"
                size={24}
                color={
                  gameState?.round2Active && userProfile?.qualified
                    ? theme.warning
                    : theme.textMuted
                }
              />
            </View>
            <View style={styles.roundInfo}>
              <View style={styles.roundHeaderRow}>
                <Text
                  style={[
                    styles.roundTitle,
                    (!gameState?.round2Active || !userProfile?.qualified) && styles.textMuted,
                  ]}
                >
                  Round 2: Quiz Battle
                </Text>
                {gameState?.round2Active && userProfile?.qualified && (
                  <View style={[styles.liveChip, { backgroundColor: theme.warning + '30' }]}>
                    <Text style={[styles.liveChipText, { color: theme.warning }]}>LIVE</Text>
                  </View>
                )}
              </View>
              <Text style={styles.roundDescription}>
                {!userProfile?.qualified && gameState?.currentRound >= 2
                  ? 'Only qualified teams can enter Round 2'
                  : gameState?.round2Active
                  ? 'Fast-paced buzzer showdown — Tap to join'
                  : 'Fast-paced live buzzer showdown for top teams'}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={
                gameState?.round2Active && userProfile?.qualified
                  ? theme.warning
                  : theme.textMuted
              }
            />
          </TouchableOpacity>

          {/* Elimination notice if user didn't qualify */}
          {!userProfile?.qualified && !gameState?.round1Active && gameState?.currentRound >= 2 && (
            <View style={styles.eliminationCard}>
              <Ionicons name="information-circle-outline" size={20} color={theme.textSecondary} style={{ marginRight: 10 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.eliminationTitle}>Round 1 Finished</Text>
                <Text style={styles.eliminationSubtext}>
                  Only qualified teams advance to Round 2. Thank you for participating!
                </Text>
              </View>
            </View>
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
    marginTop: 12,
    color: theme.textSecondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: theme.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  teamBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surfaceElevated,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.border,
    maxWidth: '75%',
  },
  teamNameText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textPrimary,
  },
  logoutButton: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: theme.surfaceElevated,
    borderWidth: 1,
    borderColor: theme.border,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  heroSection: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  logoWrapper: {
    width: 100,
    height: 100,
    borderRadius: 24,
    backgroundColor: theme.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: theme.border,
    ...shadows.medium,
  },
  logo: {
    width: 80,
    height: 80,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: theme.textPrimary,
    letterSpacing: 0.3,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusDotActive: {
    backgroundColor: theme.success,
  },
  statusDotInactive: {
    backgroundColor: theme.textMuted,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.textSecondary,
  },
  statsCard: {
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 20,
    backgroundColor: theme.surface,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: theme.border,
    ...shadows.small,
  },
  cardHeaderTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 14,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statIconWrapper: {
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: theme.textSecondary,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.textPrimary,
  },
  statUnit: {
    fontSize: 10,
    color: theme.textMuted,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: theme.border,
  },
  qualifiedBadge: {
    marginTop: 14,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: theme.success + '20',
    borderWidth: 1,
    borderColor: theme.success + '40',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
  },
  qualifiedText: {
    color: theme.success,
    fontSize: 12,
    fontWeight: '600',
  },
  roundsContainer: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textPrimary,
    marginBottom: 12,
  },
  roundCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.border,
    ...shadows.small,
  },
  roundCardActive: {
    borderColor: theme.primary,
    backgroundColor: theme.surfaceElevated,
  },
  roundCardDisabled: {
    opacity: 0.6,
  },
  roundIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: theme.inputBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  roundInfo: {
    flex: 1,
  },
  roundHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  roundTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.textPrimary,
  },
  liveChip: {
    backgroundColor: theme.success + '30',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 8,
  },
  liveChipText: {
    fontSize: 9,
    fontWeight: '700',
    color: theme.success,
  },
  roundDescription: {
    fontSize: 12,
    color: theme.textSecondary,
    lineHeight: 16,
  },
  textMuted: {
    color: theme.textMuted,
  },
  eliminationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderRadius: 14,
    padding: 14,
    marginTop: 6,
    borderWidth: 1,
    borderColor: theme.border,
  },
  eliminationTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.textPrimary,
    marginBottom: 2,
  },
  eliminationSubtext: {
    fontSize: 11,
    color: theme.textSecondary,
    lineHeight: 15,
  },
});

export default DashboardScreen;
