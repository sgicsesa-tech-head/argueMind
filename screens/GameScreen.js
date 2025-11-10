import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme, shadows, typography } from "../theme";
import { FirebaseService } from "../firebase/gameService";
import { useFirebase } from "../hooks/useFirebase";

const GameScreen = ({ navigation, route }) => {
  const { roundNumber } = route.params || { roundNumber: 1 };
  const { user, gameState, loading: firebaseLoading } = useFirebase();

  // Constants
  const TIMER_DURATION = 90; // 90 seconds
  const QUESTIONS_TOTAL = 20;

  // Game state
  const [userAnswer, setUserAnswer] = useState("");
  const [isAnswered, setIsAnswered] = useState(false);
  const [userPoints, setUserPoints] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [resultMessage, setResultMessage] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastSubmittedAnswer, setLastSubmittedAnswer] = useState("");
  const [submissionResult, setSubmissionResult] = useState(null); // 'correct', 'incorrect', or null
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // LOCAL SCORE TRACKING - Only write to Firebase at end of round
  const [localAnswers, setLocalAnswers] = useState({}); // { questionId: { answer, isCorrect, points, timeRemaining } }
  const [localTotalScore, setLocalTotalScore] = useState(0);
  const [hasSubmittedFinalScore, setHasSubmittedFinalScore] = useState(false);

  // Timer state - use local state for smooth countdown, sync with Firebase
  const [timeLeft, setTimeLeft] = useState(TIMER_DURATION);
  const [timerActive, setTimerActive] = useState(false);

  // State for questions data loaded from JSON
  const [questionsData, setQuestionsData] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);

  // Load questions data on mount
  useEffect(() => {
    loadQuestionsData();
  }, []);

  // Load user profile and set up real-time listeners
  useEffect(() => {
    if (user) {
      loadUserProfile();
    }
  }, [user]);

  // Listen to game state changes for question updates
  useEffect(() => {
    let isMounted = true;

    if (gameState && questionsData && isMounted) {
      // Load current question when game state or questions data changes
      loadCurrentQuestion();

      // Reset answer state when question changes
      const currentQ = gameState.currentQuestion;
      const hasAnsweredThis = localAnswers[currentQ];
      
      if (!hasAnsweredThis && isMounted) {
        setUserAnswer("");
        setIsAnswered(false);
        setShowFeedback(false);
        setSubmissionResult(null);
        setLastSubmittedAnswer("");
      }

      // Check if Round 1 ended - submit final score
      if (gameState.currentRound === 2 && !hasSubmittedFinalScore && !gameState.round1Active && isMounted) {
        submitFinalRound1Score();
      }
    }

    // Cleanup function to prevent memory leaks on Samsung devices
    return () => {
      isMounted = false;
      console.log("GameScreen effect cleanup - preventing state updates after unmount");
    };
  }, [gameState?.currentQuestion, gameState?.currentRound, gameState?.round1Active, questionsData, hasSubmittedFinalScore]);

  // OPTIMIZED Timer - Calculate locally from start time to reduce Firebase reads
  useEffect(() => {
    let interval = null;
    let isMounted = true;

    if (gameState?.timerActive && gameState?.timerStartTime) {
      // Calculate time remaining based on start time (client-side calculation)
      const calculateTimeRemaining = () => {
        const elapsed = Math.floor((Date.now() - gameState.timerStartTime) / 1000);
        const remaining = Math.max(0, (gameState.timerDuration || 90) - elapsed);
        return remaining;
      };

      // Update local time every second
      interval = setInterval(() => {
        if (!isMounted) return;
        
        const remaining = calculateTimeRemaining();
        setTimeLeft(remaining);
        
        if (remaining <= 0) {
          setTimerActive(false);
          if (interval) {
            clearInterval(interval);
            interval = null;
          }
        }
      }, 1000);

      // Set initial value immediately
      if (isMounted) {
        setTimeLeft(calculateTimeRemaining());
        setTimerActive(true);
      }
    } else {
      // Timer not active - use Firebase value or default
      if (isMounted) {
        setTimeLeft(gameState?.timeRemaining || 90);
        setTimerActive(false);
      }
    }

    return () => {
      isMounted = false;
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };
  }, [gameState?.timerActive, gameState?.timerStartTime, gameState?.currentQuestion]);

  const loadQuestionsData = async () => {
    try {
      const result = await FirebaseService.loadQuestionsData();
      if (result.success) {
        setQuestionsData(result.data);
      } else {
        console.error("Failed to load questions:", result.error);
        Alert.alert("Error", "Failed to load questions data");
      }
    } catch (error) {
      console.error("Error loading questions:", error);
    }
  };

  const loadCurrentQuestion = async () => {
    try {
      if (gameState?.currentRound === 1) {
        const result = await FirebaseService.getCurrentQuestion(1);
        if (result.success) {
          setCurrentQuestion(result.question);
        }
      }
    } catch (error) {
      console.error("Error loading current question:", error);
    }
  };

  const loadUserProfile = async () => {
    try {
      const profile = await FirebaseService.getUserProfile(user.uid);
      if (profile.success) {
        setUserProfile(profile.data);
        setUserPoints(profile.data.round1Score || 0);
      }
    } catch (error) {
      console.error("Error loading user profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentQuestionData = () => {
    // Return current question from state, or fallback to first question from data
    if (currentQuestion) {
      return {
        ...currentQuestion,
        imageUrl: currentQuestion.image, // Map 'image' to 'imageUrl' for compatibility
      };
    }

    // Fallback to first question if available
    if (questionsData?.round1Questions?.length > 0) {
      const fallback = questionsData.round1Questions[0];
      return {
        ...fallback,
        imageUrl: fallback.image,
      };
    }

    // Default fallback
    return {
      id: 1,
      word: "LOADING",
      imageUrl:
        "https://via.placeholder.com/300x200/cccccc/000000?text=Loading...",
      points: 10,
    };
  };

  const handleSubmit = async () => {
    if (!userAnswer.trim()) {
      Alert.alert("Error", "Please enter an answer");
      return;
    }

    if (!currentQuestion) {
      Alert.alert("Error", "Question not loaded. Please wait...");
      return;
    }

    setLastSubmittedAnswer(userAnswer.toUpperCase());

    try {
      // Validate answer using Firebase service (only validation, no write)
      const validationResult = await FirebaseService.validateAnswer(
        currentQuestion.id,
        userAnswer.trim(),
        gameState?.currentRound || 1
      );

      if (!validationResult.success) {
        Alert.alert("Error", validationResult.error);
        return;
      }

      const isCorrect = validationResult.isCorrect;
      setSubmissionResult(isCorrect ? "correct" : "incorrect");

      if (isCorrect) {
        // Calculate points: 90 + time remaining
        const earnedPoints = 90 + timeLeft;
        const questionId = gameState?.currentQuestion || 1;

        // Store answer LOCALLY (no Firebase write!)
        setLocalAnswers(prev => ({
          ...prev,
          [questionId]: {
            answer: userAnswer.trim(),
            isCorrect: true,
            points: earnedPoints,
            timeRemaining: timeLeft,
            timestamp: Date.now()
          }
        }));

        // Update local total score
        setLocalTotalScore(prev => prev + earnedPoints);
        setUserPoints(userPoints + earnedPoints);
        setResultMessage(`🎉 Correct! +${earnedPoints} points (Local: ${localTotalScore + earnedPoints})`);
        setIsAnswered(true);

        // Show correct feedback for 2 seconds, then show waiting message
        setTimeout(() => {
          setResultMessage("Waiting for admin to move to next question...");
          setShowFeedback(true);
        }, 2000);
      } else {
        setResultMessage(
          `❌ Incorrect! The answer was: ${validationResult.correctAnswer}`
        );
        setShowFeedback(true);
        setUserAnswer(""); // Clear for retry

        // Clear feedback after 3 seconds for incorrect answers
        setTimeout(() => {
          setResultMessage("");
          setShowFeedback(false);
          setSubmissionResult(null);
          setLastSubmittedAnswer("");
        }, 3000);
      }
      setShowFeedback(true);
    } catch (error) {
      console.error("Error submitting answer:", error);
      Alert.alert("Error", "Failed to validate answer. Please try again.");
    }
  };

  // Submit final Round 1 score to Firebase (SINGLE WRITE!)
  const submitFinalRound1Score = async () => {
    if (hasSubmittedFinalScore) return;

    try {
      console.log(`📤 Submitting final Round 1 score: ${localTotalScore} points`);
      
      const result = await FirebaseService.submitFinalRound1Score(
        user.uid,
        localTotalScore,
        localAnswers
      );

      if (result.success) {
        setHasSubmittedFinalScore(true);
        console.log(`✅ Final score submitted successfully!`);
      } else {
        console.error(`❌ Failed to submit final score:`, result.error);
        // Retry once after 2 seconds
        setTimeout(() => submitFinalRound1Score(), 2000);
      }
    } catch (error) {
      console.error("Error submitting final score:", error);
      // Retry once after 2 seconds
      setTimeout(() => submitFinalRound1Score(), 2000);
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const getTimerColor = () => {
    if (timeLeft <= 10) return "#e74c3c";
    if (timeLeft <= 30) return "#f39c12";
    return "#2ecc71";
  };

  // Generate interactive underlines that fill in as user types
  const generateInteractiveWord = () => {
    const targetWord = currentQuestionData.word.toUpperCase();

    // For display purposes, use lastSubmittedAnswer if we're showing feedback, otherwise current input
    let displayInput;
    if (submissionResult !== null && lastSubmittedAnswer) {
      displayInput = lastSubmittedAnswer.padEnd(targetWord.length, "");
    } else {
      displayInput = userAnswer.toUpperCase().padEnd(targetWord.length, "");
    }

    // Determine if we should show submission feedback colors
    const showSubmissionFeedback =
      submissionResult !== null && lastSubmittedAnswer;
    const isLastSubmissionCorrect = submissionResult === "correct";

    return targetWord.split("").map((letter, index) => {
      const userLetter = displayInput[index] || "";
      const hasUserInput = displayInput[index] && displayInput[index] !== " ";
      const isCurrentPosition =
        index === userAnswer.length && !showSubmissionFeedback;

      return {
        targetLetter: letter,
        userLetter: hasUserInput ? userLetter : "",
        hasInput: hasUserInput,
        isCurrentPosition: isCurrentPosition,
        showSubmissionFeedback: showSubmissionFeedback,
        isSubmissionCorrect: isLastSubmissionCorrect,
        index: index,
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
          <Text style={styles.waitingText}>
            Please wait for the admin to start Round 1
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.navigate("Dashboard")}
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
          Question {gameState?.currentQuestion || 1}/
          {gameState?.round1TotalQuestions || 20}
        </Text>
        <View style={styles.timerContainer}>
          <Text style={[styles.timer, { color: getTimerColor() }]}>
            {formatTime(timeLeft)}
          </Text>
          <Text style={styles.timerSubtext}>
            {timerActive
              ? "Timer Active"
              : timeLeft === 0
              ? "Time Up!"
              : "Timer Stopped"}
          </Text>
        </View>
      </View>

      {/* Points Display */}
      <View style={styles.pointsContainer}>
        <Text style={styles.pointsText}>Points: {userPoints}</Text>
      </View>

      {/* Game Content */}
      <View style={styles.gameContent}>
        {/* Interactive Word Display */}
        <View style={styles.wordContainer}>
          <View style={styles.interactiveWordContainer}>
            {generateInteractiveWord().map((letterData, index) => (
              <View
                key={index}
                style={[
                  styles.letterContainer,
                  letterData.isCurrentPosition && styles.currentLetterContainer,
                ]}
              >
                <Text
                  style={[
                    styles.letterText,
                    letterData.isCurrentPosition && styles.currentLetterText,
                    letterData.showSubmissionFeedback &&
                      letterData.hasInput &&
                      (letterData.isSubmissionCorrect
                        ? styles.correctLetter
                        : styles.incorrectLetter),
                  ]}
                >
                  {letterData.userLetter || " "}
                </Text>
                <View
                  style={[
                    styles.letterUnderline,
                    letterData.isCurrentPosition && styles.currentUnderline,
                    letterData.showSubmissionFeedback &&
                      letterData.hasInput &&
                      (letterData.isSubmissionCorrect
                        ? styles.correctUnderline
                        : styles.incorrectUnderline),
                  ]}
                />
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
              editable={timeLeft > 0 && timerActive && !isAnswered}
              maxLength={currentQuestionData.word.length}
            />

            <TouchableOpacity
              style={[
                styles.submitButton,
                (timeLeft === 0 || !timerActive || isAnswered) &&
                  styles.disabledButton,
              ]}
              onPress={handleSubmit}
              disabled={timeLeft === 0 || !timerActive || isAnswered}
            >
              <Text style={styles.submitButtonText}>Submit</Text>
            </TouchableOpacity>

            {/* Show feedback messages */}
            {(showFeedback || isAnswered) && resultMessage && (
              <View
                style={[
                  styles.feedbackContainer,
                  isAnswered &&
                    !showFeedback &&
                    styles.correctFeedbackContainer,
                ]}
              >
                <Text
                  style={[
                    styles.feedbackText,
                    resultMessage.includes("Correct")
                      ? styles.correctText
                      : styles.incorrectText,
                  ]}
                >
                  {resultMessage}
                </Text>
              </View>
            )}
          </View>
        ) : (
          /* Result Display for correct answers - waiting state */
          <View style={styles.resultContainer}>
            <Text
              style={[
                styles.resultText,
                resultMessage.includes("Correct")
                  ? styles.correctText
                  : styles.incorrectText,
              ]}
            >
              {resultMessage}
            </Text>
            <Text style={styles.waitingText}>Waiting for next question...</Text>
          </View>
        )}
      </View>


      <View style={styles.adminInfo}>
        <Text style={styles.adminInfoText}>
          Timer runs universally for all players • Controlled by admin
        </Text>
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
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: theme.textSecondary,
    marginTop: 10,
    fontSize: 16,
  },
  waitingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  waitingTitle: {
    ...typography.h2,
    textAlign: "center",
    marginBottom: 20,
  },
  waitingText: {
    ...typography.body,
    textAlign: "center",
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
    fontWeight: "600",
    fontSize: 16,
  },
  header: {
    backgroundColor: theme.surface,
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    ...typography.h3,
  },
  questionCounter: {
    ...typography.caption,
  },
  timerContainer: {
    alignItems: "center",
    minWidth: 80,
  },
  timer: {
    fontSize: 18,
    fontWeight: "bold",
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
    alignItems: "center",
  },
  pointsText: {
    color: theme.textPrimary,
    fontSize: 18,
    fontWeight: "bold",
  },
  gameContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  imageContainer: {
    alignItems: "center",
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
    alignItems: "center",
    marginBottom: 30,
  },
  interactiveWordContainer: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  letterContainer: {
    alignItems: "center",
    marginHorizontal: 6,
    marginVertical: 5,
  },
  currentLetterContainer: {
    transform: [{ scale: 1.1 }],
  },
  letterText: {
    fontSize: 28,
    fontWeight: "bold",
    color: theme.textPrimary,
    minWidth: 30,
    textAlign: "center",
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
    alignItems: "center",
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
    width: "100%",
    textAlign: "center",
    textTransform: "uppercase",
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
    fontWeight: "bold",
  },
  feedbackContainer: {
    marginTop: 15,
    alignItems: "center",
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
    fontWeight: "bold",
    textAlign: "center",
  },
  resultContainer: {
    alignItems: "center",
  },
  resultText: {
    fontSize: 20,
    fontWeight: "bold",
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
    fontStyle: "italic",
  },
  bottomControls: {
    padding: 20,
    backgroundColor: theme.surface,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 10,
  },
  backToDashboard: {
    backgroundColor: theme.secondary,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    ...shadows.small,
  },
  backToDashboardText: {
    color: theme.textPrimary,
    fontSize: 14,
    fontWeight: "600",
  },
  timerControlButton: {
    backgroundColor: theme.success,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: 10,
    ...shadows.small,
  },
  timerActiveButton: {
    backgroundColor: theme.error,
  },
  timerControlButtonText: {
    color: theme.textPrimary,
    fontSize: 14,
    fontWeight: "600",
  },
  adminButton: {
    backgroundColor: theme.primary,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 15,
    alignItems: "center",
    flex: 1,
    ...shadows.small,
  },
  adminButtonText: {
    color: theme.textPrimary,
    fontSize: 16,
    fontWeight: "600",
  },
  adminInfo: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: theme.surface,
    alignItems: "center",
  },
  adminInfoText: {
    fontSize: 12,
    color: theme.textSecondary,
    textAlign: "center",
    fontStyle: "italic",
  },
});

export default GameScreen;
