import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen({ patient }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Welcome ✅</Text>

        <Text style={styles.text}>
          👋 Hello {patient?.name || "User"}
        </Text>

        <Text style={styles.text}>
          📧 Email: {patient?.email || "N/A"}
        </Text>

        <Text style={styles.text}>
          📱 Phone: {patient?.phone || "N/A"}
        </Text>

        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>
            Go to Dashboard
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    justifyContent: "center"
  },

  card: {
    backgroundColor: "#fff",
    margin: 20,
    padding: 24,
    borderRadius: 16,
    alignItems: "center"
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 15
  },

  text: {
    fontSize: 16,
    marginBottom: 8
  },

  button: {
    marginTop: 20,
    backgroundColor: "#2563eb",
    padding: 14,
    borderRadius: 12
  },

  buttonText: {
    color: "#fff",
    fontWeight: "600"
  }
});