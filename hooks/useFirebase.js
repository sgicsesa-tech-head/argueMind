import { useState, useEffect } from 'react';
import { FirebaseService } from '../firebase/gameService';

// Authentication hook
export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const unsubscribe = FirebaseService.onAuthStateChanged((firebaseUser) => {
      console.log('Auth state changed:', firebaseUser ? 'user found' : 'no user');
      setUser(firebaseUser);
      setLoading(false);
      
      if (firebaseUser) {
        // Subscribe to user data from Firestore
        const unsubscribeUser = FirebaseService.subscribeToUser(firebaseUser.uid, (data) => {
          console.log('User data updated:', data);
          setUserData(data);
        });
        
        return () => unsubscribeUser();
      } else {
        setUserData(null);
      }
    });

    return () => unsubscribe();
  }, []);

  return { user, userData, loading };
};

// Game state hook
export const useGameState = () => {
  const [gameState, setGameState] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = FirebaseService.subscribeToGameState((data) => {
      setGameState(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { gameState, loading };
};

// Leaderboard hook
export const useLeaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = FirebaseService.subscribeToLeaderboard((users) => {
      setLeaderboard(users);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { leaderboard, loading };
};

// Round 1 specific hook
export const useRound1 = () => {
  const { gameState } = useGameState();
  
  return {
    isActive: gameState?.round1Active || false,
    currentQuestion: gameState?.currentQuestion || 1,
    totalQuestions: gameState?.round1TotalQuestions || 20,
    timeRemaining: gameState?.timeRemaining || 90,
    timerActive: gameState?.timerActive || false
  };
};

// Round 2 specific hook
export const useRound2 = () => {
  const { gameState } = useGameState();
  
  return {
    isActive: gameState?.round2Active || false,
    currentQuestion: gameState?.currentQuestion || 1,
    totalQuestions: gameState?.round2TotalQuestions || 15,
    questionActive: gameState?.round2QuestionActive || false,
    buzzerActive: gameState?.round2BuzzerActive || false,
    timeRemaining: gameState?.timeRemaining || 90
  };
};

// Main Firebase hook (combines auth and game state)
export const useFirebase = () => {
  const { user, userData, loading: authLoading } = useAuth();
  const { gameState, loading: gameLoading } = useGameState();

  return {
    user,
    userData,
    gameState,
    loading: authLoading || gameLoading
  };
};
