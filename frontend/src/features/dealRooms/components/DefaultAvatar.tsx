import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../../theme';

interface DefaultAvatarProps {
  size?: number;
  name?: string;
}

const DefaultAvatar: React.FC<DefaultAvatarProps> = ({ 
  size = 40, 
  name = 'User' 
}) => {
  const initials = name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.text, { fontSize: size * 0.4 }]}>
        {initials}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: theme.colors.white,
    fontWeight: theme.typography.weights.semibold,
  },
});

export default DefaultAvatar;
