import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Vibration,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme, shadows, typography } from '../theme';
import { FirebaseService } from '../firebase/gameService';
import { useFirebase } from '../hooks/useFirebase';

const Round2GameScreen = ({ navigation, route }) => {
  const { user, userData, gameState } = useFirebase();
  
  // Game state
  const userProfile = userData || user;
  const [hasBuzzed, setHasBuzzed] = useState(false);
  const [buzzerTime, setBuzzerTime] = useState(null);
  const [questionStartTime, setQuestionStartTime] = useState(null);
  const loading = false;
  
  // Buzzer rankings (real-time from Firebase)
  const [buzzerRankings, setBuzzerRankings] = useState([]);

  useEffect(() => {
    // Subscribe to buzzer responses for current question
    if (gameState?.currentQuestion) {
      const unsubscribe = FirebaseService.subscribeToBuzzerResponses(
        gameState.currentQuestion,
        (responses) => {
          setBuzzerRankings(responses);
          
          // If no responses (buzzer was reset), clear user's buzzed state
          if (responses.length === 0) {
            setHasBuzzed(false);
            setBuzzerTime(null);
          } else {
            // Check if current user has buzzed
            const userBuzzed = responses.find(r => r.userId === user?.uid);
            if (userBuzzed) {
              setHasBuzzed(true);
              setBuzzerTime(userBuzzed.responseTime);
            } else {
              // User hasn't buzzed yet
              setHasBuzzed(false);
              setBuzzerTime(null);
            }
          }
        }
      );
      return () => unsubscribe();
    }
  }, [gameState?.currentQuestion, user]);

  useEffect(() => {
    // Reset buzzer state when question changes
    setHasBuzzed(false);
    setBuzzerTime(null);
    setQuestionStartTime(null);
    setBuzzerRankings([]);
  }, [gameState?.currentQuestion]);

  useEffect(() => {
    // Set question start time when buzzer becomes active
    if (gameState?.round2BuzzerActive && !questionStartTime) {
      setQuestionStartTime(Date.now());
    }
  }, [gameState?.round2BuzzerActive]);

  const handleBuzzer = async () => {
    if (!gameState?.round2BuzzerActive || hasBuzzed) return;
    
    const responseTime = Date.now() - questionStartTime;
    
    // Haptic feedback
    Vibration.vibrate(100);
    
    try {
      const currentTeamName = userProfile?.teamName || user?.teamName || 'Team';
      const result = await FirebaseService.pressBuzzer(
        user.uid,
        currentTeamName,
        gameState.currentQuestion,
        responseTime
      );
      
      if (result.success) {
        setHasBuzzed(true);
        setBuzzerTime(responseTime);
        Alert.alert('Buzzer Pressed!', `Response time: ${responseTime}ms\nWaiting for admin scoring...`);
      } else {
        Alert.alert('Error', result.error || 'Failed to press buzzer');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to press buzzer');
    }
  };

  const handleBackToDashboard = () => {
    navigation.navigate('Dashboard');
  };

  const getBuzzerButtonColor = () => {
    if (hasBuzzed) return '#e74c3c'; // Red - already buzzed
    if (gameState?.round2BuzzerActive) return '#e67e22'; // Orange - ready to buzz
    return '#95a5a6'; // Gray - disabled
  };

  const getBuzzerButtonText = () => {
    if (hasBuzzed) return 'BUZZED!';
    if (gameState?.round2BuzzerActive) return 'BUZZ NOW!';
    return 'WAITING...';
  };

  if (loading) {
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerNavButton}
          onPress={handleBackToDashboard}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={22} color={theme.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>CSE Induction</Text>
          <Text style={styles.questionCounter}>
            Round 2 • Question {gameState?.currentQuestion || 1} of {gameState?.round2TotalQuestions || 15}
          </Text>
        </View>

        <View style={styles.headerPlaceholder} />
      </View>
      
      {/* Points Display */}
      <View style={styles.pointsBar}>
        <View style={styles.pointsBadge}>
          <Ionicons name="flash" size={14} color={theme.warning} style={{ marginRight: 6 }} />
          <Text style={styles.pointsText}>
            R2 Score: {userProfile?.round2Score || 0} pts
          </Text>
        </View>
      </View>
      
      {/* Question Display */}
      <View style={styles.questionContainer}>
        <Text style={styles.questionTitle}>
          Buzzer Question {gameState?.currentQuestion || 1}
        </Text>
        {gameState?.round2QuestionActive ? (
          <Text style={styles.questionInstruction}>
            Listen closely to the speaker.{'\n'}
            Hit the buzzer as fast as possible when active!
          </Text>
        ) : (
          <Text style={styles.questionInstructionWaiting}>
            Waiting for host to present the question...
          </Text>
        )}
      </View>
      
      {/* Buzzer Section */}
      <View style={styles.buzzerSection}>
        <TouchableOpacity
          style={[
            styles.buzzerButton,
            { backgroundColor: getBuzzerButtonColor() }
          ]}
          onPress={handleBuzzer}
          disabled={!gameState?.round2BuzzerActive || hasBuzzed}
          activeOpacity={0.85}
        >
          <Ionicons
            name={hasBuzzed ? "checkmark-circle" : "flash"}
            size={40}
            color={theme.textPrimary}
            style={{ marginBottom: 4 }}
          />
          <Text style={styles.buzzerButtonText}>
            {getBuzzerButtonText()}
          </Text>
        </TouchableOpacity>
        
        {buzzerTime && (
          <View style={styles.responseTimeBadge}>
            <Ionicons name="speedometer-outline" size={14} color={theme.accent} style={{ marginRight: 6 }} />
            <Text style={styles.responseTimeText}>
              Response: {buzzerTime} ms
            </Text>
          </View>
        )}
      </View>

      {/* Status Display */}
      <View style={styles.statusContainer}>
        {!gameState?.round2QuestionActive && (
          <Text style={styles.statusText}>
            Waiting for host to begin question...
          </Text>
        )}
        
        {gameState?.round2QuestionActive && !gameState?.round2BuzzerActive && !hasBuzzed && (
          <Text style={styles.statusText}>
            Question active — Get ready for buzzer unlock...
          </Text>
        )}
        
        {gameState?.round2BuzzerActive && !hasBuzzed && (
          <View style={styles.activeStatusRow}>
            <Ionicons name="flash" size={18} color={theme.warning} style={{ marginRight: 6 }} />
            <Text style={styles.statusTextActive}>
              BUZZER UNLOCKED — Hit to answer!
            </Text>
          </View>
        )}
        
        {hasBuzzed && (
          <Text style={styles.statusText}>
            Buzzed in! Waiting for host evaluation...
          </Text>
        )}
      </View>

      {/* Buzzer Rankings (if any) */}
      {buzzerRankings.length > 0 && (
        <View style={styles.rankingsContainer}>
          <Text style={styles.rankingsTitle}>Buzzer Order:</Text>
          {buzzerRankings.map((ranking, index) => (
            <View 
              key={ranking.id || index} 
              style={[
                styles.rankingItem,
                ranking.userId === user?.uid && styles.currentUserRanking
              ]}
            >
              <Text style={styles.rankingPosition}>#{index + 1}</Text>
              <Text style={styles.rankingName} numberOfLines={1}>
                {ranking.userId === user?.uid ? 'You' : (ranking.teamName || `Team ${index + 1}`)}
              </Text>
              <Text style={styles.rankingTime}>{ranking.responseTime}ms</Text>
              {ranking.scored && (
                <Text style={[
                  styles.rankingPoints,
                  { color: ranking.points > 0 ? theme.success : ranking.points < 0 ? theme.error : theme.textMuted }
                ]}>
                  {ranking.points > 0 ? `+${ranking.points}` : ranking.points}
                </Text>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Back Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackToDashboard}>
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
    ...typography.body,
    marginTop: 10,
  },
  header: {
    backgroundColor: theme.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerNavButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: theme.surfaceElevated,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.border,
  },
  headerCenter: {
    alignItems: "center",
  },
  headerPlaceholder: {
    width: 36,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.textPrimary,
  },
  questionCounter: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 2,
  },
  pointsBar: {
    paddingVertical: 8,
    alignItems: "center",
  },
  pointsBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.surface,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.border,
  },
  pointsText: {
    color: theme.textPrimary,
    fontSize: 14,
    fontWeight: "600",
  },
  responseTimeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.surfaceElevated,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 14,
    borderWidth: 1,
    borderColor: theme.border,
  },
  activeStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
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
  questionInstructionWaiting: {
    ...typography.body,
    textAlign: 'center',
    lineHeight: 24,
    color: theme.textMuted,
    fontStyle: 'italic',
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
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 15,
    ...shadows.medium,
  },
  rankingsTitle: {
    ...typography.h3,
    marginBottom: 10,
  },
  rankingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 5,
  },
  currentUserRanking: {
    backgroundColor: theme.primary + '30',
    borderWidth: 1,
    borderColor: theme.primary,
  },
  rankingPosition: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.primary,
    width: 30,
  },
  rankingName: {
    ...typography.body,
    flex: 1,
  },
  rankingTime: {
    fontSize: 14,
    color: theme.success,
    fontWeight: 'bold',
    marginRight: 10,
  },
  rankingPoints: {
    fontSize: 14,
    fontWeight: 'bold',
    minWidth: 40,
    textAlign: 'right',
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
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default Round2GameScreen;
