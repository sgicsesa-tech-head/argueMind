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
import { theme, shadows, typography } from '../theme';
import { FirebaseService } from '../firebase/gameService';
import { useFirebase } from '../hooks/useFirebase';

const Round2GameScreen = ({ navigation, route }) => {
  const { user, gameState } = useFirebase();
  
  // Game state
  const [userProfile, setUserProfile] = useState(null);
  const [hasBuzzed, setHasBuzzed] = useState(false);
  const [buzzerTime, setBuzzerTime] = useState(null);
  const [questionStartTime, setQuestionStartTime] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Buzzer rankings (real-time from Firebase)
  const [buzzerRankings, setBuzzerRankings] = useState([]);

  useEffect(() => {
    loadUserProfile();
  }, [user]);

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
    setLoading(false);
  };

  const handleBuzzer = async () => {
    if (!gameState?.round2BuzzerActive || hasBuzzed) return;
    
    const responseTime = Date.now() - questionStartTime;
    
    // Haptic feedback
    Vibration.vibrate(100);
    
    try {
      const result = await FirebaseService.pressBuzzer(
        user.uid,
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
        <Text style={styles.headerTitle}>Round 2 - Buzzer Round</Text>
        <Text style={styles.questionCounter}>
          Question {gameState?.currentQuestion || 1}/{gameState?.round2TotalQuestions || 15}
        </Text>
      </View>
      
      {/* Points Display */}
      <View style={styles.pointsContainer}>
        <Text style={styles.pointsText}>
          Round 2 Points: {userProfile?.round2Score || 0}
        </Text>
        <Text style={styles.qualifiedText}>
          Total: {userProfile?.totalScore || 0}
        </Text>
      </View>
      
      {/* Question Display */}
      <View style={styles.questionContainer}>
        <Text style={styles.questionTitle}>
          Question {gameState?.currentQuestion || 1}
        </Text>
        {gameState?.round2QuestionActive ? (
          <Text style={styles.questionInstruction}>
            Listen carefully to the verbal question.{'\n'}
            Press the buzzer when you know the answer!
          </Text>
        ) : (
          <Text style={styles.questionInstructionWaiting}>
            Waiting for admin to show the question...
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
        {!gameState?.round2QuestionActive && (
          <Text style={styles.statusText}>
            Waiting for admin to show question...
          </Text>
        )}
        
        {gameState?.round2QuestionActive && !gameState?.round2BuzzerActive && !hasBuzzed && (
          <Text style={styles.statusText}>
            Question shown - Waiting for buzzer activation...
          </Text>
        )}
        
        {gameState?.round2BuzzerActive && !hasBuzzed && (
          <Text style={styles.statusTextActive}>
            🔴 BUZZER ACTIVE - Press to answer!
          </Text>
        )}
        
        {hasBuzzed && (
          <Text style={styles.statusText}>
            Waiting for admin scoring...
          </Text>
        )}
      </View>

      {/* Buzzer Rankings (if any) */}
      {buzzerRankings.length > 0 && (
        <View style={styles.rankingsContainer}>
          <Text style={styles.rankingsTitle}>Buzzer Order:</Text>
          {buzzerRankings.map((ranking, index) => (
            <View 
              key={ranking.id} 
              style={[
                styles.rankingItem,
                ranking.userId === user?.uid && styles.currentUserRanking
              ]}
            >
              <Text style={styles.rankingPosition}>{index + 1}.</Text>
              <Text style={styles.rankingName}>
                {ranking.userId === user?.uid ? 'You' : `Team ${index + 1}`}
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
