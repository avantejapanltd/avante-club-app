import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';

interface AvatarProps {
  name: string;
  avatarUri: string | null;
  size?: number;
  color?: string;
  onPress?: () => void;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/[\s　]+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || '?';
}

export default function Avatar({ name, avatarUri, size = 40, color = '#1A3C5E', onPress }: AvatarProps) {
  const fontSize = Math.round(size * 0.36);
  const borderRadius = size / 2;

  const inner = avatarUri ? (
    <Image
      source={{ uri: avatarUri }}
      style={[styles.image, { width: size, height: size, borderRadius }]}
    />
  ) : (
    <View style={[styles.initialsContainer, { width: size, height: size, borderRadius, backgroundColor: color }]}>
      <Text style={[styles.initials, { fontSize }]}>{getInitials(name)}</Text>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        {inner}
      </TouchableOpacity>
    );
  }
  return inner;
}

const styles = StyleSheet.create({
  image: {
    resizeMode: 'cover',
  },
  initialsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
