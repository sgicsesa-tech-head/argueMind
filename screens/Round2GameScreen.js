import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme, shadows, typography } from '../theme';

const Round2GameScreen = ({ navigation, route }) => {
  // Game configuration
  const TOTAL_QUESTIONS = 15;
  const QUALIFIED_TEAMS = 10; // Top 10-15 teams from Round 1
  
  // Game state
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [buzzerEnabled, setBuzzerEnabled] = useState(false);
  const [hasBuzzed, setHasBuzzed] = useState(false);
  const [buzzerTime, setBuzzerTime] = useState(null);
  const [userPoints, setUserPoints] = useState(0);
  const [waitingForAdmin, setWaitingForAdmin] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState(null);
  
  // Buzzer rankings (this will come from backend)
  const [buzzerRankings, setBuzzerRankings] = useState([]);
  
  // Sample qualified teams (from Round 1 results)
  const qualifiedTeams = [
    { id: 1, name: 'You', points: 1850, qualified: true },
    { id: 2, name: 'Team Alpha', points: 1780, qualified: true },
    { id: 3, name: 'Team Beta', points: 1720, qualified: true },
    // ... more teams
  ];

  const handleBuzzer = () => {
    if (!buzzerEnabled || hasBuzzed) return;
    
    const responseTime = Date.now() - questionStartTime;
    
    // Haptic feedback
    Vibration.vibrate(100);
    
    setHasBuzzed(true);
    setBuzzerTime(responseTime);
    setWaitingForAdmin(true);
    
    // Simulate adding to buzzer rankings
    const newRanking = {
      userId: 1, // Current user
      name: 'You',
      responseTime: responseTime,
      timestamp: Date.now()
    };
    
    setBuzzerRankings(prev => [...prev, newRanking].sort((a, b) => a.responseTime - b.responseTime));
    
    Alert.alert('Buzzer Pressed!', `Response time: ${responseTime}ms\nWaiting for admin scoring...`);
  };

  const resetForNextQuestion = () => {
    setBuzzerEnabled(false);
    setHasBuzzed(false);
    setBuzzerTime(null);
    setWaitingForAdmin(false);
    setBuzzerRankings([]);
    setQuestionStartTime(null);
  };

  // These will be controlled by admin panel
  // Admin will enable buzzer and score participants from admin panel

  const getBuzzerButtonColor = () => {
    if (hasBuzzed) return '#e74c3c'; // Red - already buzzed
    if (buzzerEnabled) return '#e67e22'; // Orange - ready to buzz
    return '#95a5a6'; // Gray - disabled
  };

  const getBuzzerButtonText = () => {
    if (hasBuzzed) return 'BUZZED!';
    if (buzzerEnabled) return 'BUZZ NOW!';
    return 'WAITING...';
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Round 2 - Buzzer Round</Text>
        <Text style={styles.questionCounter}>Question {currentQuestion}/{TOTAL_QUESTIONS}</Text>
      </View>
      
      {/* Points Display */}
      <View style={styles.pointsContainer}>
        <Text style={styles.pointsText}>Points: {userPoints}</Text>
        <Text style={styles.qualifiedText}>
          Qualified Teams: {QUALIFIED_TEAMS}
        </Text>
      </View>
      
      {/* Question Display */}
      <View style={styles.questionContainer}>
        <Text style={styles.questionTitle}>Question {currentQuestion}</Text>
        <Text style={styles.questionInstruction}>
          Listen carefully to the verbal question.{'\n'}
          Press the buzzer when you know the answer!
        </Text>
      </View>
      
      {/* Buzzer Section */}
      <View style={styles.buzzerSection}>
        <TouchableOpacity
          style={[
            styles.buzzerButton,
            { backgroundColor: getBuzzerButtonColor() }
          ]}
          onPress={handleBuzzer}
          disabled={!buzzerEnabled || hasBuzzed}
          activeOpacity={0.8}
        >
          <Text style={styles.buzzerButtonText}>
            {getBuzzerButtonText()}
          </Text>
        </TouchableOpacity>
        
        {buzzerTime && (
          <Text style={styles.responseTimeText}>
            Your response time: {buzzerTime}ms
          </Text>
        )}
      </View>

      {/* Status Display */}
      <View style={styles.statusContainer}>
        {!buzzerEnabled && !waitingForAdmin && (
          <Text style={styles.statusText}>
            Waiting for admin to start question...
          </Text>
        )}
        
        {buzzerEnabled && !hasBuzzed && (
          <Text style={styles.statusTextActive}>
            🔴 QUESTION ACTIVE - Ready to buzz!
          </Text>
        )}
        
        {waitingForAdmin && (
          <Text style={styles.statusText}>
            Waiting for admin scoring...
          </Text>
        )}
      </View>

      {/* Buzzer Rankings (if any) */}
      {buzzerRankings.length > 0 && (
        <View style={styles.rankingsContainer}>
          <Text style={styles.rankingsTitle}>Buzzer Order:</Text>
          {buzzerRankings.slice(0, 5).map((ranking, index) => (
            <View key={ranking.userId} style={styles.rankingItem}>
              <Text style={styles.rankingPosition}>{index + 1}.</Text>
              <Text style={styles.rankingName}>{ranking.name}</Text>
              <Text style={styles.rankingTime}>{ranking.responseTime}ms</Text>
            </View>
          ))}
        </View>
      )}


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
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    alignItems: 'center',
  },
  headerTitle: {
    ...typography.h3,
  },
  questionCounter: {
    ...typography.caption,
    marginTop: 5,
  },
  pointsContainer: {
    backgroundColor: theme.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pointsText: {
    color: theme.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  qualifiedText: {
    color: theme.textPrimary,
    fontSize: 14,
  },
  questionContainer: {
    padding: 20,
    backgroundColor: theme.surface,
    margin: 20,
    borderRadius: 12,
    alignItems: 'center',
    ...shadows.small,
  },
  questionTitle: {
    ...typography.h2,
    marginBottom: 10,
  },
  questionInstruction: {
    ...typography.body,
    textAlign: 'center',
    lineHeight: 24,
    color: theme.textSecondary,
  },
  buzzerSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  buzzerButton: {
    width: 200,
    height: 200,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  buzzerButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  responseTimeText: {
    marginTop: 15,
    fontSize: 16,
    color: '#27ae60',
    fontWeight: 'bold',
  },
  statusContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  statusTextActive: {
    fontSize: 16,
    color: '#e74c3c',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  rankingsContainer: {
    margin: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
  },
  rankingsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
  },
  rankingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
  },
  rankingPosition: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3498db',
    width: 30,
  },
  rankingName: {
    fontSize: 16,
    color: '#2c3e50',
    flex: 1,
  },
  rankingTime: {
    fontSize: 14,
    color: '#27ae60',
    fontWeight: 'bold',
  },
});

export default Round2GameScreen;
