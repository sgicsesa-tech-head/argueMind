import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy,
  addDoc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import { db, auth } from './config';

export class FirebaseService {
  
  // Authentication Methods - Only login for predefined users
  static async createPredefinedUser(email, password, teamName, isAdmin = false) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Create user document in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: email,
        teamName: teamName,
        round1Score: 0,
        round2Score: 0,
        totalScore: 0,
        round1Rank: null,
        round2Rank: null,
        finalRank: null,
        qualified: false,
        isAdmin: isAdmin,
        createdAt: serverTimestamp(),
        lastActive: serverTimestamp()
      });

      return { success: true, user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async loginUser(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Check if user profile exists, create if it doesn't
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        // Create user profile if it doesn't exist
        const userData = {
          uid: user.uid,
          email: user.email,
          teamName: user.email.split('@')[0] || 'Team', // Use email prefix as team name
          round1Score: 0,
          round2Score: 0,
          totalScore: 0,
          round1Rank: null,
          round2Rank: null,
          finalRank: null,
          qualified: false,
          isAdmin: false,
          createdAt: serverTimestamp(),
          lastActive: serverTimestamp()
        };

        await setDoc(userRef, userData);
        console.log("User profile created for:", user.email);
      } else {
        // Update last active if profile exists
        await updateDoc(userRef, { 
          lastActive: serverTimestamp() 
        });
      }

      return { success: true, user };
    } catch (error) {
      console.error('Login error:', error);
      
      // Handle specific Firebase Auth errors
      let errorMessage = "Invalid credentials. Please contact admin to get your login details.";
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = "No user found with this email. Please contact admin for credentials.";
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = "Incorrect password. Please try again or contact admin.";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Invalid email format. Please check your email.";
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = "This account has been disabled. Please contact admin.";
      }

      return { success: false, error: errorMessage };
    }
  }

  static async signOut() {
    try {
      await firebaseSignOut(auth);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static onAuthStateChanged(callback) {
    return onAuthStateChanged(auth, callback);
  }

  // User Profile Management
  static async getUserProfile(uid) {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        return { success: true, data: userDoc.data() };
      } else {
        return { success: false, error: 'User profile not found' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async updateUserProfile(uid, updates) {
    try {
      await updateDoc(doc(db, 'users', uid), {
        ...updates,
        lastUpdated: serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async getAllUsers() {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const users = [];
      usersSnapshot.forEach((doc) => {
        users.push({ uid: doc.id, ...doc.data() });
      });
      return { success: true, users };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async updateQualifiedUsers(qualifiedUids) {
    try {
      const batch = db.batch ? db.batch() : null;
      
      // First get all users to reset qualification status
      const allUsersResult = await this.getAllUsers();
      if (!allUsersResult.success) return allUsersResult;

      // Update each user's qualification status
      for (const user of allUsersResult.users) {
        const userRef = doc(db, 'users', user.uid);
        const isQualified = qualifiedUids.includes(user.uid);
        
        if (batch) {
          batch.update(userRef, { qualified: isQualified });
        } else {
          await updateDoc(userRef, { qualified: isQualified });
        }
      }

      if (batch) {
        await batch.commit();
      }
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Game State Management
  static async createGameState() {
    try {
      const gameRef = doc(db, 'gameState', 'current');
      await setDoc(gameRef, {
        round1Active: false,
        round2Active: false,
        currentRound: 1,
        currentQuestion: 1,
        round1TotalQuestions: 20,
        round2TotalQuestions: 15,
        timerDuration: 90,
        timeRemaining: 90,
        timerActive: false,
        round2BuzzerActive: false,
        round2QuestionActive: false,
        gameStarted: false,
        gameEnded: false,
        qualifiedCount: 10,
        lastUpdated: serverTimestamp(),
        adminUid: null
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static subscribeToGameState(callback) {
    const gameRef = doc(db, 'gameState', 'current');
    
    const defaultGameState = {
      round1Active: false,
      round2Active: false,
      currentRound: 1,
      currentQuestion: 1,
      round1TotalQuestions: 20,
      round2TotalQuestions: 15,
      timerDuration: 90,
      timeRemaining: 90,
      timerActive: false,
      timerStartTime: null,
      round2BuzzerActive: false,
      round2QuestionActive: false,
      gameStarted: false,
      gameEnded: false
    };
    
    // Enhanced snapshot listener with better error handling for 60+ concurrent users
    return onSnapshot(
      gameRef,
      {
        // Include metadata changes for better sync
        includeMetadataChanges: false,
      },
      (snapshot) => {
        try {
          if (snapshot.exists()) {
            callback(snapshot.data());
          } else {
            // Return default state and try to create it
            callback(defaultGameState);
            this.createGameState().catch((error) => {
              console.log('Could not create game state:', error.message);
            });
          }
        } catch (error) {
          console.log('Error processing game state snapshot:', error.message);
          callback(defaultGameState);
        }
      },
      (error) => {
        console.log('Game state listener error:', error.message);
        // Return default state on error (handles connection issues gracefully)
        callback(defaultGameState);
        
        // Don't throw error - just log it to prevent crashes with many users
        if (error.code === 'resource-exhausted') {
          console.error('⚠️ Firebase quota exceeded - contact admin');
        } else if (error.code === 'permission-denied') {
          console.error('⚠️ Permission denied - check Firebase rules');
        }
      }
    );
  }

  static async updateGameState(updates) {
    try {
      const gameRef = doc(db, 'gameState', 'current');
      await updateDoc(gameRef, {
        ...updates,
        lastUpdated: serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Admin Controls
  static async enableRound1() {
    const result = await this.updateGameState({
      round1Active: true,
      gameStarted: true,
      currentRound: 1,
      currentQuestion: 1,
      timerActive: false,
      timeRemaining: 90,
      timerStartTime: null
    });
    
    // DO NOT auto-start timer - let admin control when to start
    // Admin needs to manually click "Start Timer" 
    
    return result;
  }

  static async nextQuestion(round) {
    try {
      const gameRef = doc(db, 'gameState', 'current');
      const gameDoc = await getDoc(gameRef);
      
      if (gameDoc.exists()) {
        const gameData = gameDoc.data();
        const currentQuestion = gameData.currentQuestion + 1;
        
        // Stop current timer first
        this.stopTimer();
        
        // Update game state - Reset timer but don't start it automatically
        const result = await this.updateGameState({
          currentQuestion: currentQuestion,
          timerActive: false,
          timeRemaining: 90,
          timerStartTime: null,
          round2BuzzerActive: false,
          round2QuestionActive: round === 2 ? false : gameData.round2QuestionActive
        });
        
        // DO NOT auto-start timer - let admin control when to start
        // Admin needs to manually click "Start Timer" for each question
        
        return result;
      }
      
      return { success: false, error: 'Game state not found' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async enableRound2() {
    try {
      // Stop any existing timer
      this.stopTimer();
      
      // First, calculate qualified participants
      await this.calculateRound1Rankings();
      
      const result = await this.updateGameState({
        round1Active: false,
        round2Active: true,
        currentRound: 2,
        currentQuestion: 1,
        timerActive: false,
        timeRemaining: 90,
        timerStartTime: null
      });
      
      // DO NOT auto-start timer - let admin control when to start
      // Admin needs to manually click "Start Timer" 
      
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async enableRound2Question() {
    return await this.updateGameState({
      round2QuestionActive: true
    });
  }

  static async enableRound2Buzzer() {
    return await this.updateGameState({
      round2BuzzerActive: true,
      buzzerStartTime: serverTimestamp()
    });
  }

  // Timer Management - Optimized for Low Firebase Usage
  static timerInterval = null;

  static async startTimer(duration = 90) {
    try {
      // Clear any existing timer
      this.stopTimer();
      
      // OPTIMIZED: Only write start time and duration to Firestore (1 write instead of 90!)
      // Clients will calculate remaining time locally
      await this.updateGameState({
        timerActive: true,
        timerDuration: duration,
        timerStartTime: Date.now(), // Use timestamp for client-side calculation
        timeRemaining: duration, // Initial value for display
        lastUpdated: serverTimestamp()
      });

      console.log(`✅ Timer started: ${duration}s (optimized mode - 1 write only)`);
      return { success: true };
    } catch (error) {
      console.error('Error starting timer:', error);
      return { success: false, error: error.message };
    }
  }

  static async stopTimer() {
    try {
      // OPTIMIZED: Only write when stopping (1 write instead of continuous)
      await this.updateGameState({
        timerActive: false,
        timerStartTime: null,
        lastUpdated: serverTimestamp()
      });
      
      console.log('✅ Timer stopped (optimized mode)');
      return { success: true };
    } catch (error) {
      console.error('Error stopping timer:', error);
      return { success: false, error: error.message };
    }
  }

  static async resetTimer(duration = 90) {
    try {
      // OPTIMIZED: Only write reset state (1 write)
      await this.updateGameState({
        timerActive: false,
        timerDuration: duration,
        timerStartTime: null,
        timeRemaining: duration,
        lastUpdated: serverTimestamp()
      });
      
      console.log(`✅ Timer reset to ${duration}s (optimized mode)`);
      return { success: true };
    } catch (error) {
      console.error('Error resetting timer:', error);
      return { success: false, error: error.message };
    }
  }

  // Score Management
  static async updateUserScore(userId, round, points) {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const scoreField = `round${round}Score`;
        const newScore = (userData[scoreField] || 0) + points;
        const newTotal = (userData.round1Score || 0) + (userData.round2Score || 0) + 
                        (round === 1 ? points : 0) + (round === 2 ? points : 0);
        
        await updateDoc(userRef, {
          [scoreField]: newScore,
          totalScore: newTotal,
          lastUpdated: serverTimestamp()
        });
        
        return { success: true };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // OPTIMIZED: Submit final Round 1 score (SINGLE WRITE instead of 20 writes)
  static async submitFinalRound1Score(userId, totalScore, answersData) {
    try {
      const userRef = doc(db, 'users', userId);
      
      // Single write with all Round 1 data
      await updateDoc(userRef, {
        round1Score: totalScore,
        round1Answers: answersData, // Store all answers for verification if needed
        round1Completed: true,
        lastUpdated: serverTimestamp()
      });

      console.log(`✅ Final Round 1 score saved: ${totalScore} points (1 write only)`);
      return { success: true };
    } catch (error) {
      console.error('Error submitting final Round 1 score:', error);
      return { success: false, error: error.message };
    }
  }

  // Answer Submission with Ranking-Based Points
  static async submitAnswer(userId, questionNumber, answer, roundNumber, isCorrectAnswer = false) {
    try {
      let calculatedPoints = 0;
      
      if (isCorrectAnswer) {
        // Calculate points based on submission order (base 90 points + ranking multiplier)
        calculatedPoints = await this.calculateRankingPoints(userId, questionNumber, roundNumber);
      }
      
      // Create answer submission record
      const answersRef = collection(db, 'answers');
      const answerDoc = await addDoc(answersRef, {
        userId: userId,
        questionNumber: questionNumber,
        answer: answer.toUpperCase(),
        roundNumber: roundNumber,
        timestamp: serverTimestamp(),
        isCorrect: isCorrectAnswer,
        points: calculatedPoints
      });

      if (isCorrectAnswer && calculatedPoints > 0) {
        // Update user's score
        await this.updateUserScore(userId, roundNumber, calculatedPoints);
      }

      return { success: true, isCorrect: isCorrectAnswer, points: calculatedPoints };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Calculate points based on time remaining
  static async calculateRankingPoints(userId, questionNumber, roundNumber) {
    try {
      // Get current game state to check time remaining
      const gameRef = doc(db, 'gameState', 'current');
      const gameDoc = await getDoc(gameRef);
      
      let timeRemaining = 0;
      if (gameDoc.exists()) {
        const gameData = gameDoc.data();
        timeRemaining = gameData.timeRemaining || 0;
      }
      
      // Base points: 90
      const basePoints = 90;
      
      // Time bonus: Based on time remaining (0 to 90 seconds)
      // If 90s remaining (answered immediately): 90 + 90 = 180 points
      // If 45s remaining (answered at 45s): 90 + 45 = 135 points
      // If 10s remaining (answered at 80s): 90 + 10 = 100 points
      // If 0s remaining (answered at last second): 90 + 0 = 90 points
      const timeBonus = Math.max(0, Math.min(90, timeRemaining));
      
      return basePoints + timeBonus;
    } catch (error) {
      console.error('Error calculating ranking points:', error);
      return 90; // Fallback to base points
    }
  }

  // Buzzer System
  static async pressBuzzer(userId, questionNumber, responseTime) {
    try {
      const buzzerRef = collection(db, 'buzzerResponses');
      await addDoc(buzzerRef, {
        userId: userId,
        questionNumber: questionNumber,
        responseTime: responseTime,
        timestamp: serverTimestamp(),
        scored: false,
        points: 0
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async scoreBuzzerResponse(userId, questionNumber, points) {
    try {
      // Find the buzzer response
      const buzzerQuery = query(
        collection(db, 'buzzerResponses'),
        where('userId', '==', userId),
        where('questionNumber', '==', questionNumber),
        where('scored', '==', false)
      );
      
      const buzzerDocs = await getDocs(buzzerQuery);
      
      if (!buzzerDocs.empty) {
        const buzzerDoc = buzzerDocs.docs[0];
        await updateDoc(buzzerDoc.ref, {
          scored: true,
          points: points,
          scoredAt: serverTimestamp()
        });

        // Update user's round 2 score
        await this.updateUserScore(userId, 2, points);
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Leaderboard and Rankings
  static subscribeToLeaderboard(callback) {
    const usersQuery = query(
      collection(db, 'users'),
      where('isAdmin', '==', false),
      orderBy('totalScore', 'desc')
    );
    
    return onSnapshot(usersQuery, 
      (snapshot) => {
        const users = [];
        snapshot.forEach((doc) => {
          users.push({ uid: doc.id, ...doc.data() });
        });
        callback(users);
      },
      (error) => {
        console.log('Leaderboard listener error (offline mode):', error.message);
        // Return empty array in offline mode
        callback([]);
      }
    );
  }

  static async calculateRound1Rankings() {
    try {
      const usersQuery = query(
        collection(db, 'users'),
        where('isAdmin', '==', false),
        orderBy('round1Score', 'desc')
      );
      
      const usersSnapshot = await getDocs(usersQuery);
      const users = [];
      
      usersSnapshot.forEach((doc) => {
        users.push({ id: doc.id, ...doc.data() });
      });

      // Get qualified count from game state
      const gameStateDoc = await getDoc(doc(db, 'gameState', 'current'));
      const qualifiedCount = gameStateDoc.exists() ? 
        Math.min(gameStateDoc.data().qualifiedCount || 10, 15) : 10;

      // Update rankings and qualify top players
      for (let i = 0; i < users.length; i++) {
        const user = users[i];
        const rank = i + 1;
        const qualified = rank <= qualifiedCount; // Top N qualify for round 2

        await updateDoc(doc(db, 'users', user.id), {
          round1Rank: rank,
          qualified: qualified,
          lastUpdated: serverTimestamp()
        });
      }

      return { success: true, qualifiedUsers: users.slice(0, qualifiedCount) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get user data
  static async getUserData(userId) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        return { success: true, data: userDoc.data() };
      }
      return { success: false, error: 'User not found' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Subscribe to user data changes
  static subscribeToUser(userId, callback) {
    const userRef = doc(db, 'users', userId);
    return onSnapshot(userRef, 
      (snapshot) => {
        if (snapshot.exists()) {
          callback(snapshot.data());
        }
      },
      (error) => {
        console.log('User listener error (offline mode):', error.message);
        // Don't callback with null in offline mode
      }
    );
  }

  // Questions Management (you can expand this)
  static async getQuestionsForRound(round) {
    try {
      const questionsQuery = query(
        collection(db, 'questions'),
        where('round', '==', round),
        orderBy('questionNumber', 'asc')
      );
      
      const questionsSnapshot = await getDocs(questionsQuery);
      const questions = [];
      
      questionsSnapshot.forEach((doc) => {
        questions.push({ id: doc.id, ...doc.data() });
      });

      return { success: true, questions };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Questions Management - Enhanced
  static questionsData = null;

  static async loadQuestionsData() {
    try {
      if (!this.questionsData) {
        // Import the questions data
        const questionsModule = await import('../data/questions.json');
        this.questionsData = questionsModule.default || questionsModule;
      }
      return { success: true, data: this.questionsData };
    } catch (error) {
      console.error('Error loading questions data:', error);
      return { success: false, error: error.message };
    }
  }

  static async getCurrentQuestion(round = 1) {
    try {
      const questionsResult = await this.loadQuestionsData();
      if (!questionsResult.success) {
        return questionsResult;
      }

      const gameRef = doc(db, 'gameState', 'current');
      const gameDoc = await getDoc(gameRef);
      
      if (!gameDoc.exists()) {
        return { success: false, error: 'Game state not found' };
      }

      const gameData = gameDoc.data();
      const questionNumber = gameData.currentQuestion || 1;
      
      if (round === 1) {
        const question = questionsResult.data.round1Questions?.find(q => q.id === questionNumber);
        if (!question) {
          return { success: false, error: `Question ${questionNumber} not found` };
        }
        return { success: true, question };
      }
      
      // Add Round 2 questions handling later if needed
      return { success: false, error: 'Round 2 questions not implemented yet' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async validateAnswer(questionId, userAnswer, round = 1) {
    try {
      const questionsResult = await this.loadQuestionsData();
      if (!questionsResult.success) {
        return questionsResult;
      }

      if (round === 1) {
        const question = questionsResult.data.round1Questions?.find(q => q.id === questionId);
        if (!question) {
          return { success: false, error: 'Question not found' };
        }

        // Normalize both answers for comparison
        const normalizedUserAnswer = userAnswer.toLowerCase().trim();
        const normalizedCorrectAnswer = question.word.toLowerCase().trim();
        
        const isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;
        const points = isCorrect ? question.points : 0;
        
        return { 
          success: true, 
          isCorrect, 
          points, 
          correctAnswer: question.word,
          difficulty: question.difficulty 
        };
      }
      
      return { success: false, error: 'Round 2 validation not implemented yet' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Initialize the application (call this once on app start)
  static async initializeApp() {
    try {
      // Try to initialize offline support first
      const { initializeOfflineSupport } = await import('./config');
      await initializeOfflineSupport();
      
      // Check if game state exists, if not create it
      const gameStateDoc = await getDoc(doc(db, 'gameState', 'current'));
      if (!gameStateDoc.exists()) {
        console.log('Creating default game state...');
        await this.createGameState();
      }
      
      console.log('Firebase app initialized successfully');
      return { success: true };
    } catch (error) {
      // Don't fail if offline - Firebase will sync when online
      if (error.message?.includes('offline') || error.message?.includes('network')) {
        console.log('App initialized in offline mode');
        return { success: true, offline: true };
      }
      
      console.error('Error initializing app:', error);
      return { success: false, error: error.message };
    }
  }

  // App Lifecycle Management
  static cleanup() {
    // Clean up any running timers
    this.stopTimer();
  }

  // Enhanced initialization with timer management
  static async initialize() {
    try {
      // Clean up any existing timers first
      this.cleanup();
      
      // Initialize the app
      const result = await this.initializeApp();
      
      // Check if there's an active timer that needs to be resumed
      const gameRef = doc(db, 'gameState', 'current');
      const gameDoc = await getDoc(gameRef);
      
      if (gameDoc.exists()) {
        const gameData = gameDoc.data();
        
        // If timer was active but we don't have a running interval, restart it
        if (gameData.timerActive && !this.timerInterval && gameData.timeRemaining > 0) {
          console.log('Resuming timer from stored state...');
          await this.startTimer(gameData.timeRemaining);
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error during Firebase initialization:', error);
      return { success: false, error: error.message };
    }
  }

  // Round Reset Functionality
  static async resetRound(roundNumber) {
    try {
      // Stop any active timer
      this.stopTimer();
      
      if (roundNumber === 1) {
        // Reset Round 1 - keep inactive until admin starts it
        const result = await this.updateGameState({
          round1Active: false,
          currentQuestion: 1,
          timerActive: false,
          timeRemaining: 90,
          timerStartTime: null,
          gameStarted: false
        });
        
        // Clear all Round 1 answers
        const answersQuery = query(
          collection(db, 'answers'),
          where('roundNumber', '==', 1)
        );
        const answersSnapshot = await getDocs(answersQuery);
        
        // Delete all Round 1 answers
        const deletePromises = answersSnapshot.docs.map(docRef => deleteDoc(docRef.ref));
        await Promise.all(deletePromises);
        
        // Reset all user Round 1 scores
        const usersQuery = query(
          collection(db, 'users'),
          where('isAdmin', '==', false)
        );
        const usersSnapshot = await getDocs(usersQuery);
        
        const updateUserPromises = usersSnapshot.docs.map(userDoc => 
          updateDoc(userDoc.ref, {
            round1Score: 0,
            lastAnsweredQuestion: 0,
            totalScore: userDoc.data().round2Score || 0
          })
        );
        await Promise.all(updateUserPromises);
        
        return result;
      } else if (roundNumber === 2) {
        // Reset Round 2 - keep inactive until admin starts it
        const result = await this.updateGameState({
          round2Active: false,
          currentQuestion: 1,
          timerActive: false,
          timeRemaining: 90,
          timerStartTime: null,
          round2QuestionActive: false,
          round2BuzzerActive: false
        });
        
        // Clear all Round 2 answers and buzzer responses
        const answersQuery = query(
          collection(db, 'answers'),
          where('roundNumber', '==', 2)
        );
        const answersSnapshot = await getDocs(answersQuery);
        
        const buzzerQuery = collection(db, 'buzzerResponses');
        const buzzerSnapshot = await getDocs(buzzerQuery);
        
        // Delete all Round 2 data
        const deletePromises = [
          ...answersSnapshot.docs.map(docRef => deleteDoc(docRef.ref)),
          ...buzzerSnapshot.docs.map(docRef => deleteDoc(docRef.ref))
        ];
        await Promise.all(deletePromises);
        
        // Reset all user Round 2 scores (keep Round 1 scores)
        const usersQuery = query(
          collection(db, 'users'),
          where('isAdmin', '==', false)
        );
        const usersSnapshot = await getDocs(usersQuery);
        
        const updateUserPromises = usersSnapshot.docs.map(userDoc => 
          updateDoc(userDoc.ref, {
            round2Score: 0,
            totalScore: userDoc.data().round1Score || 0,
            qualified: (userDoc.data().round1Score || 0) > 0
          })
        );
        await Promise.all(updateUserPromises);
        
        return result;
      }
      
      return { success: false, error: 'Invalid round number' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Complete Game Reset - Resets everything to initial state
  static async resetGame() {
    try {
      // Stop any active timer
      this.stopTimer();
      
      // Reset game state to initial values
      const result = await this.updateGameState({
        round1Active: false,
        round2Active: false,
        currentRound: 1,
        currentQuestion: 1,
        timerActive: false,
        timeRemaining: 90,
        timerStartTime: null,
        round2QuestionActive: false,
        round2BuzzerActive: false,
        gameStarted: false,
        gameEnded: false
      });
      
      if (!result.success) {
        return result;
      }
      
      // Clear all answers for both rounds
      const answersQuery = collection(db, 'answers');
      const answersSnapshot = await getDocs(answersQuery);
      
      // Clear all buzzer responses
      const buzzerQuery = collection(db, 'buzzerResponses');
      const buzzerSnapshot = await getDocs(buzzerQuery);
      
      // Delete all game data
      const deletePromises = [
        ...answersSnapshot.docs.map(docRef => deleteDoc(docRef.ref)),
        ...buzzerSnapshot.docs.map(docRef => deleteDoc(docRef.ref))
      ];
      await Promise.all(deletePromises);
      
      // Reset all user scores and states (keep user accounts but reset game progress)
      const usersQuery = query(
        collection(db, 'users'),
        where('isAdmin', '==', false)
      );
      const usersSnapshot = await getDocs(usersQuery);
      
      const updateUserPromises = usersSnapshot.docs.map(userDoc => 
        updateDoc(userDoc.ref, {
          round1Score: 0,
          round2Score: 0,
          totalScore: 0,
          round1Rank: null,
          round2Rank: null,
          finalRank: null,
          qualified: false,
          lastAnsweredQuestion: 0,
          lastActive: serverTimestamp()
        })
      );
      await Promise.all(updateUserPromises);
      
      return { success: true };
    } catch (error) {
      console.error('Error resetting game:', error);
      return { success: false, error: error.message };
    }
  }

  // Reset buzzer responses for current round
  static async resetBuzzerRound() {
    try {
      const buzzerQuery = collection(db, 'buzzerResponses');
      const buzzerSnapshot = await getDocs(buzzerQuery);
      
      // Delete all buzzer responses
      const deletePromises = buzzerSnapshot.docs.map(docRef => deleteDoc(docRef.ref));
      await Promise.all(deletePromises);
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get buzzer responses for current question
  static async getBuzzerResponses(questionNumber) {
    try {
      const buzzerQuery = query(
        collection(db, 'buzzerResponses'),
        where('questionNumber', '==', questionNumber),
        orderBy('responseTime', 'asc')
      );
      
      const buzzerSnapshot = await getDocs(buzzerQuery);
      const responses = [];
      
      buzzerSnapshot.forEach((doc) => {
        responses.push({ id: doc.id, ...doc.data() });
      });
      
      return { success: true, responses };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Subscribe to buzzer responses for real-time updates
  static subscribeToBuzzerResponses(questionNumber, callback) {
    try {
      const buzzerQuery = query(
        collection(db, 'buzzerResponses'),
        where('questionNumber', '==', questionNumber),
        orderBy('responseTime', 'asc')
      );
      
      return onSnapshot(buzzerQuery, 
        (snapshot) => {
          const responses = [];
          snapshot.forEach((doc) => {
            responses.push({ id: doc.id, ...doc.data() });
          });
          console.log('Firebase listener - received responses:', responses.length, 'for question:', questionNumber);
          callback(responses);
        },
        (error) => {
          console.error('Buzzer listener error:', error);
          // If orderBy fails due to missing index, try without ordering
          if (error.code === 'failed-precondition' || error.code === 'permission-denied') {
            console.log('Retrying without orderBy...');
            const simpleQuery = query(
              collection(db, 'buzzerResponses'),
              where('questionNumber', '==', questionNumber)
            );
            
            return onSnapshot(simpleQuery,
              (snapshot) => {
                const responses = [];
                snapshot.forEach((doc) => {
                  responses.push({ id: doc.id, ...doc.data() });
                });
                // Sort manually
                responses.sort((a, b) => a.responseTime - b.responseTime);
                console.log('Firebase listener (fallback) - received responses:', responses.length);
                callback(responses);
              },
              (err) => {
                console.error('Fallback listener also failed:', err);
                callback([]);
              }
            );
          }
          callback([]);
        }
      );
    } catch (error) {
      console.error('Error setting up buzzer subscription:', error);
      callback([]);
      return () => {}; // Return empty unsubscribe function
    }
  }

  // Clear buzzer responses for current question only
  static async clearCurrentQuestionBuzzer(questionNumber) {
    try {
      const buzzerQuery = query(
        collection(db, 'buzzerResponses'),
        where('questionNumber', '==', questionNumber)
      );
      
      const buzzerSnapshot = await getDocs(buzzerQuery);
      const deletePromises = buzzerSnapshot.docs.map(docRef => deleteDoc(docRef.ref));
      await Promise.all(deletePromises);
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

}
