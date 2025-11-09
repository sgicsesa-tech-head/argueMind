import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme, shadows, typography } from '../theme';
import { FirebaseService } from '../firebase/gameService';
import { useFirebase } from '../hooks/useFirebase';

const GameScreen = ({ navigation, route }) => {
  const { roundNumber } = route.params || { roundNumber: 1 };
  const { user, gameState, loading: firebaseLoading } = useFirebase();
  
  // Game state
  const [userAnswer, setUserAnswer] = useState('');
  const [isAnswered, setIsAnswered] = useState(false);
  const [userPoints, setUserPoints] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [resultMessage, setResultMessage] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastSubmittedAnswer, setLastSubmittedAnswer] = useState('');
  const [submissionResult, setSubmissionResult] = useState(null); // 'correct', 'incorrect', or null
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Sample questions data (you'll replace this with your actual data)
  const questions = [
    {
      id: 1,
      word: 'ELEPHANT',
      imageUrl: 'https://via.placeholder.com/300x200/cccccc/000000?text=Elephant+Image',
    },
    {
      id: 2,
      word: 'BUTTERFLY',
      imageUrl: 'https://via.placeholder.com/300x200/cccccc/000000?text=Butterfly+Image',
    },
    {
      id: 3,
      word: 'COMPUTER',
      imageUrl: 'https://via.placeholder.com/300x200/cccccc/000000?text=Computer+Image',
    },
    {
      id: 4,
      word: 'RAINBOW',
      imageUrl: 'https://via.placeholder.com/300x200/cccccc/000000?text=Rainbow+Image',
    },
    // Add more questions up to 20...
  ];
  
  // Load user profile and set up real-time listeners
  useEffect(() => {
    if (user) {
      loadUserProfile();
    }
  }, [user]);

  // Listen to game state changes for question updates
  useEffect(() => {
    if (gameState) {
      // Reset answer state when question changes
      if (gameState.currentQuestion !== userProfile?.lastAnsweredQuestion) {
        setUserAnswer('');
        setIsAnswered(false);
        setShowFeedback(false);
        setSubmissionResult(null);
        setLastSubmittedAnswer('');
      }
    }
  }, [gameState?.currentQuestion]);

  const loadUserProfile = async () => {
    try {
      const profile = await FirebaseService.getUserProfile(user.uid);
      if (profile.success) {
        setUserProfile(profile.data);
        setUserPoints(profile.data.round1Score || 0);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const getCurrentQuestionData = () => {
    const questionIndex = (gameState?.currentQuestion || 1) - 1;
    return questions[questionIndex] || questions[0];
  };
  
  const handleSubmit = async () => {
    if (!userAnswer.trim()) {
      Alert.alert('Error', 'Please enter an answer');
      return;
    }
    
    const currentQuestionData = getCurrentQuestionData();
    const isCorrect = userAnswer.toUpperCase() === currentQuestionData.word.toUpperCase();
    
    setLastSubmittedAnswer(userAnswer.toUpperCase());
    setSubmissionResult(isCorrect ? 'correct' : 'incorrect');
    
    try {
      // Submit answer to Firebase
      const result = await FirebaseService.submitAnswer(
        user.uid,
        gameState?.currentQuestion || 1,
        userAnswer,
        roundNumber
      );
      
      if (result.success && isCorrect) {
        const earnedPoints = result.points || 100;
        setUserPoints(userPoints + earnedPoints);
        setResultMessage(`✅ Correct! +${earnedPoints} points`);
        setIsAnswered(true);
        
        // Update local user profile
        if (userProfile) {
          const updatedProfile = {
            ...userProfile,
            round1Score: (userProfile.round1Score || 0) + earnedPoints,
            lastAnsweredQuestion: gameState?.currentQuestion || 1
          };
          setUserProfile(updatedProfile);
        }
        
        // Show correct feedback for 2 seconds, then show waiting message
        setTimeout(() => {
          setResultMessage('Waiting for admin to move to next question...');
          setShowFeedback(true);
        }, 2000);
      } else {
        setResultMessage(`❌ Incorrect! Try again.`);
        setShowFeedback(true);
        setUserAnswer(''); // Clear for retry
        
        // Clear feedback after 2 seconds
        setTimeout(() => {
          setResultMessage('');
          setShowFeedback(false);
          setSubmissionResult(null);
          setLastSubmittedAnswer('');
        }, 2000);
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      Alert.alert('Error', 'Failed to submit answer. Please try again.');
    }
  };
  
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  const getTimerColor = () => {
    if (timeLeft <= 10) return '#e74c3c';
    if (timeLeft <= 30) return '#f39c12';
    return '#2ecc71';
  };

  // Generate interactive underlines that fill in as user types
  const generateInteractiveWord = () => {
    const targetWord = currentQuestionData.word.toUpperCase();
    
    // For display purposes, use lastSubmittedAnswer if we're showing feedback, otherwise current input
    let displayInput;
    if (submissionResult !== null && lastSubmittedAnswer) {
      displayInput = lastSubmittedAnswer.padEnd(targetWord.length, '');
    } else {
      displayInput = userAnswer.toUpperCase().padEnd(targetWord.length, '');
    }
    
    // Determine if we should show submission feedback colors
    const showSubmissionFeedback = submissionResult !== null && lastSubmittedAnswer;
    const isLastSubmissionCorrect = submissionResult === 'correct';
    
    return targetWord.split('').map((letter, index) => {
      const userLetter = displayInput[index] || '';
      const hasUserInput = displayInput[index] && displayInput[index] !== ' ';
      const isCurrentPosition = index === userAnswer.length && !showSubmissionFeedback;
      
      return {
        targetLetter: letter,
        userLetter: hasUserInput ? userLetter : '',
        hasInput: hasUserInput,
        isCurrentPosition: isCurrentPosition,
        showSubmissionFeedback: showSubmissionFeedback,
        isSubmissionCorrect: isLastSubmissionCorrect,
        index: index
      };
    });
  };

  // Check if user can access the round
  if (loading || firebaseLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingText}>Loading game...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!gameState?.round1Active) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.waitingContainer}>
          <Text style={styles.waitingTitle}>Round 1 Not Active</Text>
          <Text style={styles.waitingText}>Please wait for the admin to start Round 1</Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.navigate('Dashboard')}
          >
            <Text style={styles.backButtonText}>Back to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const currentQuestionData = getCurrentQuestionData();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Round {roundNumber}</Text>
        <Text style={styles.questionCounter}>
          Question {gameState?.currentQuestion || 1}/{gameState?.round1TotalQuestions || 20}
        </Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.navigate('Dashboard')}
        >
          <Text style={styles.backButtonText}>Dashboard</Text>
        </TouchableOpacity>
      </View>
      
      {/* Points Display */}
      <View style={styles.pointsContainer}>
        <Text style={styles.pointsText}>Points: {userPoints}</Text>
      </View>
      
      {/* Game Content */}
      <View style={styles.gameContent}>
        {/* Image Display */}
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: currentQuestionData.imageUrl }}
            style={styles.gameImage}
            resizeMode="contain"
          />
        </View>
        
        {/* Interactive Word Display */}
        <View style={styles.wordContainer}>
          <View style={styles.interactiveWordContainer}>
            {generateInteractiveWord().map((letterData, index) => (
              <View key={index} style={[
                styles.letterContainer,
                letterData.isCurrentPosition && styles.currentLetterContainer
              ]}>
                <Text style={[
                  styles.letterText,
                  letterData.isCurrentPosition && styles.currentLetterText,
                  letterData.showSubmissionFeedback && letterData.hasInput && 
                    (letterData.isSubmissionCorrect ? styles.correctLetter : styles.incorrectLetter)
                ]}>
                  {letterData.userLetter || ' '}
                </Text>
                <View style={[
                  styles.letterUnderline,
                  letterData.isCurrentPosition && styles.currentUnderline,
                  letterData.showSubmissionFeedback && letterData.hasInput && 
                    (letterData.isSubmissionCorrect ? styles.correctUnderline : styles.incorrectUnderline)
                ]} />
              </View>
            ))}
          </View>
        </View>
        
        {/* Input Field */}
        {!showResult ? (
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.answerInput}
              placeholder={`Type your answer... (${currentQuestionData.word.length} letters)`}
              placeholderTextColor={theme.placeholder}
              value={userAnswer}
              onChangeText={setUserAnswer}
              autoCapitalize="characters"
              autoCorrect={false}
              editable={timeLeft > 0 && !isAnswered}
              maxLength={currentQuestionData.word.length}
            />
            
            <TouchableOpacity 
              style={[styles.submitButton, (timeLeft === 0 || isAnswered) && styles.disabledButton]}
              onPress={handleSubmit}
              disabled={timeLeft === 0 || isAnswered}
            >
              <Text style={styles.submitButtonText}>Submit</Text>
            </TouchableOpacity>

            {/* Show feedback messages */}
            {(showFeedback || isAnswered) && resultMessage && (
              <View style={[
                styles.feedbackContainer,
                isAnswered && !showFeedback && styles.correctFeedbackContainer
              ]}>
                <Text style={[
                  styles.feedbackText,
                  resultMessage.includes('Correct') ? styles.correctText : styles.incorrectText
                ]}>
                  {resultMessage}
                </Text>
              </View>
            )}
          </View>
        ) : (
          /* Result Display for correct answers - waiting state */
          <View style={styles.resultContainer}>
            <Text style={[
              styles.resultText,
              resultMessage.includes('Correct') ? styles.correctText : styles.incorrectText
            ]}>
              {resultMessage}
            </Text>
            <Text style={styles.waitingText}>
              Waiting for next question...
            </Text>
          </View>
        )}
      </View>
      
      {/* Admin Controls (temporary - will be separate admin panel) */}
      <View style={styles.adminControls}>
        <TouchableOpacity 
          style={styles.adminButton}
          onPress={() => {
            // Simulate admin clicking next question - timer resets for all users
            if (currentQuestion < QUESTIONS_TOTAL) {
              setCurrentQuestion(currentQuestion + 1);
              setUserAnswer('');
              setTimeLeft(TIMER_DURATION); // Reset timer for all users
              setIsAnswered(false);
              setShowResult(false);
              setResultMessage('');
              setShowFeedback(false);
              setLastSubmittedAnswer('');
              setSubmissionResult(null);
              setRoundActive(true); // Reactivate round
            } else {
              // Game finished, show standings
              navigation.navigate('Standings', { points: userPoints });
            }
          }}
        >
          <Text style={styles.adminButtonText}>
            {currentQuestion < QUESTIONS_TOTAL ? 'Next Question (Admin)' : 'View Standings'}
          </Text>
        </TouchableOpacity>
        
        <View style={styles.adminInfo}>
          <Text style={styles.adminInfoText}>
            Timer runs universally for all players • Controlled by admin
          </Text>
        </View>
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
  waitingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  waitingTitle: {
    ...typography.h2,
    textAlign: 'center',
    marginBottom: 20,
  },
  waitingText: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: 30,
  },
  backButton: {
    backgroundColor: theme.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    ...shadows.medium,
  },
  backButtonText: {
    color: theme.textPrimary,
    fontWeight: '600',
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
    ...typography.h3,
  },
  questionCounter: {
    ...typography.caption,
  },
  timerContainer: {
    alignItems: 'center',
  },
  timer: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.textPrimary,
  },
  timerSubtext: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 2,
  },
  pointsContainer: {
    backgroundColor: theme.primary,
    paddingVertical: 10,
    alignItems: 'center',
  },
  pointsText: {
    color: theme.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  gameContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  gameImage: {
    width: 300,
    height: 200,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.border,
  },
  wordContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  interactiveWordContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  letterContainer: {
    alignItems: 'center',
    marginHorizontal: 6,
    marginVertical: 5,
  },
  currentLetterContainer: {
    transform: [{ scale: 1.1 }],
  },
  letterText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.textPrimary,
    minWidth: 30,
    textAlign: 'center',
    minHeight: 35,
  },
  currentLetterText: {
    color: theme.primary,
  },
  correctLetter: {
    color: theme.success,
  },
  incorrectLetter: {
    color: theme.error,
  },
  letterUnderline: {
    width: 30,
    height: 3,
    backgroundColor: theme.border,
    marginTop: 2,
    borderRadius: 1,
  },
  currentUnderline: {
    backgroundColor: theme.primary,
    height: 4,
  },
  correctUnderline: {
    backgroundColor: theme.success,
  },
  incorrectUnderline: {
    backgroundColor: theme.error,
  },
  inputContainer: {
    alignItems: 'center',
  },
  answerInput: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 20,
    fontSize: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.border,
    width: '100%',
    textAlign: 'center',
    textTransform: 'uppercase',
    color: theme.textPrimary,
    ...shadows.small,
  },
  submitButton: {
    backgroundColor: theme.success,
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 40,
    ...shadows.medium,
  },
  disabledButton: {
    backgroundColor: theme.textMuted,
    ...shadows.small,
  },
  submitButtonText: {
    color: theme.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  feedbackContainer: {
    marginTop: 15,
    alignItems: 'center',
    backgroundColor: theme.surfaceElevated,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.error,
  },
  correctFeedbackContainer: {
    borderColor: theme.success,
    backgroundColor: theme.surfaceElevated,
  },
  feedbackText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  resultContainer: {
    alignItems: 'center',
  },
  resultText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: theme.textPrimary,
  },
  correctText: {
    color: theme.success,
  },
  incorrectText: {
    color: theme.error,
  },
  waitingText: {
    fontSize: 16,
    color: theme.textSecondary,
    fontStyle: 'italic',
  },
  adminControls: {
    padding: 20,
    backgroundColor: theme.surface,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  adminButton: {
    backgroundColor: theme.secondary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    ...shadows.small,
  },
  adminButtonText: {
    color: theme.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  adminInfo: {
    marginTop: 10,
    alignItems: 'center',
  },
  adminInfoText: {
    fontSize: 12,
    color: theme.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default GameScreen;
