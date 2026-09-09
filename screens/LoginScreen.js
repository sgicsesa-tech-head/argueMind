import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme, shadows, typography } from "../theme";
import { FirebaseService } from "../firebase/gameService";
import { setGlobalAuthUser } from "../hooks/useFirebase";

const LoginScreen = ({ navigation }) => {
  const [teamName, setTeamName] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  // Admin modal / mode
  const [showAdminMode, setShowAdminMode] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");

  // Check if team is already saved on device
  useEffect(() => {
    let isMounted = true;
    FirebaseService.getStoredUser()
      .then((storedUser) => {
        if (isMounted && storedUser?.teamName) {
          setGlobalAuthUser(storedUser);
          navigation.replace("Dashboard");
        }
      })
      .catch((err) => console.log("Session check error:", err))
      .finally(() => {
        if (isMounted) setCheckingSession(false);
      });

    return () => {
      isMounted = false;
    };
  }, [navigation]);

  const handleJoinGame = async () => {
    const trimmed = teamName.trim();
    if (!trimmed) {
      Alert.alert("Team Name Required", "Please enter your team name to continue.");
      return;
    }

    // Quick route to admin if entered "admin"
    if (trimmed.toLowerCase() === "admin" || trimmed === "admin@csesa") {
      setShowAdminMode(true);
      return;
    }

    setLoading(true);
    try {
      const result = await FirebaseService.loginWithTeamName(trimmed);
      if (result.success) {
        setGlobalAuthUser(result.user);
        navigation.replace("Dashboard");
      } else {
        Alert.alert("Error", result.error || "Failed to join game. Please try again.");
      }
    } catch (error) {
      console.error("Join game error:", error);
      Alert.alert("Error", "Something went wrong while joining. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = () => {
    if (adminPassword === "arguemind") {
      setShowAdminMode(false);
      setAdminPassword("");
      navigation.navigate("Admin");
    } else {
      Alert.alert("Access Denied", "Incorrect admin passcode.");
    }
  };

  if (checkingSession) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.checkingText}>Loading ArgueMind...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <View style={styles.loginContainer}>
          <Text style={styles.title}>ArgueMind</Text>
          <Text style={styles.subtitle}>
            {showAdminMode
              ? "Admin Control Panel Access"
              : "Enter your team name to join the game"}
          </Text>

          {!showAdminMode ? (
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Enter Team Name (e.g. CyberKnights)"
                placeholderTextColor={theme.placeholder}
                value={teamName}
                onChangeText={setTeamName}
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleJoinGame}
                editable={!loading}
              />

              <TouchableOpacity
                style={[styles.loginButton, loading && styles.disabledButton]}
                onPress={handleJoinGame}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={theme.textPrimary} />
                ) : (
                  <Text style={styles.loginButtonText}>Join Game</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.adminAccessButton}
                onPress={() => setShowAdminMode(true)}
              >
                <Text style={styles.adminAccessText}>Admin Access</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Enter Admin Passcode"
                placeholderTextColor={theme.placeholder}
                value={adminPassword}
                onChangeText={setAdminPassword}
                secureTextEntry
                autoCapitalize="none"
                returnKeyType="done"
                onSubmitEditing={handleAdminLogin}
              />

              <TouchableOpacity
                style={styles.loginButton}
                onPress={handleAdminLogin}
              >
                <Text style={styles.loginButtonText}>Enter Admin Panel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelAdminButton}
                onPress={() => {
                  setShowAdminMode(false);
                  setAdminPassword("");
                }}
              >
                <Text style={styles.cancelAdminText}>Back to Team Entry</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  keyboardView: {
    flex: 1,
  },
  loadingCenter: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  checkingText: {
    ...typography.body,
    marginTop: 12,
    color: theme.textSecondary,
  },
  loginContainer: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 30,
  },
  title: {
    ...typography.h1,
    textAlign: "center",
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  subtitle: {
    ...typography.caption,
    textAlign: "center",
    marginBottom: 40,
    color: theme.textSecondary,
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.border,
    color: theme.textPrimary,
    ...shadows.small,
  },
  loginButton: {
    backgroundColor: theme.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 6,
    ...shadows.medium,
  },
  disabledButton: {
    backgroundColor: theme.textMuted,
    ...shadows.small,
  },
  loginButtonText: {
    color: theme.textPrimary,
    fontSize: 18,
    fontWeight: "600",
  },
  adminAccessButton: {
    marginTop: 35,
    alignItems: "center",
    padding: 10,
  },
  adminAccessText: {
    color: theme.textSecondary,
    fontSize: 14,
    textDecorationLine: "underline",
  },
  cancelAdminButton: {
    marginTop: 20,
    alignItems: "center",
    padding: 10,
  },
  cancelAdminText: {
    color: theme.textSecondary,
    fontSize: 14,
  },
});

export default LoginScreen;
