import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const FinalStandingsScreen = ({ navigation, route }) => {
  const { round, finalPoints, qualified } = route.params || { 
    round: 2, 
    finalPoints: 0, 
    qualified: true 
  };
  
  // Sample final standings (this will come from your backend)
  const finalStandings = [
    { rank: 1, name: 'Team Alpha', round1Points: 1850, round2Points: 80, totalPoints: 1930, isCurrentUser: false },
    { rank: 2, name: 'You', round1Points: 1780, round2Points: finalPoints || 60, totalPoints: 1840, isCurrentUser: true },
    { rank: 3, name: 'Team Beta', round1Points: 1720, round2Points: 100, totalPoints: 1820, isCurrentUser: false },
    { rank: 4, name: 'Team Gamma', round1Points: 1680, round2Points: 40, totalPoints: 1720, isCurrentUser: false },
    { rank: 5, name: 'Team Delta', round1Points: 1650, round2Points: 20, totalPoints: 1670, isCurrentUser: false },
    { rank: 6, name: 'Team Epsilon', round1Points: 1620, round2Points: 0, totalPoints: 1620, isCurrentUser: false },
    { rank: 7, name: 'Team Zeta', round1Points: 1590, round2Points: -10, totalPoints: 1580, isCurrentUser: false },
    { rank: 8, name: 'Team Eta', round1Points: 1560, round2Points: 0, totalPoints: 1560, isCurrentUser: false },
    { rank: 9, name: 'Team Theta', round1Points: 1530, round2Points: -20, totalPoints: 1510, isCurrentUser: false },
    { rank: 10, name: 'Team Iota', round1Points: 1500, round2Points: -30, totalPoints: 1470, isCurrentUser: false },
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
      case 1: return '🏆';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `${rank}`;
    }
  };

  const getPointsColor = (points) => {
    if (points > 0) return '#27ae60';
    if (points < 0) return '#e74c3c';
    return '#7f8c8d';
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🎉 Final Tournament Results 🎉</Text>
        <Text style={styles.headerSubtitle}>
          Round 1 + Round 2 Combined Scores
        </Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Top 3 Podium */}
        <View style={styles.podiumContainer}>
          <Text style={styles.podiumTitle}>Top 3 Winners</Text>
          
          <View style={styles.podiumRow}>
            {finalStandings.slice(0, 3).map((player, index) => (
              <View key={player.rank} style={styles.podiumPosition}>
                <Text style={styles.podiumRank}>
                  {getRankIcon(player.rank)}
                </Text>
                <Text style={[
                  styles.podiumName,
                  player.isCurrentUser && styles.currentUserText
                ]}>
                  {player.name}
                </Text>
                <Text style={styles.podiumPoints}>
                  {player.totalPoints} pts
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Detailed Standings */}
        <View style={styles.standingsContainer}>
          <Text style={styles.sectionTitle}>Complete Standings</Text>
          
          <View style={styles.tableHeader}>
            <Text style={styles.headerRank}>Rank</Text>
            <Text style={styles.headerName}>Team</Text>
            <Text style={styles.headerScore}>R1</Text>
            <Text style={styles.headerScore}>R2</Text>
            <Text style={styles.headerTotal}>Total</Text>
          </View>
          
          {finalStandings.map((player) => (
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
              
              <View style={styles.scoreContainer}>
                <Text style={styles.round1Points}>
                  {player.round1Points}
                </Text>
              </View>
              
              <View style={styles.scoreContainer}>
                <Text style={[
                  styles.round2Points,
                  { color: getPointsColor(player.round2Points) }
                ]}>
                  {player.round2Points > 0 ? '+' : ''}{player.round2Points}
                </Text>
              </View>
              
              <View style={styles.totalContainer}>
                <Text style={[
                  styles.totalPoints,
                  player.isCurrentUser && styles.currentUserText
                ]}>
                  {player.totalPoints}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* User's Performance Summary */}
        {qualified && (
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryTitle}>Your Performance</Text>
            
            <View style={styles.summaryStats}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Final Rank</Text>
                <Text style={styles.statValue}>
                  #{finalStandings.find(p => p.isCurrentUser)?.rank || 'N/A'}
                </Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Round 1 Score</Text>
                <Text style={styles.statValue}>
                  {finalStandings.find(p => p.isCurrentUser)?.round1Points || 0} pts
                </Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Round 2 Score</Text>
                <Text style={[
                  styles.statValue,
                  { color: getPointsColor(finalStandings.find(p => p.isCurrentUser)?.round2Points || 0) }
                ]}>
                  {finalStandings.find(p => p.isCurrentUser)?.round2Points > 0 ? '+' : ''}
                  {finalStandings.find(p => p.isCurrentUser)?.round2Points || 0} pts
                </Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Total Score</Text>
                <Text style={styles.statValueTotal}>
                  {finalStandings.find(p => p.isCurrentUser)?.totalPoints || 0} pts
                </Text>
              </View>
            </View>
          </View>
        )}
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
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 5,
  },
  content: {
    flex: 1,
  },
  podiumContainer: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  podiumTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 15,
  },
  podiumRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  podiumPosition: {
    alignItems: 'center',
    flex: 1,
  },
  podiumRank: {
    fontSize: 32,
    marginBottom: 5,
  },
  podiumName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
  },
  podiumPoints: {
    fontSize: 12,
    color: '#27ae60',
    fontWeight: 'bold',
    marginTop: 2,
  },
  standingsContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#e1e8ed',
    marginBottom: 10,
  },
  headerRank: {
    width: 50,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#7f8c8d',
  },
  headerName: {
    flex: 1,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#7f8c8d',
  },
  headerScore: {
    width: 40,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#7f8c8d',
    textAlign: 'center',
  },
  headerTotal: {
    width: 60,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#7f8c8d',
    textAlign: 'center',
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f2f6',
  },
  currentUserRow: {
    backgroundColor: '#e8f4fd',
    borderRadius: 8,
    paddingHorizontal: 8,
    marginVertical: 2,
  },
  rankContainer: {
    width: 50,
    alignItems: 'center',
  },
  rankText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  currentUserText: {
    color: '#3498db',
    fontWeight: 'bold',
  },
  scoreContainer: {
    width: 40,
    alignItems: 'center',
  },
  round1Points: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  round2Points: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  totalContainer: {
    width: 60,
    alignItems: 'center',
  },
  totalPoints: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#27ae60',
  },
  summaryContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
    textAlign: 'center',
  },
  summaryStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 15,
  },
  statLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 5,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  statValueTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3498db',
  },
  footer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e1e8ed',
  },
  backButton: {
    backgroundColor: '#3498db',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default FinalStandingsScreen;
