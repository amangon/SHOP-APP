import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, SIZES, SPACING, FONT_FAMILY } from '../../constants/theme';
import { LuxuryButton, LuxuryInput, AppLogo } from '../../components';
import { resetPassword } from '../../services/auth';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      const result = await resetPassword(email);

      if (result.success) {
        setSent(true);
      } else if (result.error) {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'android' ? 'height' : 'padding'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <AppLogo size={100} showText={false} />
            <Text style={styles.brandName}>स्वर्ण आभूषण</Text>
            <Text style={styles.tagline}>Reset Password</Text>
          </View>

          <View style={styles.form}>
            {sent ? (
              <View style={styles.successContainer}>
                <Text style={styles.successText}>
                  Check your email for password reset instructions.
                </Text>
                <LuxuryButton
                  title="Back to Login"
                  onPress={() => router.replace('/(auth)/login')}
                  style={styles.backButton}
                />
              </View>
            ) : (
              <>
                <Text style={styles.description}>
                  Enter your email address and we'll send you a link to reset your password.
                </Text>

                <LuxuryInput
                  label="Email"
                  placeholder="Enter your email"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />

                <LuxuryButton
                  title="Send Reset Link"
                  onPress={handleForgotPassword}
                  loading={loading}
                  style={styles.resetButton}
                />

                <TouchableOpacity onPress={() => router.back()}>
                  <Text style={styles.backText}>Back to Login</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  scrollContent: {
    flexGrow: 0,
    justifyContent: 'center',
  },
  content: {
    padding: SPACING.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  brandName: {
    fontSize: SIZES.xxxl,
    fontFamily: FONT_FAMILY.serifBold,
    color: COLORS.gold,
    letterSpacing: 1,
    textAlign: 'center',
    marginTop: SPACING.md,
    lineHeight: 40,
  },
  tagline: {
    fontSize: SIZES.md,
    fontFamily: FONT_FAMILY.sans,
    color: COLORS.secondaryText,
    marginTop: SPACING.sm,
    fontStyle: 'italic',
  },
  form: {
    width: '100%',
  },
  description: {
    fontSize: SIZES.md,
    fontFamily: FONT_FAMILY.sans,
    color: COLORS.secondaryText,
    marginBottom: SPACING.xl,
    lineHeight: 22,
  },
  resetButton: {
    marginTop: SPACING.md,
    width: '100%',
  },
  backButton: {
    marginTop: SPACING.lg,
    width: '100%',
  },
  backText: {
    color: COLORS.gold,
    fontSize: SIZES.md,
    textAlign: 'center',
    marginTop: SPACING.lg,
    fontFamily: FONT_FAMILY.sansSemiBold,
  },
  successContainer: {
    alignItems: 'center',
  },
  successText: {
    fontSize: SIZES.lg,
    fontFamily: FONT_FAMILY.sans,
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    lineHeight: 24,
  },
});
