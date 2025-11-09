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

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (email == "admin@csesa" && password == "arguemind") {
      navigation.navigate("Admin");
    } else {
      navigation.navigate("Dashboard");

      /*
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }*/

      setLoading(true);

      // Simulate login API call
      setTimeout(() => {
        setLoading(false);
        // Simple validation for demo purposes
        navigation.navigate("Dashboard");
        /* if (email.includes('@') && password.length >= 6) {
      } else {
        Alert.alert('Login Failed', 'Invalid email or password');
      }*/
      }, 1000);
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
                {loading ? "Signing In..." : "Sign In"}
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
});

export default LoginScreen;
