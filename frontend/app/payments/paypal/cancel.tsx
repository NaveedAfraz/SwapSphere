import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function PayPalCancelPage() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Payment Cancelled</Text>
      <Text style={styles.message}>Your PayPal payment has been cancelled.</Text>
      <Text style={styles.instruction}>You can close this window and return to the app.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#dc3545',
    marginBottom: 20,
  },
  message: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 15,
  },
  instruction: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
