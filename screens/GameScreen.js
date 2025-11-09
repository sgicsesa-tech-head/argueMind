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
    
    setIsAnswered(true);
    
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
      setShowResult(true);
    } else {
      setResultMessage('Incorrect answer!');
      setShowResult(true);
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
        {!isAnswered && !showResult ? (
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
          </View>
        ) : (
          /* Result Display */
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
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  questionCounter: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  timer: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  pointsContainer: {
    backgroundColor: '#3498db',
    paddingVertical: 10,
    alignItems: 'center',
  },
  pointsText: {
    color: '#fff',
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
    borderColor: '#e1e8ed',
  },
  wordContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  underlines: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    letterSpacing: 8,
  },
  inputContainer: {
    alignItems: 'center',
  },
  answerInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 20,
    fontSize: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e1e8ed',
    width: '100%',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  submitButton: {
    backgroundColor: '#27ae60',
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 40,
    shadowColor: '#27ae60',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  disabledButton: {
    backgroundColor: '#bdc3c7',
    shadowOpacity: 0.1,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  resultContainer: {
    alignItems: 'center',
  },
  resultText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  correctText: {
    color: '#27ae60',
  },
  incorrectText: {
    color: '#e74c3c',
  },
  waitingText: {
    fontSize: 16,
    color: '#7f8c8d',
    fontStyle: 'italic',
  },
  adminControls: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e1e8ed',
  },
  adminButton: {
    backgroundColor: '#9b59b6',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  adminButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default GameScreen;
