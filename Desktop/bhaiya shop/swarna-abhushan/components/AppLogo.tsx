import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { COLORS, SIZES, SPACING, SHADOWS, FONT_FAMILY } from '../constants/theme';

interface AppLogoProps {
  size?: number;
  showText?: boolean;
  variant?: 'default' | 'compact';
}

export const AppLogo: React.FC<AppLogoProps> = ({
  size = 120,
  showText = true,
  variant = 'default',
}) => {
  return (
    <View style={[styles.container, variant === 'compact' && styles.compactContainer]}>
      <View style={[styles.logoWrapper, { width: size, height: size }]}>
        <Image
          source={require('../assets/main-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
      {showText && (
        <View style={styles.textContainer}>
          <Text style={styles.brandNameHindi}>स्वर्ण आभूषण</Text>
          <Text style={styles.brandNameEnglish}>SWARNA ABHUSHAN</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoWrapper: {
    borderRadius: 20,
    overflow: 'hidden',
    ...SHADOWS.gold,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    marginTop: SPACING.md,
    alignItems: 'center',
  },
  brandNameHindi: {
    fontSize: SIZES.xxxl,
    fontFamily: FONT_FAMILY.serifBold,
    color: COLORS.gold,
    letterSpacing: 1,
    lineHeight: 36,
  },
  brandNameEnglish: {
    fontSize: SIZES.sm,
    fontFamily: FONT_FAMILY.sansSemiBold,
    color: COLORS.lightGold,
    letterSpacing: 4,
    marginTop: SPACING.xs,
  },
});
