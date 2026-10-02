import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, SIZES, SPACING, FONT_FAMILY } from '../constants/theme';
import { useAuth } from '../lib/auth-context';

export default function Index() {
  const router = useRouter();
  const { loading, isAuthenticated } = useAuth();
  const spinAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animationStartedAt = Date.now();
    const animationInterval = setInterval(() => {
      const elapsed = Date.now() - animationStartedAt;
      fadeAnim.setValue(Math.min(elapsed / 1000, 1));
      spinAnim.setValue((elapsed % 2000) / 2000);
    }, 16);

    return () => clearInterval(animationInterval);
  }, []);

  useEffect(() => {
    if (loading) return;

    const timeout = setTimeout(() => {
      router.replace(isAuthenticated ? '/(tabs)' : '/(auth)/login');
    }, 250);

    return () => clearTimeout(timeout);
  }, [loading, isAuthenticated, router]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <Animated.View style={{ opacity: fadeAnim }}>
        <Image
          source={require('../assets/main-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.brandNameHindi}>स्वर्ण आभूषण</Text>
        <Text style={styles.brandNameEnglish}>SWARNA ABHUSHAN</Text>
        <Animated.View style={{ transform: [{ rotate: spin }] }}>
          <View style={styles.goldLoader}>
            <View style={[styles.goldDot, { top: 0, left: '50%', marginLeft: -4 }]} />
            <View style={[styles.goldDot, { top: '50%', left: 0, marginTop: -4 }]} />
            <View style={[styles.goldDot, { top: '50%', right: 0, marginRight: -4 }]} />
            <View style={[styles.goldDot, { bottom: 0, left: '50%', marginLeft: -4 }]} />
          </View>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 180,
    height: 180,
    marginBottom: SPACING.xl,
  },
  brandNameHindi: {
    fontSize: SIZES.xxxl,
    fontFamily: FONT_FAMILY.serifBold,
    color: COLORS.gold,
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: SPACING.xs,
    lineHeight: 40,
  },
  brandNameEnglish: {
    fontSize: SIZES.lg,
    fontFamily: FONT_FAMILY.sansSemiBold,
    color: COLORS.lightGold,
    textAlign: 'center',
    letterSpacing: 4,
    marginBottom: SPACING.xl,
  },
  goldLoader: {
    width: 40,
    height: 40,
    position: 'relative',
    alignSelf: 'center',
  },
  goldDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.gold,
  },
});
