import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme, shadows, typography } from '../theme';
import { FirebaseService } from '../firebase/gameService';
import { useFirebase } from '../hooks/useFirebase';

const AdminPanel = ({ navigation }) => {
  const { gameState, loading: firebaseLoading } = useFirebase();
  const [selectedRound, setSelectedRound] = useState(1);
  const [participants, setParticipants] = useState([]);
  const [qualifiedParticipants, setQualifiedParticipants] = useState([]);
  const [buzzerRankings, setBuzzerRankings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadParticipants();
    if (gameState) {
      setSelectedRound(gameState.currentRound || 1);
    }
  }, [gameState]);

  const loadParticipants = async () => {
    try {
      const result = await FirebaseService.getAllUsers();
      if (result.success) {
        const allParticipants = result.users.filter(user => !user.isAdmin);
        setParticipants(allParticipants);
        
        // Get qualified participants for Round 2 (top 10 from Round 1)
        const qualified = allParticipants
          .filter(user => user.round1Score > 0)
          .sort((a, b) => b.round1Score - a.round1Score)
          .slice(0, 10);
        
        setQualifiedParticipants(qualified);
        
        // Update qualification status in Firebase
        await FirebaseService.updateQualifiedUsers(qualified.map(u => u.uid));
      }
    } catch (error) {
      console.error('Error loading participants:', error);
    } finally {
      setLoading(false);
    }
  };

  // Round 1 Handlers
  const handleStartRound1 = async () => {
    try {
      await FirebaseService.updateGameState({
        round1Active: true,
        currentRound: 1,
        gameStarted: true,
        currentQuestion: 1
      });
      Alert.alert('Round 1 Started', 'All participants can now see Question 1');
    } catch (error) {
      Alert.alert('Error', 'Failed to start Round 1');
    }
  };

  const handleRound1NextQuestion = () => {
    const nextQuestion = (gameState?.currentQuestion || 1) + 1;
    Alert.alert(
      'Next Question',
      `Move all participants to Question ${nextQuestion}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Continue', 
          onPress: async () => {
            try {
              await FirebaseService.updateGameState({
                currentQuestion: nextQuestion
              });
              Alert.alert('Success', `All participants moved to Question ${nextQuestion}`);
            } catch (error) {
              Alert.alert('Error', 'Failed to update question');
            }
          }
        }
      ]
    );
  };

  const handleEndRound1 = () => {
    Alert.alert(
      'End Round 1',
      'This will show Round 1 standings and qualify top 10 teams for Round 2',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'End Round 1', 
          onPress: async () => {
            try {
              await FirebaseService.updateGameState({
                round1Active: false,
                currentRound: 2
              });
              
              // Qualify top 10 users
              await loadParticipants();
              
              navigation.navigate('Standings', { round: 1, isAdmin: true });
            } catch (error) {
              Alert.alert('Error', 'Failed to end Round 1');
            }
          }
        }
      ]
    );
  };

  // Round 2 Handlers
  const handleStartRound2 = async () => {
    try {
      await FirebaseService.updateGameState({
        round2Active: true,
        currentRound: 2,
        currentQuestion: 1,
        round2QuestionActive: false,
        round2BuzzerActive: false
      });
      Alert.alert('Round 2 Started', 'Qualified participants can now see Round 2');
    } catch (error) {
      Alert.alert('Error', 'Failed to start Round 2');
    }
  };

  const handleStartRound2Question = () => {
    const questionNum = gameState?.currentQuestion || 1;
    Alert.alert(
      'Start Question',
      `Ready to start Question ${questionNum}? Read the question verbally to participants.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Start Question', 
          onPress: async () => {
            try {
              await FirebaseService.updateGameState({
                round2QuestionActive: true
              });
            } catch (error) {
              Alert.alert('Error', 'Failed to start question');
            }
          }
        }
      ]
    );
  };

  const handleEnableBuzzer = async () => {
    if (!gameState?.round2QuestionActive) {
      Alert.alert('Error', 'Please start the question first');
      return;
    }
    
    try {
      await FirebaseService.updateGameState({
        round2BuzzerActive: true
      });
      
      // Reset buzzer states
      setBuzzerRankings([]);
      Alert.alert('Buzzer Active', 'Participants can now buzz in!');
    } catch (error) {
      Alert.alert('Error', 'Failed to enable buzzer');
    }
  };

  const handleScoreParticipant = (participantId, points) => {
    setQualifiedParticipants(prev => prev.map(p => 
      p.id === participantId 
        ? { ...p, round2Score: p.round2Score + points, scored: true }
        : p
    ));
    
    Alert.alert('Scored', `Participant scored ${points > 0 ? '+' : ''}${points} points`);
  };

  const handleRound2NextQuestion = () => {
    const currentQuestion = gameState?.currentQuestion || 1;
    if (currentQuestion < 15) {
      Alert.alert(
        'Next Question',
        `Move to Question ${currentQuestion + 1}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Continue', 
            onPress: async () => {
              try {
                await FirebaseService.updateGameState({
                  currentQuestion: currentQuestion + 1,
                  round2QuestionActive: false,
                  round2BuzzerActive: false
                });
                setBuzzerRankings([]);
                Alert.alert('Success', `Moved to Question ${currentQuestion + 1}`);
              } catch (error) {
                Alert.alert('Error', 'Failed to update question');
              }
            }
          }
        ]
      );
    } else {
      handleEndRound2();
    }
  };

  const handleEndRound2 = () => {
    Alert.alert(
      'End Round 2',
      'Show final tournament standings?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Show Final Results', 
          onPress: async () => {
            try {
              await FirebaseService.updateGameState({
                round2Active: false,
                gameEnded: true
              });
              
              navigation.navigate('FinalStandings', { 
                round: 2, 
                isAdmin: true,
                participants: qualifiedParticipants 
              });
            } catch (error) {
              Alert.alert('Error', 'Failed to end Round 2');
            }
          }
        }
      ]
    );
  };

  // Simulate participants buzzing (for testing)
  const simulateBuzzer = (participantId) => {
    if (!buzzerActive) return;
    
    const responseTime = Math.floor(Math.random() * 1000) + 100;
    const participant = qualifiedParticipants.find(p => p.id === participantId);
    
    setQualifiedParticipants(prev => prev.map(p => 
      p.id === participantId 
        ? { ...p, buzzed: true, buzzerTime: responseTime }
        : p
    ));
    
    setBuzzerRankings(prev => {
      const newRanking = { 
        id: participantId, 
        name: participant.name, 
        time: responseTime 
      };
      return [...prev, newRanking].sort((a, b) => a.time - b.time);
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'waiting': return '#7f8c8d';
      case 'answering': return '#f39c12';
      case 'completed': return '#27ae60';
      case 'ready': return '#f39c12';
      case 'active': return '#27ae60';
      case 'buzzed': return '#3498db';
      default: return '#7f8c8d';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'waiting': return '⏳';
      case 'answering': return '✏️';
      case 'completed': return '✅';
      case 'ready': return '🟡';
      case 'active': return '🟢';
      case 'buzzed': return '🔴';
      default: return '❓';
    }
  };

  const getBuzzerStatus = (participant) => {
    if (!round2QuestionActive) return 'waiting';
    if (!buzzerActive) return 'ready';
    if (participant.buzzed) return 'buzzed';
    return 'active';
  };

  if (loading || firebaseLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingText}>Loading admin panel...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Panel</Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.backButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Round Selector */}
        <View style={styles.roundSelector}>
          <TouchableOpacity 
            style={[styles.roundTab, selectedRound === 1 && styles.activeTab]}
            onPress={() => setSelectedRound(1)}
          >
            <Text style={[styles.tabText, selectedRound === 1 && styles.activeTabText]}>Round 1</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.roundTab, selectedRound === 2 && styles.activeTab]}
            onPress={() => setSelectedRound(2)}
          >
            <Text style={[styles.tabText, selectedRound === 2 && styles.activeTabText]}>Round 2</Text>
          </TouchableOpacity>
        </View>

        {selectedRound === 1 ? (
          <>
            {/* Round 1 Control */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Round 1 Control - Word Guessing</Text>
              
              <View style={styles.controlRow}>
                <Text style={styles.questionText}>
                  Current Question: {gameState?.currentQuestion || 1} / {gameState?.round1TotalQuestions || 20}
                </Text>
                <Text style={[styles.roundStatus, { color: gameState?.round1Active ? '#27ae60' : '#e74c3c' }]}>
                  {gameState?.round1Active ? 'Active' : 'Inactive'}
                </Text>
              </View>

              <View style={styles.buttonRow}>
                {!gameState?.round1Active ? (
                  <TouchableOpacity style={styles.startButton} onPress={handleStartRound1}>
                    <Text style={styles.buttonText}>Start Round 1</Text>
                  </TouchableOpacity>
                ) : (
                  <>
                    <TouchableOpacity 
                      style={styles.nextButton} 
                      onPress={handleRound1NextQuestion}
                      disabled={(gameState?.currentQuestion || 1) >= (gameState?.round1TotalQuestions || 20)}
                    >
                      <Text style={styles.buttonText}>Next Question</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.endButton} onPress={handleEndRound1}>
                      <Text style={styles.buttonText}>End Round 1</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>

            {/* Round 1 Participants */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Round 1 Participants ({participants.length})</Text>
              
              {loading ? (
                <ActivityIndicator size="large" color={theme.primary} />
              ) : (
                participants.map((participant, index) => (
                  <View key={participant.uid || index} style={styles.participantRow}>
                    <Text style={styles.participantIcon}>👤</Text>
                    
                    <View style={styles.participantInfo}>
                      <Text style={styles.participantName}>{participant.teamName || 'Anonymous'}</Text>
                      <Text style={[styles.participantStatus, { color: theme.textSecondary }]}>
                        Active
                      </Text>
                    </View>
                    
                    <Text style={styles.participantPoints}>
                      {participant.round1Score || 0} pts
                    </Text>
                  </View>
                ))
              )}
            </View>

            {/* Round 1 Stats */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Round 1 Stats</Text>
              
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>{participants.length}</Text>
                  <Text style={styles.statLabel}>Total Teams</Text>
                </View>
                
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>
                    {participants.filter(p => p.round1Score > 0).length}
                  </Text>
                  <Text style={styles.statLabel}>Scored</Text>
                </View>
                
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>
                    {Math.min(participants.filter(p => p.round1Score > 0).length, 10)}
                  </Text>
                  <Text style={styles.statLabel}>Qualified</Text>
                </View>
              </View>
            </View>
          </>
        ) : (
          <>
            {/* Round 2 Control */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Round 2 Control - Buzzer Round</Text>
              
              <View style={styles.questionStatus}>
                <Text style={styles.questionText}>
                  Question {gameState?.currentQuestion || 1} / {gameState?.round2TotalQuestions || 15}
                </Text>
                <View style={styles.statusIndicators}>
                  <Text style={[styles.statusDot, { backgroundColor: gameState?.round2QuestionActive ? '#27ae60' : '#e74c3c' }]}>
                    Question {gameState?.round2QuestionActive ? 'Active' : 'Inactive'}
                  </Text>
                  <Text style={[styles.statusDot, { backgroundColor: gameState?.round2BuzzerActive ? '#f39c12' : '#95a5a6' }]}>
                    Buzzer {gameState?.round2BuzzerActive ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              </View>

              <View style={styles.controlButtons}>
                {!gameState?.round2Active ? (
                  <TouchableOpacity 
                    style={[styles.controlButton, styles.startButton]}
                    onPress={handleStartRound2}
                  >
                    <Text style={styles.buttonText}>Start Round 2</Text>
                  </TouchableOpacity>
                ) : (
                  <>
                    <TouchableOpacity 
                      style={[styles.controlButton, styles.startButton]}
                      onPress={handleStartRound2Question}
                      disabled={gameState?.round2QuestionActive}
                    >
                      <Text style={styles.buttonText}>Start Question</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.controlButton, styles.buzzerButton]}
                      onPress={handleEnableBuzzer}
                      disabled={!gameState?.round2QuestionActive || gameState?.round2BuzzerActive}
                    >
                      <Text style={styles.buttonText}>Enable Buzzer</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
              
              {gameState?.round2Active && (
                <TouchableOpacity 
                  style={[styles.controlButton, styles.nextButton]}
                  onPress={handleRound2NextQuestion}
                >
                  <Text style={styles.buttonText}>
                    {(gameState?.currentQuestion || 1) < (gameState?.round2TotalQuestions || 15) ? 'Next Question' : 'End Round & Show Results'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Buzzer Rankings */}
            {buzzerRankings.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Buzzer Order - Score Participants</Text>
                {buzzerRankings.map((ranking, index) => (
                  <View key={ranking.id} style={styles.rankingItem}>
                    <Text style={styles.rankPosition}>{index + 1}.</Text>
                    <Text style={styles.rankName}>{ranking.name}</Text>
                    <Text style={styles.rankTime}>{ranking.time}ms</Text>
                    
                    <View style={styles.scoringButtons}>
                      <TouchableOpacity 
                        style={styles.scoreButtonSmall}
                        onPress={() => handleScoreParticipant(ranking.id, 20)}
                      >
                        <Text style={styles.scoreText}>+20</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.scoreButtonSmall, styles.neutralScore]}
                        onPress={() => handleScoreParticipant(ranking.id, 0)}
                      >
                        <Text style={styles.scoreText}>+0</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.scoreButtonSmall, styles.negativeScore]}
                        onPress={() => handleScoreParticipant(ranking.id, -10)}
                      >
                        <Text style={styles.scoreText}>-10</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Round 2 Qualified Participants */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Qualified Participants (Top 10)</Text>
              
              {loading ? (
                <ActivityIndicator size="large" color={theme.primary} />
              ) : (
                qualifiedParticipants.map((participant, index) => (
                  <View key={participant.uid || index} style={styles.participantRow}>
                    <Text style={styles.participantIcon}>🏆</Text>
                    
                    <View style={styles.participantInfo}>
                      <Text style={styles.participantName}>{participant.teamName || 'Anonymous'}</Text>
                      <Text style={[styles.participantStatus, { color: theme.success }]}>
                        Qualified
                      </Text>
                    </View>
                    
                    <View style={styles.scoreInfo}>
                      <Text style={styles.round1Score}>R1: {participant.round1Score || 0}</Text>
                      <Text style={[
                        styles.round2Score,
                        { color: (participant.round2Score || 0) >= 0 ? '#27ae60' : '#e74c3c' }
                      ]}>
                        R2: {(participant.round2Score || 0) >= 0 ? '+' : ''}{participant.round2Score || 0}
                      </Text>
                    </View>
                  </View>
                ))
              )}
              
              {!loading && qualifiedParticipants.length === 0 && (
                <Text style={styles.noParticipantsText}>
                  No qualified participants yet. Complete Round 1 first.
                </Text>
              )}
            </View>
          </>
        )}
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
    color: theme.textSecondary,
    marginTop: 10,
    fontSize: 16,
  },
  header: {
    backgroundColor: theme.surface,
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.textPrimary,
  },
  backButton: {
    backgroundColor: theme.buttonSecondary,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  backButtonText: {
    color: theme.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 20,
    marginVertical: 10,
    ...shadows.medium,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.textPrimary,
    marginBottom: 15,
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  questionText: {
    fontSize: 16,
    color: theme.textPrimary,
    fontWeight: '600',
  },
  roundStatus: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  startButton: {
    backgroundColor: theme.buttonSuccess,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 30,
    flex: 1,
    alignItems: 'center',
    ...shadows.small,
  },
  nextButton: {
    backgroundColor: theme.primary,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flex: 1,
    alignItems: 'center',
    marginRight: 10,
    ...shadows.small,
  },
  endButton: {
    backgroundColor: theme.buttonDanger,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flex: 1,
    alignItems: 'center',
    ...shadows.small,
  },
  buttonText: {
    color: theme.textInverse,
    fontSize: 16,
    fontWeight: 'bold',
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.divider,
  },
  participantIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textPrimary,
  },
  participantStatus: {
    fontSize: 14,
    marginTop: 2,
  },
  participantPoints: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.success,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    alignItems: 'center',
    padding: 15,
    backgroundColor: theme.surfaceElevated,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
    ...shadows.small,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.primary,
  },
  statLabel: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 5,
  },
  roundSelector: {
    flexDirection: 'row',
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 5,
    margin: 10,
    ...shadows.medium,
  },
  roundTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: theme.primary,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textSecondary,
  },
  activeTabText: {
    color: theme.textInverse,
  },
  questionStatus: {
    marginBottom: 15,
  },
  statusIndicators: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  statusDot: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  controlButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  controlButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
    ...shadows.small,
  },
  buzzerButton: {
    backgroundColor: theme.buttonWarning,
  },
  rankingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.divider,
  },
  rankPosition: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.primary,
    width: 30,
  },
  rankName: {
    fontSize: 16,
    color: theme.textPrimary,
    flex: 1,
  },
  rankTime: {
    fontSize: 14,
    color: theme.success,
    fontWeight: 'bold',
    marginRight: 10,
  },
  scoringButtons: {
    flexDirection: 'row',
  },
  scoreButtonSmall: {
    backgroundColor: theme.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginHorizontal: 2,
  },
  neutralScore: {
    backgroundColor: theme.textMuted,
  },
  negativeScore: {
    backgroundColor: theme.error,
  },
  scoreText: {
    color: theme.textInverse,
    fontSize: 12,
    fontWeight: 'bold',
  },
  scoreInfo: {
    alignItems: 'flex-end',
    marginRight: 10,
  },
  round1Score: {
    fontSize: 11,
    color: theme.textSecondary,
  },
  round2Score: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  testBuzzer: {
    backgroundColor: theme.secondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  testBuzzerText: {
    color: theme.textInverse,
    fontSize: 10,
    fontWeight: 'bold',
  },
  noParticipantsText: {
    color: theme.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
});

export default AdminPanel;
