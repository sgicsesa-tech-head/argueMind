import { useState, useEffect } from 'react';
import { FirebaseService } from '../firebase/gameService';

// Authentication hook with enhanced cleanup for Samsung devices
export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    let unsubscribeAuth = null;
    let unsubscribeUser = null;
    let isMounted = true;

    try {
      unsubscribeAuth = FirebaseService.onAuthStateChanged((firebaseUser) => {
        if (!isMounted) return;

        console.log('Auth state changed:', firebaseUser ? 'user found' : 'no user');
        setUser(firebaseUser);
        setLoading(false);
        
        if (firebaseUser) {
          // Clean up previous user subscription
          if (unsubscribeUser) {
            try {
              unsubscribeUser();
            } catch (error) {
              console.error('Error cleaning up previous user subscription:', error);
            }
          }

          // Subscribe to user data from Firestore
          unsubscribeUser = FirebaseService.subscribeToUser(firebaseUser.uid, (data) => {
            if (isMounted) {
              console.log('User data updated:', data);
              setUserData(data);
            }
          });
        } else {
          if (isMounted) {
            setUserData(null);
          }
        }
      });
    } catch (error) {
      console.error('Error setting up auth listener:', error);
      if (isMounted) {
        setLoading(false);
      }
    }

    return () => {
      isMounted = false;
      if (unsubscribeAuth) {
        try {
          unsubscribeAuth();
        } catch (error) {
          console.error('Error unsubscribing from auth:', error);
        }
      }
      if (unsubscribeUser) {
        try {
          unsubscribeUser();
        } catch (error) {
          console.error('Error unsubscribing from user data:', error);
        }
      }
    };
  }, []);

  return { user, userData, loading };
};

// Game state hook with enhanced error handling for Samsung devices
export const useGameState = () => {
  const [gameState, setGameState] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe = null;
    let isMounted = true;

    const setupListener = () => {
      try {
        unsubscribe = FirebaseService.subscribeToGameState((data) => {
          if (isMounted) {
            setGameState(data);
            setLoading(false);
          }
        });
      } catch (error) {
        console.error('Error setting up game state listener:', error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    setupListener();

    return () => {
      isMounted = false;
      if (unsubscribe) {
        try {
          unsubscribe();
        } catch (error) {
          console.error('Error unsubscribing from game state:', error);
        }
      }
    };
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
