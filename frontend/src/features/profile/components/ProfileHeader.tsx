import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Interactions } from '@/src/constants/theme';
import { useTheme } from '@/src/contexts/ThemeContext';
import { ThemedText } from '@/src/components/GlobalThemeComponents';

interface ProfileHeaderProps {
  name: string;
  avatar: string;
  memberSince: string;
  verified: boolean;
  onEdit: () => void;
}

export default function ProfileHeader({ name, avatar, memberSince, verified, onEdit }: ProfileHeaderProps) {
  const { theme } = useTheme();
  
  return (
    <View style={styles.container}>
      <View style={styles.profileHeader}>
        <Image source={{ uri: avatar }} style={styles.avatar} />
        <View style={styles.profileInfo}>
          <ThemedText type="heading" style={styles.name}>{name}</ThemedText>
          <ThemedText type="caption" style={styles.memberSince}>Member since {memberSince}</ThemedText>
          {verified && (
            <View style={[styles.verifiedBadge, { backgroundColor: theme.colors.success + '20' }]}>
              <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
              <Text style={[styles.verifiedText, { color: theme.colors.success }]}>Verified Seller</Text>
            </View>
          )}
        </View>
      </View>
      <TouchableOpacity style={styles.editButton} onPress={onEdit} activeOpacity={Interactions.buttonOpacity}>
        <Ionicons name="create-outline" size={20} color={theme.colors.accent} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  memberSince: {
    fontSize: 14,
    marginBottom: 8,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  editButton: {
    padding: 8,
  },
});
