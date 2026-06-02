import React, { useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

const SplashScreen = ({ navigation }) => {
  const { token, loading } = useContext(AuthContext);

  useEffect(() => {
    if (!loading) {
      if (token) {
        navigation.replace('PatientDashboardScreen');
      } else {
        navigation.replace('LoginScreen');
      }
    }
  }, [loading, token, navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name="medkit" size={80} color="#FFFFFF" />
      </View>
      <Text style={styles.title}>HMS Patient App</Text>
      <ActivityIndicator size="large" color="#FFFFFF" style={styles.loader} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1976D2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 20,
    borderRadius: 60,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  loader: {
    marginTop: 40,
  },
});

export default SplashScreen;
