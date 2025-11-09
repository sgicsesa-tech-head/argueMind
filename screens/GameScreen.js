import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme, shadows, typography } from '../theme';

const GameScreen = ({ navigation, route }) => {
  const { roundNumber } = route.params || { roundNumber: 1 };
  
  // Game configuration
  const TIMER_DURATION = 90; // seconds - make this editable
  const QUESTIONS_TOTAL = 20; // 15-25 questions
  
  // Game state
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [userAnswer, setUserAnswer] = useState('');
  const [timeLeft, setTimeLeft] = useState(TIMER_DURATION);
  const [isAnswered, setIsAnswered] = useState(false);
  const [userPoints, setUserPoints] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [resultMessage, setResultMessage] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  
  // Sample questions data (you'll replace this with your actual data)
  const questions = [
    {
      id: 1,
      word: 'ELEPHANT',
      imageUrl: 'https://via.placeholder.com/300x200/cccccc/000000?text=Elephant+Image',
      underlines: '_ _ _ _ _ _ _ _'
    },
    {
      id: 2,
      word: 'BUTTERFLY',
      imageUrl: 'https://via.placeholder.com/300x200/cccccc/000000?text=Butterfly+Image',
      underlines: '_ _ _ _ _ _ _ _ _'
    },
    // Add more questions...
  ];
  
  const currentQuestionData = questions[currentQuestion - 1] || questions[0];
  
  // Timer effect
  useEffect(() => {
    if (timeLeft > 0 && !isAnswered && !showResult) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !isAnswered) {
      handleTimeUp();
    }
  }, [timeLeft, isAnswered, showResult]);
  
  const handleTimeUp = () => {
    Alert.alert('Time Up!', 'Moving to next question...');
    // Handle time up logic here
  };
  
  const handleSubmit = () => {
    if (!userAnswer.trim()) {
      Alert.alert('Error', 'Please enter an answer');
      return;
    }
    
    // Check answer (case insensitive)
    const isCorrect = userAnswer.toUpperCase() === currentQuestionData.word.toUpperCase();
    
    if (isCorrect) {
      // Calculate points based on time and rank (simplified for now)
      const timeTaken = TIMER_DURATION - timeLeft;
      const basePoints = 200;
      const timeBonus = Math.max(0, Math.floor((timeLeft / TIMER_DURATION) * 50));
      const earnedPoints = basePoints + timeBonus;
      
      setUserPoints(userPoints + earnedPoints);
      setResultMessage(`Correct! +${earnedPoints} points`);
      setIsAnswered(true);
      setShowResult(true);
    } else {
      // For wrong answers, show feedback but keep input field active
      setResultMessage('❌ Incorrect answer! Try again.');
      setShowFeedback(true);
      setUserAnswer(''); // Clear the input for next attempt
      
      // Show feedback briefly then clear it
      setTimeout(() => {
        setResultMessage('');
        setShowFeedback(false);
      }, 2000);
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

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Round {roundNumber}</Text>
        <Text style={styles.questionCounter}>Question {currentQuestion}/{QUESTIONS_TOTAL}</Text>
        <Text style={[styles.timer, { color: getTimerColor() }]}>
          {formatTime(timeLeft)}
        </Text>
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
        
        {/* Word Underlines */}
        <View style={styles.wordContainer}>
          <Text style={styles.underlines}>{currentQuestionData.underlines}</Text>
        </View>
        
        {/* Input Field */}
        {!isAnswered || timeLeft > 0 ? (
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.answerInput}
              placeholder="Type your answer..."
              value={userAnswer}
              onChangeText={setUserAnswer}
              autoCapitalize="characters"
              autoCorrect={false}
              editable={timeLeft > 0}
            />
            
            <TouchableOpacity 
              style={[styles.submitButton, timeLeft === 0 && styles.disabledButton]}
              onPress={handleSubmit}
              disabled={timeLeft === 0}
            >
              <Text style={styles.submitButtonText}>Submit</Text>
            </TouchableOpacity>

            {/* Show feedback for wrong answers */}
            {showFeedback && resultMessage && (
              <View style={styles.feedbackContainer}>
                <Text style={[
                  styles.feedbackText,
                  styles.incorrectText
                ]}>
                  {resultMessage}
                </Text>
              </View>
            )}
          </View>
        ) : (
          /* Result Display for correct answers */
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
            // Simulate admin clicking next question
            if (currentQuestion < QUESTIONS_TOTAL) {
              setCurrentQuestion(currentQuestion + 1);
              setUserAnswer('');
              setTimeLeft(TIMER_DURATION);
              setIsAnswered(false);
              setShowResult(false);
              setResultMessage('');
              setShowFeedback(false);
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
  timer: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.textPrimary,
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
  underlines: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.textPrimary,
    letterSpacing: 8,
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
});

export default GameScreen;
