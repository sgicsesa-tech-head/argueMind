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
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { theme, shadows, typography } from "../theme";
import { FirebaseService } from "../firebase/gameService";
import { setGlobalAuthUser } from "../hooks/useFirebase";

const LoginScreen = ({ navigation }) => {
  const [teamName, setTeamName] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  // Admin access state
  const [showAdminMode, setShowAdminMode] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");

  // Auto-restore saved session
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
      Alert.alert("Team Name Required", "Please enter your team name to join the induction event.");
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
        Alert.alert("Error", result.error || "Failed to join event. Please try again.");
      }
    } catch (error) {
      console.error("Join game error:", error);
      Alert.alert("Error", "Something went wrong while connecting. Please try again.");
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
          <Text style={styles.checkingText}>Loading CSE Induction...</Text>
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
        <View style={styles.innerContainer}>
          {/* Header & Logo */}
          <View style={styles.brandContainer}>
            <View style={styles.logoWrapper}>
              <Image
                source={require("../assets/csesa.png")}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.title}>CSE Induction</Text>
            <Text style={styles.subtitle}>
              {showAdminMode
                ? "Administrative Control Console"
                : "Department of Computer Science & Engineering"}
            </Text>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            {!showAdminMode ? (
              <View>
                <Text style={styles.fieldLabel}>Team Registration</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="people-outline"
                    size={20}
                    color={theme.textSecondary}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your team name"
                    placeholderTextColor={theme.placeholder}
                    value={teamName}
                    onChangeText={setTeamName}
                    autoCapitalize="words"
                    autoCorrect={false}
                    returnKeyType="go"
                    onSubmitEditing={handleJoinGame}
                    editable={!loading}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.primaryButton, loading && styles.disabledButton]}
                  onPress={handleJoinGame}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color={theme.textPrimary} />
                  ) : (
                    <View style={styles.buttonContent}>
                      <Text style={styles.primaryButtonText}>Join Event</Text>
                      <Ionicons
                        name="arrow-forward"
                        size={20}
                        color={theme.textPrimary}
                      />
                    </View>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.adminAccessButton}
                  onPress={() => setShowAdminMode(true)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="shield-outline"
                    size={16}
                    color={theme.textMuted}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.adminAccessText}>Admin Portal</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <Text style={styles.fieldLabel}>Admin Authentication</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="key-outline"
                    size={20}
                    color={theme.textSecondary}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter admin passcode"
                    placeholderTextColor={theme.placeholder}
                    value={adminPassword}
                    onChangeText={setAdminPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    returnKeyType="go"
                    onSubmitEditing={handleAdminLogin}
                  />
                </View>

                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleAdminLogin}
                  activeOpacity={0.8}
                >
                  <View style={styles.buttonContent}>
                    <Text style={styles.primaryButtonText}>Authenticate</Text>
                    <Ionicons
                      name="lock-open-outline"
                      size={20}
                      color={theme.textPrimary}
                    />
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelAdminButton}
                  onPress={() => {
                    setShowAdminMode(false);
                    setAdminPassword("");
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="arrow-back"
                    size={16}
                    color={theme.textSecondary}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.cancelAdminText}>Back to Team Entry</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
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
  innerContainer: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  brandContainer: {
    alignItems: "center",
    marginBottom: 28,
  },
  logoWrapper: {
    width: 110,
    height: 110,
    borderRadius: 24,
    backgroundColor: theme.surface,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.border,
    ...shadows.medium,
  },
  logo: {
    width: 90,
    height: 90,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: theme.textPrimary,
    letterSpacing: 0.4,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: "center",
    marginTop: 4,
    maxWidth: 280,
  },
  card: {
    backgroundColor: theme.surface,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: theme.border,
    ...shadows.large,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.inputBackground,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.inputBorder,
    paddingHorizontal: 16,
    marginBottom: 18,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 16,
    color: theme.textPrimary,
  },
  primaryButton: {
    backgroundColor: theme.primaryDark,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.medium,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: theme.textPrimary,
    fontSize: 16,
    fontWeight: "600",
    marginRight: 8,
    letterSpacing: 0.3,
  },
  disabledButton: {
    opacity: 0.6,
  },
  adminAccessButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 22,
    paddingVertical: 8,
  },
  adminAccessText: {
    color: theme.textMuted,
    fontSize: 13,
    fontWeight: "500",
  },
  cancelAdminButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
    paddingVertical: 8,
  },
  cancelAdminText: {
    color: theme.textSecondary,
    fontSize: 14,
    fontWeight: "500",
  },
});

export default LoginScreen;
