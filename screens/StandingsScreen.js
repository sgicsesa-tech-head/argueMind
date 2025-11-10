import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme, shadows, typography } from '../theme';
import { FirebaseService } from '../firebase/gameService';
import { useFirebase } from '../hooks/useFirebase';

const StandingsScreen = ({ navigation, route }) => {
  const { round = 1, isAdmin = false } = route.params || {};
  const { user } = useFirebase();
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    // Subscribe to real-time updates for standings with the appropriate round
    const unsubscribe = FirebaseService.subscribeToLeaderboard(round, (users) => {
      processStandings(users);
      setLoading(false);
      setRefreshing(false);
    });

    // Load the current user's profile separately
    if (user && !isAdmin) {
      loadUserProfile();
    }

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [round, user, isAdmin]);

  const processStandings = (users) => {
    // Filter out admins and sort by the appropriate round score
    const filteredUsers = users.filter(u => !u.isAdmin);
    
    let sortedUsers;
    if (round === 1) {
      sortedUsers = filteredUsers.sort((a, b) => (b.round1Score || 0) - (a.round1Score || 0));
    } else if (round === 2) {
      // Round 2 standings show only R2 scores for qualified users
      sortedUsers = filteredUsers
        .filter(user => user.qualified)
        .sort((a, b) => (b.round2Score || 0) - (a.round2Score || 0));
    } else {
      // Final standings - total score
      sortedUsers = filteredUsers.sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0));
    }

    // Add rank to each user
    const rankedUsers = sortedUsers.map((userData, index) => ({
      ...userData,
      rank: index + 1,
      isCurrentUser: userData.uid === user?.uid
    }));

    setStandings(rankedUsers);
  };

  const loadUserProfile = async () => {
    if (user) {
      try {
        const profile = await FirebaseService.getUserProfile(user.uid);
        if (profile.success) {
          setUserProfile(profile.data);
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
      }
    }
  };

  const handleRefreshStandings = async () => {
    setRefreshing(true);
    try {
      // Force re-fetch from Firestore and update qualifications
      const result = await FirebaseService.getAllUsers();
      if (result.success) {
        const nonAdminUsers = result.users.filter(u => !u.isAdmin);
        
        // If this is Round 1 standings, calculate and update qualifications
        if (round === 1 && isAdmin) {
          await FirebaseService.updateQualificationsBasedOnRound1Scores(nonAdminUsers);
        }
        
        // Fetch updated data after qualification update
        const updatedResult = await FirebaseService.getAllUsers();
        if (updatedResult.success) {
          processStandings(updatedResult.users.filter(u => !u.isAdmin));
        }
      }
    } catch (error) {
      console.error('Error refreshing standings:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const getRankColor = (rank) => {
    switch (rank) {
      case 1: return '#f1c40f'; // Gold
      case 2: return '#95a5a6'; // Silver
      case 3: return '#cd7f32'; // Bronze
      default: return '#7f8c8d';
    }
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `${rank}`;
    }
  };

  const getScoreToShow = (player) => {
    if (round === 1) return player.round1Score || 0;
    if (round === 2) return player.round2Score || 0; // Only R2 score
    return player.totalScore || 0;
  };

  const getStandingsTitle = () => {
    if (round === 1) return 'Round 1 Standings';
    if (round === 2) return 'Round 2 Standings';
    return 'Final Standings';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingText}>Loading standings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{getStandingsTitle()}</Text>
        {isAdmin && (
          <TouchableOpacity 
            style={[styles.refreshButton, refreshing && styles.refreshButtonDisabled]}
            onPress={handleRefreshStandings}
            disabled={refreshing}
          >
            <Text style={styles.refreshButtonText}>
              {refreshing ? '🔄 Refreshing...' : '🔄 Refresh Scores'}
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* User's Current Position (if not admin) */}
        {!isAdmin && userProfile && (
          <View style={styles.userStatsContainer}>
            <Text style={styles.userStatsTitle}>Your Performance</Text>
            <View style={styles.userStatsRow}>
              <Text style={styles.userStatsLabel}>Current Rank:</Text>
              <Text style={styles.userStatsValue}>
                #{standings.find(s => s.uid === user.uid)?.rank || 'N/A'}
              </Text>
            </View>
            <View style={styles.userStatsRow}>
              <Text style={styles.userStatsLabel}>Points:</Text>
              <Text style={styles.userStatsValue}>{getScoreToShow(userProfile)}</Text>
            </View>
          </View>
        )}

        <View style={styles.standingsContainer}>
          {standings.length > 0 ? standings.map((player) => (
            <View 
              key={player.rank} 
              style={[
                styles.playerRow,
                player.isCurrentUser && styles.currentUserRow
              ]}
            >
              <View style={styles.rankContainer}>
                <Text style={[styles.rankText, { color: getRankColor(player.rank) }]}>
                  {getRankIcon(player.rank)}
                </Text>
              </View>
              
              <View style={styles.playerInfo}>
                <Text style={[
                  styles.playerName,
                  player.isCurrentUser && styles.currentUserText
                ]}>
                  {player.teamName || 'Anonymous'}
                </Text>
              </View>
              
              <View style={styles.pointsContainer}>
                <Text style={[
                  styles.playerPoints,
                  player.isCurrentUser && styles.currentUserText
                ]}>
                  {getScoreToShow(player)} pts
                </Text>
              </View>
            </View>
          )) : (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>No standings data available</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.navigate('Dashboard')}
        >
          <Text style={styles.backButtonText}>Back to Dashboard</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: theme.textSecondary,
    marginTop: 10,
    fontSize: 16,
  },
  userStatsContainer: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 20,
    margin: 20,
    ...shadows.medium,
  },
  userStatsTitle: {
    ...typography.h3,
    marginBottom: 15,
    textAlign: 'center',
  },
  userStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 5,
  },
  userStatsLabel: {
    ...typography.body,
    color: theme.textSecondary,
  },
  userStatsValue: {
    ...typography.body,
    fontWeight: 'bold',
    color: theme.primary,
  },
  noDataContainer: {
    padding: 40,
    alignItems: 'center',
  },
  noDataText: {
    ...typography.body,
    color: theme.textSecondary,
    fontStyle: 'italic',
  },
  header: {
    backgroundColor: theme.surface,
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    alignItems: 'center',
  },
  headerTitle: {
    ...typography.h2,
    fontSize: 24,
    marginBottom: 10,
  },
  refreshButton: {
    backgroundColor: theme.success,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginBottom: 10,
    ...shadows.small,
  },
  refreshButtonDisabled: {
    backgroundColor: theme.textSecondary,
    opacity: 0.6,
  },
  refreshButtonText: {
    color: theme.textInverse,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  standingsContainer: {
    marginTop: 20,
  },
  playerRow: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.small,
  },
  currentUserRow: {
    backgroundColor: theme.surfaceElevated,
    borderWidth: 2,
    borderColor: theme.primary,
  },
  rankContainer: {
    width: 50,
    alignItems: 'center',
  },
  rankText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  playerInfo: {
    flex: 1,
    marginLeft: 15,
  },
  playerName: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.textPrimary,
  },
  currentUserText: {
    color: theme.primary,
    fontWeight: 'bold',
  },
  pointsContainer: {
    alignItems: 'flex-end',
  },
  playerPoints: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.success,
  },
  footer: {
    padding: 20,
    backgroundColor: theme.surface,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  backButton: {
    backgroundColor: theme.primary,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    paddingHorizontal: 20,
    ...shadows.small,
  },
  backButtonText: {
    color: theme.textInverse,
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default StandingsScreen;
