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
import { Ionicons } from '@expo/vector-icons';
import { theme, shadows, typography } from '../theme';
import { FirebaseService } from '../firebase/gameService';
import { useFirebase } from '../hooks/useFirebase';

const StandingsScreen = ({ navigation, route }) => {
  const { round = 1, isAdmin = false } = route.params || {};
  const { user, userData } = useFirebase();
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const userProfile = userData || user;

  useEffect(() => {
    // Subscribe to real-time updates for standings with the appropriate round
    const unsubscribe = FirebaseService.subscribeToLeaderboard(round, (users) => {
      processStandings(users);
      setLoading(false);
      setRefreshing(false);
    });

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

  const handleRefreshStandings = async () => {
    setRefreshing(true);
    try {
      const result = await FirebaseService.getAllUsers();
      if (result.success) {
        const nonAdminUsers = result.users.filter(u => !u.isAdmin);
        processStandings(nonAdminUsers);
      }
    } catch (error) {
      console.error('Error refreshing standings:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const renderRankBadge = (rank) => {
    if (rank === 1) {
      return <Ionicons name="trophy" size={22} color="#f59e0b" />;
    }
    if (rank === 2) {
      return <Ionicons name="medal" size={22} color="#94a3b8" />;
    }
    if (rank === 3) {
      return <Ionicons name="medal" size={22} color="#d97706" />;
    }
    return <Text style={styles.rankNumberText}>#{rank}</Text>;
  };

  const getScoreToShow = (player) => {
    if (round === 1) return player.round1Score || 0;
    if (round === 2) return player.round2Score || 0;
    return player.totalScore || 0;
  };

  const getStandingsTitle = () => {
    if (round === 1) return 'Round 1 Leaderboard';
    if (round === 2) return 'Round 2 Leaderboard';
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={20} color={theme.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>CSE Induction</Text>
          <Text style={styles.headerSubtitle}>{getStandingsTitle()}</Text>
        </View>

        {isAdmin ? (
          <TouchableOpacity 
            style={[styles.refreshIconBtn, refreshing && { opacity: 0.5 }]}
            onPress={handleRefreshStandings}
            disabled={refreshing}
          >
            <Ionicons name="refresh" size={20} color={theme.primary} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* User's Current Position (if not admin) */}
        {!isAdmin && userProfile && (
          <View style={styles.userStatsContainer}>
            <View style={styles.userStatsHeader}>
              <Ionicons name="person" size={16} color={theme.primary} style={{ marginRight: 8 }} />
              <Text style={styles.userStatsTitle}>Your Standing</Text>
            </View>
            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Current Rank</Text>
                <Text style={styles.statValue}>
                  #{standings.find(s => s.uid === user?.uid)?.rank || '—'}
                </Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Total Points</Text>
                <Text style={[styles.statValue, { color: theme.accent }]}>
                  {getScoreToShow(userProfile)}
                </Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.standingsContainer}>
          {standings.length > 0 ? (
            standings.map((player) => (
              <View 
                key={player.uid || player.rank} 
                style={[
                  styles.playerRow,
                  player.isCurrentUser && styles.currentUserRow
                ]}
              >
                <View style={styles.rankContainer}>
                  {renderRankBadge(player.rank)}
                </View>
                
                <View style={styles.playerInfo}>
                  <Text 
                    style={[
                      styles.playerName,
                      player.isCurrentUser && styles.currentUserText
                    ]}
                    numberOfLines={1}
                  >
                    {player.teamName || 'Team'}
                  </Text>
                  {player.isCurrentUser && (
                    <Text style={styles.currentUserBadge}>YOU</Text>
                  )}
                </View>
                
                <View style={styles.pointsContainer}>
                  <Text style={styles.playerPoints}>
                    {getScoreToShow(player)}
                  </Text>
                  <Text style={styles.pointsUnit}>pts</Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.noDataContainer}>
              <Ionicons name="podium-outline" size={48} color={theme.textMuted} style={{ marginBottom: 12 }} />
              <Text style={styles.noDataText}>No standings data available yet</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.navigate('Dashboard')}
        >
          <Ionicons name="home-outline" size={18} color={theme.textPrimary} style={{ marginRight: 8 }} />
          <Text style={styles.backButtonText}>Back to Hub</Text>
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
    borderRadius: 16,
    padding: 18,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: theme.border,
    ...shadows.medium,
  },
  userStatsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  userStatsTitle: {
    ...typography.caption,
    color: theme.textSecondary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: theme.surfaceElevated,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.border,
  },
  statLabel: {
    ...typography.small,
    color: theme.textMuted,
    marginBottom: 4,
  },
  statValue: {
    ...typography.h3,
    color: theme.textPrimary,
  },
  noDataContainer: {
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noDataText: {
    ...typography.body,
    color: theme.textMuted,
  },
  header: {
    backgroundColor: theme.surface,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: theme.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    ...typography.h3,
    fontSize: 17,
  },
  headerSubtitle: {
    ...typography.caption,
    color: theme.primary,
    marginTop: 2,
    fontWeight: '600',
  },
  refreshIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: theme.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  standingsContainer: {
    marginTop: 10,
    paddingBottom: 20,
  },
  playerRow: {
    backgroundColor: theme.surface,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
    ...shadows.small,
  },
  currentUserRow: {
    backgroundColor: theme.surfaceElevated,
    borderColor: theme.primary,
    borderWidth: 1.5,
  },
  rankContainer: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankNumberText: {
    ...typography.caption,
    fontWeight: '700',
    color: theme.textMuted,
    fontSize: 14,
  },
  playerInfo: {
    flex: 1,
    marginLeft: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerName: {
    ...typography.body,
    fontWeight: '600',
    color: theme.textPrimary,
  },
  currentUserBadge: {
    marginLeft: 8,
    backgroundColor: theme.primary,
    color: theme.textPrimary,
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },
  currentUserText: {
    color: theme.textPrimary,
    fontWeight: '700',
  },
  pointsContainer: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 4,
  },
  playerPoints: {
    ...typography.body,
    fontWeight: '700',
    color: theme.textPrimary,
  },
  pointsUnit: {
    ...typography.small,
    color: theme.textMuted,
    marginBottom: 1,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.surface,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  backButton: {
    backgroundColor: theme.surfaceElevated,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: theme.border,
  },
  backButtonText: {
    color: theme.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
});

export default StandingsScreen;
