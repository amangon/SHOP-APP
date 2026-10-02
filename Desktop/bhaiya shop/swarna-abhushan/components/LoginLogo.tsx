import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useLoginLogo } from '../hooks';
import { COLORS, SIZES, SPACING, FONT_FAMILY } from '../constants/theme';

interface LoginLogoProps {
  size?: number;
}

export const LoginLogo: React.FC<LoginLogoProps> = ({ size = 140 }) => {
  const { data: logoUrl, isLoading } = useLoginLogo();

  if (isLoading) {
    return <PlaceholderLogo size={size} />;
  }

  if (logoUrl) {
    return (
      <View style={[styles.logoContainer, { width: size, height: size }]}>
        <Image
          source={{ uri: logoUrl }}
          style={styles.logoImage}
          resizeMode="contain"
          fadeDuration={0}
        />
      </View>
    );
  }

  return <PlaceholderLogo size={size} />;
};

const PlaceholderLogo: React.FC<{ size?: number }> = ({ size = 140 }) => {
  return (
    <View style={[styles.logoContainer, { width: size, height: size }, styles.placeholder]}>
      <View style={styles.placeholderInner}>
        <View style={styles.goldCrown} />
        <Text style={styles.placeholderBrandText}>स्वर्ण</Text>
        <Text style={styles.placeholderSubText}>आभूषण</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  logoContainer: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    backgroundColor: COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
    overflow: 'hidden',
  },
  placeholder: {
    backgroundColor: COLORS.card,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  placeholderInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  goldCrown: {
    width: 40,
    height: 24,
    backgroundColor: COLORS.gold,
    borderRadius: 4,
    marginBottom: SPACING.sm,
  },
  placeholderBrandText: {
    color: COLORS.gold,
    fontSize: SIZES.xxl,
    fontFamily: FONT_FAMILY.serifBold,
  },
  placeholderSubText: {
    color: COLORS.lightGold,
    fontSize: SIZES.xl,
    fontFamily: FONT_FAMILY.serif,
    marginTop: SPACING.xs,
  },
});
