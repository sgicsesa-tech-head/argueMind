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
  
  // Authentication Methods
  static async registerUser(email, password, teamName) {
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
        isAdmin: false,
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
      
      // Update last active
      await updateDoc(doc(db, 'users', user.uid), {
        lastActive: serverTimestamp()
      });

      return { success: true, user };
    } catch (error) {
      return { success: false, error: error.message };
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
      round2BuzzerActive: false,
      round2QuestionActive: false,
      gameStarted: false,
      gameEnded: false
    };
    
    return onSnapshot(gameRef, 
      (snapshot) => {
        if (snapshot.exists()) {
          callback(snapshot.data());
        } else {
          // Return default state and try to create it
          callback(defaultGameState);
          this.createGameState().catch(console.error);
        }
      },
      (error) => {
        console.log('Game state listener error (offline mode):', error.message);
        // Return default state in offline mode
        callback(defaultGameState);
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
    return await this.updateGameState({
      round1Active: true,
      gameStarted: true,
      timerActive: true,
      timeRemaining: 90
    });
  }

  static async nextQuestion(round) {
    const gameRef = doc(db, 'gameState', 'current');
    const gameDoc = await getDoc(gameRef);
    
    if (gameDoc.exists()) {
      const gameData = gameDoc.data();
      const currentQuestion = gameData.currentQuestion + 1;
      
      return await this.updateGameState({
        currentQuestion: currentQuestion,
        timerActive: true,
        timeRemaining: 90,
        round2BuzzerActive: false,
        round2QuestionActive: round === 2 ? false : gameData.round2QuestionActive
      });
    }
  }

  static async enableRound2() {
    // First, calculate qualified participants
    await this.calculateRound1Rankings();
    
    return await this.updateGameState({
      round1Active: false,
      round2Active: true,
      currentRound: 2,
      currentQuestion: 1,
      timeRemaining: 90
    });
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

  // Answer Submission
  static async submitAnswer(userId, questionNumber, answer, roundNumber) {
    try {
      // Create answer submission record
      const answersRef = collection(db, 'answers');
      const answerDoc = await addDoc(answersRef, {
        userId: userId,
        questionNumber: questionNumber,
        answer: answer.toUpperCase(),
        roundNumber: roundNumber,
        timestamp: serverTimestamp(),
        isCorrect: false,
        points: 0
      });

      // Simple validation - in a real app, you'd have the correct answers in the database
      const correctAnswers = {
        1: 'ELEPHANT',
        2: 'BUTTERFLY', 
        3: 'COMPUTER',
        4: 'RAINBOW',
        // Add more correct answers...
      };

      const isCorrect = answer.toUpperCase() === correctAnswers[questionNumber];
      let points = 0;

      if (isCorrect) {
        // Calculate points (base 100 + time bonus would be calculated here)
        points = 100;

        // Update the answer document
        await updateDoc(answerDoc, {
          isCorrect: true,
          points: points
        });

        // Update user's score
        await this.updateUserScore(userId, roundNumber, points);
      }

      return { success: true, isCorrect, points };
    } catch (error) {
      return { success: false, error: error.message };
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

      // Update rankings and qualify top players
      for (let i = 0; i < users.length; i++) {
        const user = users[i];
        const rank = i + 1;
        const qualified = rank <= 10; // Top 10 qualify for round 2

        await updateDoc(doc(db, 'users', user.id), {
          round1Rank: rank,
          qualified: qualified,
          lastUpdated: serverTimestamp()
        });
      }

      return { success: true, qualifiedUsers: users.slice(0, 10) };
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

}
