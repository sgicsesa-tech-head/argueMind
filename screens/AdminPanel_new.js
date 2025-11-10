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
  const [buzzerResponses, setBuzzerResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resettingRound, setResettingRound] = useState(false);

  useEffect(() => {
    loadParticipants();
    if (gameState) {
      setSelectedRound(gameState.currentRound || 1);
    }
  }, [gameState]);

  useEffect(() => {
    // Subscribe to buzzer responses for current question in Round 2
    if (selectedRound === 2 && gameState?.currentQuestion) {
      console.log('[AdminPanel] Subscribing to buzzer responses for question:', gameState.currentQuestion);
      console.log('[AdminPanel] GameState:', {
        round2Active: gameState.round2Active,
        round2BuzzerActive: gameState.round2BuzzerActive,
        currentQuestion: gameState.currentQuestion
      });
      
      const unsubscribe = FirebaseService.subscribeToBuzzerResponses(
        gameState.currentQuestion,
        async (responses) => {
          console.log('[AdminPanel] Received buzzer responses:', responses.length);
          console.log('[AdminPanel] Raw responses:', JSON.stringify(responses, null, 2));
          
          if (responses.length === 0) {
            console.log('[AdminPanel] No responses yet');
            setBuzzerResponses([]);
            return;
          }
          
          // Fetch user details for each response
          try {
            const responsesWithDetails = await Promise.all(
              responses.map(async (response) => {
                try {
                  const userResult = await FirebaseService.getUserProfile(response.userId);
                  return {
                    ...response,
                    teamName: userResult.success ? userResult.data.teamName : 'Unknown Team'
                  };
                } catch (error) {
                  console.error('[AdminPanel] Error fetching user profile for:', response.userId, error);
                  return {
                    ...response,
                    teamName: 'Unknown Team'
                  };
                }
              })
            );
            
            console.log('[AdminPanel] Buzzer responses with team names:', responsesWithDetails.length);
            setBuzzerResponses(responsesWithDetails);
          } catch (error) {
            console.error('[AdminPanel] Error processing buzzer responses:', error);
            setBuzzerResponses([]);
          }
        }
      );
      return () => {
        console.log('[AdminPanel] Unsubscribing from buzzer responses');
        unsubscribe();
      };
    } else {
      console.log('[AdminPanel] Clearing buzzer responses - selectedRound:', selectedRound, 'currentQuestion:', gameState?.currentQuestion);
      setBuzzerResponses([]);
    }
  }, [selectedRound, gameState?.currentQuestion]);

  const loadParticipants = async () => {
    try {
      const result = await FirebaseService.getAllUsers();
      if (result.success) {
        const allParticipants = result.users.filter(user => !user.isAdmin);
        setParticipants(allParticipants);
        
        // Get qualified count from gameState (default to 10, max 15)
        const qualifiedCount = Math.min(gameState?.qualifiedCount || 10, 15);
        
        // Get qualified participants for Round 2 (top N from Round 1)
        const qualified = allParticipants
          .filter(user => user.round1Score > 0)
          .sort((a, b) => b.round1Score - a.round1Score)
          .slice(0, qualifiedCount);
        
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
      const result = await FirebaseService.enableRound1();
      if (result.success) {
        Alert.alert('Round 1 Started', 'All participants can now see Question 1 with active timer!');
      } else {
        Alert.alert('Error', result.error || 'Failed to start Round 1');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to start Round 1');
    }
  };

  const handleRound1NextQuestion = async () => {
    const nextQuestion = (gameState?.currentQuestion || 1) + 1;
    if (nextQuestion > 20) {
      Alert.alert('Round Complete', 'Round 1 is finished!');
      return;
    }
    
    try {
      const result = await FirebaseService.nextQuestion(1);
      if (!result.success) {
        console.error('Failed to update question:', result.error);
      }
    } catch (error) {
      console.error('Error updating question:', error);
    }
  };

  const handleEndRound1 = () => {
    Alert.alert(
      'End Round 1',
      'This will show Round 1 standings and qualify top 10 teams for Round 2',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'End Round', 
          onPress: async () => {
            try {
              await FirebaseService.updateGameState({
                round1Active: false,
                currentRound: 2
              });
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
    Alert.alert(
      'Start Round 2',
      'This will:\n1. Wait 5 seconds for final scores\n2. Calculate rankings\n3. Qualify top 10-15 teams\n\nProceed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start Round 2',
          onPress: async () => {
            try {
              // Wait 5 seconds for all users to submit final scores
              Alert.alert('Please Wait', 'Waiting for final scores... (5 seconds)');
              await new Promise(resolve => setTimeout(resolve, 5000));
              
              const result = await FirebaseService.enableRound2();
              if (result.success) {
                Alert.alert('Round 2 Started', 'Qualified participants can now join Round 2!');
              } else {
                Alert.alert('Error', result.error || 'Failed to start Round 2');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to start Round 2');
            }
          }
        }
      ]
    );
  };

  const handleRound2NextQuestion = async () => {
    try {
      const nextQuestion = (gameState?.currentQuestion || 1) + 1;
      if (nextQuestion > 15) {
        Alert.alert('Round Complete', 'Round 2 is finished!');
        return;
      }
      
      const result = await FirebaseService.nextQuestion(2);
      if (result.success) {
        Alert.alert('Success', `Ready for Question ${nextQuestion} with fresh timer! Click "Show Question" when ready.`);
      } else {
        Alert.alert('Error', result.error || 'Failed to update question');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update question');
    }
  };

  const handleShowQuestion = async () => {
    try {
      await FirebaseService.updateGameState({
        round2QuestionActive: true,
        round2BuzzerActive: false
      });
      Alert.alert('Question Shown', 'Question is now visible to participants');
    } catch (error) {
      Alert.alert('Error', 'Failed to show question');
    }
  };

  const handleActivateBuzzer = async () => {
    try {
      await FirebaseService.updateGameState({
        round2BuzzerActive: true
      });
      Alert.alert('Buzzer Active', 'Participants can now press the buzzer');
    } catch (error) {
      Alert.alert('Error', 'Failed to activate buzzer');
    }
  };

  const handleResetBuzzer = async () => {
    try {
      await FirebaseService.clearCurrentQuestionBuzzer(gameState?.currentQuestion);
      await FirebaseService.updateGameState({
        round2BuzzerActive: false
      });
      Alert.alert('Buzzer Reset', 'Current question buzzer responses have been cleared');
    } catch (error) {
      Alert.alert('Error', 'Failed to reset buzzer');
    }
  };

  const handleScoreBuzzer = async (userId, questionNumber, points) => {
    try {
      const result = await FirebaseService.scoreBuzzerResponse(userId, questionNumber, points);
      if (result.success) {
        Alert.alert('Points Awarded', `${points > 0 ? '+' : ''}${points} points awarded successfully`);
        await loadParticipants(); // Refresh data
      } else {
        Alert.alert('Error', result.error || 'Failed to award points');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to award points');
    }
  };

  const handleAwardPoints = async (userId, points) => {
    try {
      await FirebaseService.updateUserScore(userId, { round2Score: points });
      await loadParticipants(); // Refresh data
      Alert.alert('Points Awarded', `${points} points awarded successfully`);
    } catch (error) {
      Alert.alert('Error', 'Failed to award points');
    }
  };

  const handleEndRound2 = () => {
    Alert.alert(
      'End Round 2',
      'This will show Round 2 standings and end the game',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'End Game', 
          onPress: async () => {
            try {
              await FirebaseService.updateGameState({
                round2Active: false,
                gameEnded: true
              });
              navigation.navigate('Standings', { 
                round: 2,
                isAdmin: true 
              });
            } catch (error) {
              Alert.alert('Error', 'Failed to end Round 2');
            }
          }
        }
      ]
    );
  };

  const handleResetRound1 = () => {
    Alert.alert(
      'Reset Round 1',
      'This will clear all answers, scores, and progress for Round 1. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset Round 1', 
          style: 'destructive',
          onPress: async () => {
            try {
              setResettingRound(true);
              const result = await FirebaseService.resetRound(1);
              if (result.success) {
                Alert.alert('Round 1 Reset', 'All Round 1 data has been cleared and reset to Question 1');
                await loadParticipants(); // Refresh participant data
              } else {
                Alert.alert('Error', result.error || 'Failed to reset Round 1');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to reset Round 1');
            } finally {
              setResettingRound(false);
            }
          }
        }
      ]
    );
  };

  const handleResetRound2 = () => {
    Alert.alert(
      'Reset Round 2',
      'This will clear all Round 2 answers, buzzer responses, and scores. Round 1 scores will be preserved. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset Round 2', 
          style: 'destructive',
          onPress: async () => {
            try {
              setResettingRound(true);
              const result = await FirebaseService.resetRound(2);
              if (result.success) {
                Alert.alert('Round 2 Reset', 'All Round 2 data has been cleared and reset to Question 1');
                await loadParticipants(); // Refresh participant data
              } else {
                Alert.alert('Error', result.error || 'Failed to reset Round 2');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to reset Round 2');
            } finally {
              setResettingRound(false);
            }
          }
        }
      ]
    );
  };

  const handleResetGame = () => {
    Alert.alert(
      'Reset Entire Game',
      'This will completely reset both rounds, clearing ALL data including:\\n\\n• All user scores and progress\\n• All answers and responses\\n• Game state (back to initial)\\n• Timer and question progress\\n\\nThis action cannot be undone. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset Everything', 
          style: 'destructive',
          onPress: async () => {
            try {
              setResettingRound(true);
              const result = await FirebaseService.resetGame();
              if (result.success) {
                Alert.alert(
                  'Game Reset Complete', 
                  'All game data has been cleared. You can now start fresh!'
                );
                await loadParticipants(); // Refresh participant data
              } else {
                Alert.alert('Error', result.error || 'Failed to reset game');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to reset game');
            } finally {
              setResettingRound(false);
            }
          }
        }
      ]
    );
  };

  const getBuzzerStatus = (participant) => {
    const buzzerActive = gameState?.round2BuzzerActive;
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
        <Text style={styles.headerTitle}>Admin Panel2</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={[styles.resetGameButton, resettingRound && styles.disabledButton]}
            onPress={handleResetGame}
            disabled={resettingRound}
          >
            <Text style={styles.resetGameButtonText}>
              {resettingRound ? 'Resetting...' : 'Reset Game'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.backButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
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
                    
                    <TouchableOpacity 
                      style={[styles.resetButton, resettingRound && styles.disabledButton]} 
                      onPress={handleResetRound1}
                      disabled={resettingRound}
                    >
                      <Text style={styles.buttonText}>
                        {resettingRound ? 'Resetting...' : 'Reset Round'}
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.endButton} onPress={handleEndRound1}>
                      <Text style={styles.buttonText}>End Round 1</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>

              {/* View Standings Button for Round 1 */}
              <View style={styles.buttonRow}>
                <TouchableOpacity 
                  style={styles.standingsButton}
                  onPress={() => navigation.navigate('Standings', { round: 1, isAdmin: true })}
                >
                  <Text style={styles.standingsButtonText}>📊 View Round 1 Standings</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Timer Controls */}
            {gameState?.round1Active && (
              <View style={styles.timerSection}>
                <Text style={styles.timerTitle}>Timer Control</Text>
                <View style={styles.timerInfo}>
                  <Text style={[styles.timerText, { color: gameState?.timerActive ? '#27ae60' : '#e74c3c' }]}>
                    {gameState?.timerActive ? 'Timer Active' : 'Timer Stopped'} • {gameState?.timeRemaining || 90}s remaining
                  </Text>
                </View>
                <View style={styles.timerControls}>
                  {!gameState?.timerActive ? (
                    <TouchableOpacity 
                      style={styles.timerButton}
                      onPress={async () => {
                        try {
                          await FirebaseService.startTimer(90);
                        } catch (error) {
                          console.error('Failed to start timer:', error);
                        }
                      }}
                    >
                      <Text style={styles.timerButtonText}>Start Timer (90s)</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity 
                      style={[styles.timerButton, styles.stopButton]}
                      onPress={async () => {
                        try {
                          await FirebaseService.stopTimer();
                          await FirebaseService.updateGameState({ timerActive: false });
                        } catch (error) {
                          console.error('Failed to stop timer:', error);
                        }
                      }}
                    >
                      <Text style={styles.timerButtonText}>Stop Timer</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity 
                    style={[styles.timerButton, styles.resetTimerButton]}
                    onPress={async () => {
                      try {
                        await FirebaseService.resetTimer(90);
                      } catch (error) {
                        console.error('Failed to reset timer:', error);
                      }
                    }}
                  >
                    <Text style={styles.timerButtonText}>Reset Timer</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Round 1 Stats */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Participants ({participants.length})</Text>
              {participants.length > 0 ? (
                participants
                  .sort((a, b) => (b.round1Score || 0) - (a.round1Score || 0))
                  .map((participant, index) => (
                    <View key={participant.uid} style={styles.participantRow}>
                      <View style={styles.participantInfo}>
                        <Text style={styles.participantName}>
                          #{index + 1} {participant.teamName}
                        </Text>
                        <Text style={styles.participantScore}>
                          Score: {participant.round1Score || 0}
                        </Text>
                      </View>
                      <View style={styles.participantStatus}>
                        <Text style={[
                          styles.statusText,
                          { color: participant.round1Score > 0 ? theme.success : theme.textMuted }
                        ]}>
                          {participant.round1Score > 0 ? 'Active' : 'Waiting'}
                        </Text>
                      </View>
                    </View>
                  ))
              ) : (
                <Text style={styles.noData}>No participants found</Text>
              )}
            </View>
          </>
        ) : (
          <>
            {/* Round 2 Control */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Round 2 Control - Quiz Battle</Text>
              
              <View style={styles.controlRow}>
                <Text style={styles.questionText}>
                  Current Question: {gameState?.currentQuestion || 1} / {gameState?.round2TotalQuestions || 15}
                </Text>
                <Text style={[styles.roundStatus, { color: gameState?.round2Active ? '#27ae60' : '#e74c3c' }]}>
                  {gameState?.round2Active ? 'Active' : 'Inactive'}
                </Text>
              </View>

              <View style={styles.controlRow}>
                <Text style={[styles.statusText, { color: gameState?.round2QuestionActive ? '#27ae60' : '#e74c3c' }]}>
                  Question: {gameState?.round2QuestionActive ? 'Shown' : 'Hidden'}
                </Text>
                <Text style={[styles.statusText, { color: gameState?.round2BuzzerActive ? '#27ae60' : '#e74c3c' }]}>
                  Buzzer: {gameState?.round2BuzzerActive ? 'Active' : 'Inactive'}
                </Text>
              </View>

              <View style={styles.buttonRow}>
                {!gameState?.round2Active ? (
                  <TouchableOpacity style={styles.startButton} onPress={handleStartRound2}>
                    <Text style={styles.buttonText}>Start Round 2</Text>
                  </TouchableOpacity>
                ) : (
                  <>
                    <TouchableOpacity 
                      style={styles.nextButton} 
                      onPress={handleRound2NextQuestion}
                      disabled={(gameState?.currentQuestion || 1) >= (gameState?.round2TotalQuestions || 15)}
                    >
                      <Text style={styles.buttonText}>Next Question</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.actionButton} 
                      onPress={handleShowQuestion}
                      disabled={gameState?.round2QuestionActive}
                    >
                      <Text style={styles.buttonText}>Show Question</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.actionButton} 
                      onPress={handleActivateBuzzer}
                      disabled={gameState?.round2BuzzerActive || !gameState?.round2QuestionActive}
                    >
                      <Text style={styles.buttonText}>Activate Buzzer</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>

              {gameState?.round2Active && (
                <View style={styles.buttonRow}>
                  <TouchableOpacity style={styles.resetButton} onPress={handleResetBuzzer}>
                    <Text style={styles.buttonText}>Reset Buzzer</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.resetButton, styles.resetRoundButton, resettingRound && styles.disabledButton]} 
                    onPress={handleResetRound2}
                    disabled={resettingRound}
                  >
                    <Text style={styles.buttonText}>
                      {resettingRound ? 'Resetting...' : 'Reset Round'}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.endButton} onPress={handleEndRound2}>
                    <Text style={styles.buttonText}>End Round 2</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* View Standings Button for Round 2 */}
              <View style={styles.buttonRow}>
                <TouchableOpacity 
                  style={styles.standingsButton}
                  onPress={() => navigation.navigate('Standings', { round: 2, isAdmin: true })}
                >
                  <Text style={styles.standingsButtonText}>📊 View Round 2 Standings</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Buzzer Rankings for Current Question */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Buzzer Responses - Question {gameState?.currentQuestion}
                </Text>
                <Text style={styles.buzzerInstructions}>
                  Click on a team to award points: +20 (Correct), +0 (Pass), -10 (Wrong)
                </Text>
                {buzzerResponses.length === 0 ? (
                  <View style={styles.noResponsesContainer}>
                    <Text style={styles.noResponsesText}>
                      {gameState?.round2BuzzerActive 
                        ? '⏳ Waiting for teams to buzz in...' 
                        : '🔔 Activate buzzer to start receiving responses'}
                    </Text>
                  </View>
                ) : (
                  buzzerResponses.map((response, index) => (
                  <View key={response.id} style={styles.buzzerResponseRow}>
                    <View style={styles.buzzerResponseInfo}>
                      <Text style={styles.buzzerRank}>#{index + 1}</Text>
                      <View style={styles.buzzerTeamInfo}>
                        <Text style={styles.buzzerTeamName}>{response.teamName}</Text>
                        <Text style={styles.buzzerResponseTime}>{response.responseTime}ms</Text>
                      </View>
                    </View>
                    {!response.scored ? (
                      <View style={styles.buzzerScoreButtons}>
                        <TouchableOpacity 
                          style={[styles.buzzerScoreButton, styles.scorePositive]}
                          onPress={() => handleScoreBuzzer(response.userId, response.questionNumber, 20)}
                        >
                          <Text style={styles.buzzerScoreButtonText}>+20</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={[styles.buzzerScoreButton, styles.scoreNeutral]}
                          onPress={() => handleScoreBuzzer(response.userId, response.questionNumber, 0)}
                        >
                          <Text style={styles.buzzerScoreButtonText}>+0</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={[styles.buzzerScoreButton, styles.scoreNegative]}
                          onPress={() => handleScoreBuzzer(response.userId, response.questionNumber, -10)}
                        >
                          <Text style={styles.buzzerScoreButtonText}>-10</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={styles.buzzerScored}>
                        <Text style={[
                          styles.buzzerScoredText,
                          { color: response.points > 0 ? theme.success : response.points < 0 ? theme.error : theme.textMuted }
                        ]}>
                          {response.points > 0 ? `+${response.points}` : response.points} ✓
                        </Text>
                      </View>
                    )}
                  </View>
                  ))
                )}
              </View>

            {/* Qualified Participants */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Qualified Teams ({qualifiedParticipants.length})</Text>
              {qualifiedParticipants.length > 0 ? (
                qualifiedParticipants
                  .sort((a, b) => (b.totalScore || b.round1Score || 0) - (a.totalScore || a.round1Score || 0))
                  .map((participant, index) => (
                    <View key={participant.uid} style={styles.participantRow}>
                      <View style={styles.participantInfo}>
                        <Text style={styles.participantName}>
                          #{index + 1} {participant.teamName}
                        </Text>
                        <Text style={styles.participantScore}>
                          R1: {participant.round1Score || 0} | R2: {participant.round2Score || 0}
                        </Text>
                      </View>
                      <View style={styles.participantActions}>
                        <TouchableOpacity 
                          style={[styles.pointButton, styles.pointButton10]}
                          onPress={() => handleAwardPoints(participant.uid, 10)}
                        >
                          <Text style={styles.pointButtonText}>+10</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={[styles.pointButton, styles.pointButton20]}
                          onPress={() => handleAwardPoints(participant.uid, 20)}
                        >
                          <Text style={styles.pointButtonText}>+20</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
              ) : (
                <Text style={styles.noData}>No qualified participants yet</Text>
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
  headerTitle: {
    ...typography.h2,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  resetGameButton: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    ...shadows.small,
  },
  resetGameButtonText: {
    color: theme.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  backButton: {
    backgroundColor: theme.error,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    ...shadows.small,
  },
  backButtonText: {
    color: theme.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  roundSelector: {
    flexDirection: 'row',
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    ...shadows.small,
  },
  roundTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: theme.primary,
    ...shadows.small,
  },
  tabText: {
    ...typography.body,
    fontWeight: '600',
  },
  activeTabText: {
    color: theme.textPrimary,
  },
  section: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    ...shadows.medium,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: 15,
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  questionText: {
    ...typography.body,
    flex: 1,
  },
  roundStatus: {
    ...typography.caption,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statusText: {
    ...typography.caption,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  startButton: {
    flex: 1,
    backgroundColor: theme.success,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    ...shadows.small,
  },
  nextButton: {
    flex: 1,
    backgroundColor: theme.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    ...shadows.small,
  },
  actionButton: {
    flex: 1,
    backgroundColor: theme.accent,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    ...shadows.small,
  },
  resetButton: {
    flex: 1,
    backgroundColor: theme.warning,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    ...shadows.small,
  },
  resetRoundButton: {
    backgroundColor: '#e67e22',
  },
  resetTimerButton: {
    backgroundColor: theme.warning,
  },
  endButton: {
    flex: 1,
    backgroundColor: theme.error,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    ...shadows.small,
  },
  buttonText: {
    color: theme.textPrimary,
    fontWeight: '600',
  },
  participantRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: 4,
  },
  participantScore: {
    ...typography.caption,
  },
  participantStatus: {
    marginLeft: 10,
  },
  participantActions: {
    flexDirection: 'row',
    gap: 8,
  },
  pointButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    ...shadows.small,
  },
  pointButton10: {
    backgroundColor: theme.success,
  },
  pointButton20: {
    backgroundColor: theme.primary,
  },
  pointButtonText: {
    color: theme.textPrimary,
    fontWeight: '600',
    fontSize: 12,
  },
  noData: {
    ...typography.caption,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
  timerSection: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    ...shadows.medium,
  },
  timerTitle: {
    ...typography.h4,
    marginBottom: 10,
  },
  timerInfo: {
    marginBottom: 10,
  },
  timerText: {
    ...typography.body,
    fontWeight: '600',
  },
  timerControls: {
    flexDirection: 'row',
    gap: 10,
  },
  timerButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: theme.primary,
    ...shadows.small,
  },
  stopButton: {
    backgroundColor: theme.error,
  },
  timerButtonText: {
    color: theme.textPrimary,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
    backgroundColor: theme.textMuted,
  },
  standingsButton: {
    flex: 1,
    backgroundColor: theme.accent,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 2,
    borderColor: theme.primary,
    ...shadows.medium,
  },
  standingsButtonText: {
    color: theme.textPrimary,
    fontWeight: '600',
    fontSize: 14,
  },
  buzzerInstructions: {
    ...typography.caption,
    color: theme.textSecondary,
    marginBottom: 15,
    fontStyle: 'italic',
  },
  noResponsesContainer: {
    padding: 20,
    borderRadius: 8,
    backgroundColor: theme.surfaceElevated,
    alignItems: 'center',
    marginVertical: 10,
  },
  noResponsesText: {
    ...typography.body,
    color: theme.textSecondary,
    textAlign: 'center',
  },
  buzzerResponseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: theme.surfaceElevated,
    marginBottom: 10,
    ...shadows.small,
  },
  buzzerResponseInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  buzzerRank: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.primary,
    width: 40,
  },
  buzzerTeamInfo: {
    flex: 1,
  },
  buzzerTeamName: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: 2,
  },
  buzzerResponseTime: {
    ...typography.caption,
    color: theme.success,
    fontWeight: 'bold',
  },
  buzzerScoreButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  buzzerScoreButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
    ...shadows.small,
  },
  scorePositive: {
    backgroundColor: theme.success,
  },
  scoreNeutral: {
    backgroundColor: theme.textMuted,
  },
  scoreNegative: {
    backgroundColor: theme.error,
  },
  buzzerScoreButtonText: {
    color: theme.textPrimary,
    fontWeight: 'bold',
    fontSize: 14,
  },
  buzzerScored: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  buzzerScoredText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AdminPanel;
