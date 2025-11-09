import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme, shadows, typography } from '../theme';

const StandingsScreen = ({ navigation, route }) => {
  const { points } = route.params || { points: 0 };
  
  // Sample standings data (this will come from your backend)
  const standings = [
    { rank: 1, name: 'Player 1', points: 1850, isCurrentUser: false },
    { rank: 2, name: 'You', points: points, isCurrentUser: true },
    { rank: 3, name: 'Player 3', points: 1650, isCurrentUser: false },
    { rank: 4, name: 'Player 4', points: 1500, isCurrentUser: false },
    { rank: 5, name: 'Player 5', points: 1350, isCurrentUser: false },
  ];

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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Final Standings</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.standingsContainer}>
          {standings.map((player) => (
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
                  {player.name}
                </Text>
              </View>
              
              <View style={styles.pointsContainer}>
                <Text style={[
                  styles.playerPoints,
                  player.isCurrentUser && styles.currentUserText
                ]}>
                  {player.points} pts
                </Text>
              </View>
            </View>
          ))}
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
    ...shadows.small,
  },
  backButtonText: {
    color: theme.textInverse,
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default StandingsScreen;
