import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function PaymentSuccessPage() {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name="checkmark-circle" size={80} color="#28a745" />
      </View>
      
      <Text style={styles.title}>Payment Successful!</Text>
      
      <View style={styles.card}>
        <View style={styles.statusItem}>
          <Ionicons name="shield-checkmark" size={24} color="#28a745" />
          <Text style={styles.statusText}>Payment Secured in Escrow</Text>
        </View>
        
        <View style={styles.divider} />
        
        <Text style={styles.message}>
          Your payment has been received and is being held securely by SwapSphere.
        </Text>
        
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Next Steps:</Text>
          <View style={styles.step}>
            <Text style={styles.stepNumber}>1</Text>
            <Text style={styles.stepText}>Seller will prepare your item for shipping</Text>
          </View>
          <View style={styles.step}>
            <Text style={styles.stepNumber}>2</Text>
            <Text style={styles.stepText}>You'll receive tracking information once shipped</Text>
          </View>
          <View style={styles.step}>
            <Text style={styles.stepNumber}>3</Text>
            <Text style={styles.stepText}>Inspect and confirm delivery to release payment</Text>
          </View>
        </View>
        
        <Text style={styles.note}>
          Funds will be released to the seller after you confirm the item is as described.
        </Text>
      </View>
      
      <Text style={styles.helpText}>
        Need help? Contact our support team
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 20,
    paddingTop: 60,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#28a745',
    textAlign: 'center',
    marginBottom: 30,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 20,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
    color: '#28a745',
  },
  divider: {
    height: 1,
    backgroundColor: '#e9ecef',
    marginVertical: 15,
  },
  message: {
    fontSize: 16,
    color: '#495057',
    lineHeight: 24,
    marginBottom: 20,
  },
  infoBox: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#212529',
  },
  step: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  stepNumber: {
    backgroundColor: '#28a745',
    color: 'white',
    width: 24,
    height: 24,
    borderRadius: 12,
    textAlign: 'center',
    lineHeight: 24,
    marginRight: 10,
    fontSize: 14,
    fontWeight: 'bold',
  },
  stepText: {
    flex: 1,
    color: '#495057',
    lineHeight: 22,
  },
  note: {
    fontSize: 14,
    color: '#6c757d',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  helpText: {
    textAlign: 'center',
    color: '#0d6efd',
    fontSize: 15,
    marginTop: 10,
  },
});
