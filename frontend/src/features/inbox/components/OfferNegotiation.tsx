import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Interactions } from '@/src/constants/theme';

interface OfferNegotiationProps {
  itemName: string;
  itemImage: string;
  originalPrice: number;
  currentOffer: number;
  isOwnOffer: boolean;
  onOfferUpdate: (newOffer: number) => void;
  onAcceptOffer?: () => void;
}

export default function OfferNegotiation({
  itemName,
  itemImage,
  originalPrice,
  currentOffer,
  isOwnOffer,
  onOfferUpdate,
  onAcceptOffer,
}: OfferNegotiationProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempOffer, setTempOffer] = useState(currentOffer.toString());

  const handleEditOffer = () => {
    setIsEditing(true);
    setTempOffer(currentOffer.toString());
  };

  const handleSaveOffer = () => {
    const newOffer = parseFloat(tempOffer);
    if (!isNaN(newOffer) && newOffer > 0) {
      onOfferUpdate(newOffer);
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setTempOffer(currentOffer.toString());
  };

  return (
    <View style={styles.container}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{itemName}</Text>
        <Text style={styles.originalPrice}>Original: ${originalPrice}</Text>
      </View>

      <View style={styles.offerSection}>
        <View style={styles.offerHeader}>
          <Text style={styles.offerLabel}>
            {isOwnOffer ? 'Your Offer' : 'Their Offer'}
          </Text>
          {isOwnOffer && !isEditing && (
            <TouchableOpacity
              style={styles.editButton}
              onPress={handleEditOffer}
              activeOpacity={Interactions.buttonOpacity}
            >
              <Ionicons name="create-outline" size={16} color="#3B82F6" />
            </TouchableOpacity>
          )}
        </View>

        {isEditing ? (
          <View style={styles.editContainer}>
            <TextInput
              style={styles.offerInput}
              value={`$${tempOffer}`}
              onChangeText={(text) => setTempOffer(text.replace('$', ''))}
              keyboardType="numeric"
              autoFocus
            />
            <View style={styles.editActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={handleCancelEdit}
                activeOpacity={Interactions.buttonOpacity}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.saveButton]}
                onPress={handleSaveOffer}
                activeOpacity={Interactions.buttonOpacity}
              >
                <Text style={styles.saveText}>Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.offerDisplay}>
            <Text style={styles.offerAmount}>${currentOffer}</Text>
            {!isOwnOffer && onAcceptOffer && (
              <TouchableOpacity
                style={styles.acceptButton}
                onPress={onAcceptOffer}
                activeOpacity={Interactions.buttonOpacity}
              >
                <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                <Text style={styles.acceptText}>Accept</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginVertical: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  itemInfo: {
    marginBottom: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  originalPrice: {
    fontSize: 14,
    color: '#6B7280',
  },
  offerSection: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  offerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  offerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  editButton: {
    padding: 4,
  },
  editContainer: {
    alignItems: 'flex-start',
  },
  offerInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    minWidth: 100,
    marginBottom: 12,
  },
  editActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  saveButton: {
    backgroundColor: '#3B82F6',
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  saveText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  offerDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  offerAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3B82F6',
  },
  acceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  acceptText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
