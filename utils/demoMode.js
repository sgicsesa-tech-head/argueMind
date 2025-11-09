// Offline/Demo mode utilities
export const DEMO_MODE = {
  enabled: true, // Set to false when Firebase is fully configured and online
  
  // Demo user data
  demoUser: {
    uid: 'demo-user-123',
    email: 'demo@test.com',
    teamName: 'Demo Team',
    round1Score: 250,
    round2Score: 40,
    totalScore: 290,
    qualified: true,
    isAdmin: false
  },
  
  // Demo game state
  demoGameState: {
    round1Active: true,
    round2Active: false,
    currentRound: 1,
    currentQuestion: 3,
    round1TotalQuestions: 20,
    round2TotalQuestions: 15,
    timerDuration: 90,
    timeRemaining: 60,
    timerActive: true,
    round2BuzzerActive: false,
    round2QuestionActive: false,
    gameStarted: true,
    gameEnded: false
  },
  
  // Demo participants
  demoParticipants: [
    { uid: '1', teamName: 'Team Alpha', round1Score: 320, round2Score: 60, totalScore: 380, qualified: true },
    { uid: '2', teamName: 'Team Beta', round1Score: 290, round2Score: 40, totalScore: 330, qualified: true },
    { uid: '3', teamName: 'Team Gamma', round1Score: 270, round2Score: 20, totalScore: 290, qualified: true },
    { uid: '4', teamName: 'Demo Team', round1Score: 250, round2Score: 40, totalScore: 290, qualified: true },
    { uid: '5', teamName: 'Team Delta', round1Score: 230, round2Score: 0, totalScore: 230, qualified: true }
  ]
};

// Check if we should use demo mode
export const shouldUseDemoMode = (error) => {
  return DEMO_MODE.enabled && (
    error?.message?.includes('offline') ||
    error?.message?.includes('network') ||
    error?.message?.includes('Failed to get document')
  );
};

// Demo Firebase service wrapper
export const DemoFirebaseService = {
  // Auth methods
  async registerUser(email, password, teamName) {
    console.log('Demo: Registering user', { email, teamName });
    return { 
      success: true, 
      user: { 
        uid: 'demo-user-' + Date.now(),
        email 
      } 
    };
  },

  async loginUser(email, password) {
    console.log('Demo: Logging in user', email);
    return { 
      success: true, 
      user: { 
        uid: 'demo-user-123',
        email 
      } 
    };
  },

  async signOut() {
    console.log('Demo: Signing out');
    return { success: true };
  },

  // User profile methods
  async getUserProfile(uid) {
    console.log('Demo: Getting user profile for', uid);
    return { success: true, data: DEMO_MODE.demoUser };
  },

  async updateUserProfile(uid, updates) {
    console.log('Demo: Updating user profile', uid, updates);
    return { success: true };
  },

  async getAllUsers() {
    console.log('Demo: Getting all users');
    return { success: true, users: DEMO_MODE.demoParticipants };
  },

  // Game state methods
  async createGameState() {
    console.log('Demo: Creating game state');
    return { success: true };
  },

  async updateGameState(updates) {
    console.log('Demo: Updating game state', updates);
    DEMO_MODE.demoGameState = { ...DEMO_MODE.demoGameState, ...updates };
    return { success: true };
  },

  // Answer submission
  async submitAnswer(userId, questionNumber, answer, roundNumber) {
    console.log('Demo: Submitting answer', { userId, questionNumber, answer, roundNumber });
    
    // Simple demo validation
    const demoAnswers = {
      1: 'ELEPHANT',
      2: 'BUTTERFLY', 
      3: 'COMPUTER',
      4: 'RAINBOW'
    };
    
    const isCorrect = answer.toUpperCase() === demoAnswers[questionNumber];
    const points = isCorrect ? 100 : 0;
    
    return { success: true, isCorrect, points };
  },

  // Mock subscription methods
  subscribeToGameState(callback) {
    console.log('Demo: Subscribing to game state');
    // Call immediately with demo data
    setTimeout(() => callback(DEMO_MODE.demoGameState), 100);
    
    // Return a dummy unsubscribe function
    return () => console.log('Demo: Unsubscribed from game state');
  },

  subscribeToUser(userId, callback) {
    console.log('Demo: Subscribing to user', userId);
    setTimeout(() => callback(DEMO_MODE.demoUser), 100);
    return () => console.log('Demo: Unsubscribed from user');
  },

  subscribeToLeaderboard(callback) {
    console.log('Demo: Subscribing to leaderboard');
    setTimeout(() => callback(DEMO_MODE.demoParticipants), 100);
    return () => console.log('Demo: Unsubscribed from leaderboard');
  },

  onAuthStateChanged(callback) {
    console.log('Demo: Auth state changed listener');
    // Simulate logged in user
    setTimeout(() => {
      callback({ 
        uid: 'demo-user-123',
        email: 'demo@test.com'
      });
    }, 100);
    return () => console.log('Demo: Auth listener unsubscribed');
  }
};
