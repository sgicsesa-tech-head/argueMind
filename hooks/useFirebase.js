import { useState, useEffect } from 'react';
import { FirebaseService } from '../firebase/gameService';

// Global user state management for immediate synchronization across screens
let globalUser = null;
const globalListeners = new Set();

export const setGlobalAuthUser = (user) => {
  globalUser = user;
  globalListeners.forEach((cb) => {
    try {
      cb(user);
    } catch (e) {
      console.error(e);
    }
  });
};

// Authentication hook for team sessions
export const useAuth = () => {
  const [user, setUser] = useState(globalUser);
  const [loading, setLoading] = useState(!globalUser);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    let unsubscribeUser = null;
    let isMounted = true;

    const handleUserChange = (newUser) => {
      if (!isMounted) return;
      setUser(newUser);
      
      // Clean up existing Firestore user subscription
      if (unsubscribeUser) {
        unsubscribeUser();
        unsubscribeUser = null;
      }

      if (newUser?.uid) {
        unsubscribeUser = FirebaseService.subscribeToUser(newUser.uid, (data) => {
          if (isMounted) {
            setUserData(data);
          }
        });
      } else {
        setUserData(null);
      }
    };

    // Register listener for user updates
    globalListeners.add(handleUserChange);

    // Initial check from storage if not already loaded in memory
    if (!globalUser) {
      FirebaseService.getStoredUser().then((stored) => {
        if (!isMounted) return;
        if (stored) {
          setGlobalAuthUser(stored);
        }
        setLoading(false);
      }).catch((err) => {
        console.error('Error loading stored user:', err);
        if (isMounted) setLoading(false);
      });
    } else {
      handleUserChange(globalUser);
      setLoading(false);
    }

    return () => {
      isMounted = false;
      globalListeners.delete(handleUserChange);
      if (unsubscribeUser) {
        unsubscribeUser();
      }
    };
  }, []);

  const loginWithTeam = async (teamName) => {
    setLoading(true);
    const result = await FirebaseService.loginWithTeamName(teamName);
    if (result.success) {
      setGlobalAuthUser(result.user);
    }
    setLoading(false);
    return result;
  };

  const logout = async () => {
    setLoading(true);
    await FirebaseService.signOut();
    setGlobalAuthUser(null);
    setUserData(null);
    setLoading(false);
  };

  return { user, userData, loading, loginWithTeam, logout };
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
  const { user, userData, loading: authLoading, loginWithTeam, logout } = useAuth();
  const { gameState, loading: gameLoading } = useGameState();

  return {
    user,
    userData,
    gameState,
    loading: authLoading || gameLoading,
    loginWithTeam,
    logout,
  };
};
