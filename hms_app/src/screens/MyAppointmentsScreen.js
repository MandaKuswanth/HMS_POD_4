import React, { useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';

import Header from '../components/Header';
import AppointmentCard from '../components/AppointmentCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { AppointmentContext } from '../context/AppointmentContext';

const MyAppointmentsScreen = () => {
  const { appointments, loading, getAppointments } =
    useContext(AppointmentContext);

  useEffect(() => {
    getAppointments();
  }, []);

  const renderEmptyComponent = () => {
    if (loading) return null;

    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No appointments booked yet.</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header title="My Appointments" />

      {loading && appointments.length === 0 ? (
        <LoadingSpinner />
      ) : (
        <FlatList
          data={appointments}
          keyExtractor={(item, index) =>
            item.appointmentId || item._id || item.id || index.toString()
          }
          renderItem={({ item }) => (
            <AppointmentCard appointment={item} />
          )}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={renderEmptyComponent}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={getAppointments}
              colors={['#1976D2']}
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FBFF',
  },
  listContainer: {
    padding: 16,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
});

export default MyAppointmentsScreen;