import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme, shadows, typography } from "../theme";
import { FirebaseService } from "../firebase/gameService";

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [teamName, setTeamName] = useState("");

  const handleLogin = async () => {
    // Admin login (unchanged)
    if (email === "admin@csesa" && password === "arguemind") {
      navigation.navigate("Admin");
      return;
    }
    else{

    // Firebase authentication for participants
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (isSignUp && !teamName.trim()) {
      Alert.alert('Error', 'Please enter your team name');
      return;
    }

    setLoading(true);

    try {
      let result;
      
      if (isSignUp) {
        // Register new user
        result = await FirebaseService.registerUser(email, password, teamName);
        if (result.success) {
          Alert.alert('Success', 'Account created successfully!', [
            { text: 'OK', onPress: () => navigation.navigate("Dashboard") }
          ]);
        }
      } else {
        // Login existing user
        result = await FirebaseService.loginUser(email, password);
        if (result.success) {
          navigation.navigate("Dashboard");
        }
      }

      if (!result.success) {
        Alert.alert('Authentication Failed', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <View style={styles.loginContainer}>
          <Text style={styles.title}>Welcome to ArgueMind</Text>
          <Text style={styles.subtitle}>Please sign in to continue</Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={theme.placeholder}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            {isSignUp && (
              <TextInput
                style={styles.input}
                placeholder="Team Name"
                placeholderTextColor={theme.placeholder}
                value={teamName}
                onChangeText={setTeamName}
                autoCapitalize="words"
              />
            )}

            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={theme.placeholder}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />

            <TouchableOpacity
              style={[styles.loginButton, loading && styles.disabledButton]}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.loginButtonText}>
                {loading ? (isSignUp ? "Creating Account..." : "Signing In...") : (isSignUp ? "Create Account" : "Sign In")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toggleButton}
              onPress={() => setIsSignUp(!isSignUp)}
              disabled={loading}
            >
              <Text style={styles.toggleButtonText}>
                {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
              </Text>
            </TouchableOpacity>
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
  loginContainer: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 30,
  },
  title: {
    ...typography.h1,
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    ...typography.caption,
    textAlign: "center",
    marginBottom: 40,
  },
  inputContainer: {
    marginBottom: 30,
  },
  input: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 20,
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: theme.border,
    color: theme.textPrimary,
    ...shadows.small,
  },
  loginButton: {
    backgroundColor: theme.primary,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 10,
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
  toggleButton: {
    marginTop: 20,
    alignItems: "center",
  },
  toggleButtonText: {
    color: theme.primary,
    fontSize: 16,
    fontWeight: "500",
  },
});

export default LoginScreen;
