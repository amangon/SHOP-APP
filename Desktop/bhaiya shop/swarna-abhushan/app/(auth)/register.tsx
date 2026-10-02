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
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import {
  COLORS,
  SIZES,
  SPACING,
  FONT_FAMILY,
} from '../../constants/theme';

import {
  LuxuryButton,
  LuxuryInput,
  AppLogo,
} from '../../components';

import { signUpWithEmail } from '../../services/auth';

export default function RegisterScreen() {
  const router = useRouter();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [firmName, setFirmName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    const cleanFirstName = firstName.trim();
    const cleanLastName = lastName.trim();
    const cleanFirmName = firmName.trim();
    const cleanPhone = phone.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (
      !cleanFirstName ||
      !cleanLastName ||
      !cleanFirmName ||
      !cleanEmail ||
      !cleanPhone ||
      !password ||
      !confirmPassword
    ) {
      Alert.alert(
        'Error',
        'Please fill in first name, last name, firm name, email, mobile number, and both passwords.'
      );
      return;
    }

    if (cleanFirmName.length < 2) {
      Alert.alert('Error', 'Please enter a valid firm name.');
      return;
    }

    // Fixed email validation regex.
    if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      Alert.alert('Error', 'Please enter a valid email address.');
      return;
    }

    if (!/^[0-9+\- ()]{10,15}$/.test(cleanPhone)) {
      Alert.alert('Error', 'Please enter a valid mobile number.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      const result = await signUpWithEmail(
        cleanEmail,
        password,
        cleanFirstName,
        cleanLastName,
        cleanPhone,
        cleanFirmName
      );

      if (result.success) {
        Alert.alert(
          'Success',
          'Account created successfully! Please login.',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/(auth)/login'),
            },
          ]
        );
      } else if (result.error) {
        Alert.alert('Registration Failed', result.error);
      } else {
        Alert.alert(
          'Registration Failed',
          'Unable to create your account. Please try again.'
        );
      }
    } catch (error: any) {
      Alert.alert(
        'Error',
        error?.message || 'An unexpected error occurred.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.backgroundGlowLeft} />
        <View style={styles.backgroundGlowRight} />

        <View style={styles.content}>
          {/* TOP HEADER */}
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              activeOpacity={0.8}
              accessibilityLabel="Go back"
            >
              <MaterialIcons
                name="arrow-back"
                size={28}
                color={COLORS.lightGold}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => {}}
              activeOpacity={0.8}
              accessibilityLabel="Settings"
            >
              <MaterialIcons
                name="settings"
                size={27}
                color="#E8E8E8"
              />
            </TouchableOpacity>
          </View>

          {/* BRAND */}
          <View style={styles.header}>
            <AppLogo size={118} showText={false} />

            <Text style={styles.brandName}>स्वर्ण आभूषण</Text>

            <Text style={styles.brandEnglish}>SWARNA ABHUSHAN</Text>

            <Text style={styles.brandTagline}>
              TRUST • TRADITION • TIMELESS
            </Text>

            <Text style={styles.pageTitle}>
              Create Your <Text style={styles.pageTitleGold}>Account</Text>
            </Text>

            <Text style={styles.pageSubtitle}>
              Join the Swarna Abhushan family and{'\n'}
              explore timeless elegance
            </Text>
          </View>

          {/* FEATURE STRIP */}
          <View style={styles.featureStrip}>
            <Feature
              icon="diamond"
              title="Premium"
              subtitle="Jewellery"
            />
            <Feature
              icon="verified-user"
              title="Trusted"
              subtitle="& Secure"
            />
            <Feature
              icon="people"
              title="Millions"
              subtitle="of Happy Customers"
            />
          </View>

          {/* FORM */}
          <View style={styles.formCard}>
            <View style={styles.nameRow}>
              <View style={styles.halfField}>
                <LuxuryInput
                  label="First Name *"
                  placeholder="Enter first name"
                  value={firstName}
                  onChangeText={setFirstName}
                />
              </View>

              <View style={styles.halfField}>
                <LuxuryInput
                  label="Last Name *"
                  placeholder="Enter last name"
                  value={lastName}
                  onChangeText={setLastName}
                />
              </View>
            </View>

            <View style={styles.fieldSpacing}>
              <LuxuryInput
                label="Firm Name *"
                placeholder="Enter your firm name"
                value={firmName}
                onChangeText={setFirmName}
              />
            </View>

            <View style={styles.fieldSpacing}>
              <LuxuryInput
                label="Mobile Number *"
                placeholder="Enter mobile number"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.fieldSpacing}>
              <LuxuryInput
                label="Email Address *"
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.fieldSpacing}>
              <LuxuryInput
                label="Create Password *"
                placeholder="Enter a strong password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <View style={styles.strengthRow}>
              <View
                style={[
                  styles.strengthBar,
                  password.length > 0 && styles.strengthBarActive,
                ]}
              />
              <View
                style={[
                  styles.strengthBar,
                  password.length >= 8 && styles.strengthBarActive,
                ]}
              />
              <View
                style={[
                  styles.strengthBar,
                  password.length >= 10 && styles.strengthBarActive,
                ]}
              />

              <Text style={styles.strengthText}>
                Password strength:{' '}
                <Text style={styles.strengthValue}>
                  {password.length >= 10
                    ? 'Strong'
                    : password.length >= 6
                      ? 'Medium'
                      : 'Weak'}
                </Text>
              </Text>
            </View>

            <View style={styles.fieldSpacing}>
              <LuxuryInput
                label="Confirm Password *"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
            </View>

            {/* TERMS */}
            <View style={styles.termsRow}>
              <View style={styles.checkbox}>
                <MaterialIcons
                  name="check"
                  size={17}
                  color="transparent"
                />
              </View>

              <Text style={styles.termsText}>
                I agree to the{' '}
                <Text style={styles.goldLink}>Terms & Conditions</Text>
                {' '}and{' '}
                <Text style={styles.goldLink}>Privacy Policy</Text>
              </Text>
            </View>

            {/* CREATE ACCOUNT */}
            <LuxuryButton
              title="Create Account  →"
              onPress={handleRegister}
              loading={loading}
              style={styles.registerButton}
            />

            {/* LOGIN LINK */}
            <View style={styles.loginFooter}>
              <Text style={styles.loginFooterText}>
                Already have an account?{' '}
              </Text>

              <TouchableOpacity
                onPress={() => router.replace('/(auth)/login')}
                activeOpacity={0.8}
              >
                <Text style={styles.loginLink}>Login</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* BOTTOM LEGACY BANNER */}
          <View style={styles.legacyBanner}>
            <View style={styles.legacyGlowOne} />
            <View style={styles.legacyGlowTwo} />

            <View style={styles.legacyContent}>
              <Text style={styles.legacyQuote}>
                {'“More Than\nJewellery,\nA Legacy”'}
              </Text>
              <View style={styles.legacyLine} />
            </View>

            <MaterialIcons
              name="auto-awesome"
              size={56}
              color="rgba(222,174,52,0.30)"
              style={styles.legacyIcon}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Feature({
  icon,
  title,
  subtitle,
}: {
  icon: string;
  title: string;
  subtitle: string;
}) {
  return (
    <View style={styles.feature}>
      <MaterialIcons
        name={icon as any}
        size={29}
        color={COLORS.gold}
      />
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureSubtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080808',
  },

  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },

  content: {
    paddingHorizontal: 18,
    paddingTop: 8,
    position: 'relative',
  },

  backgroundGlowLeft: {
    position: 'absolute',
    left: -85,
    top: 145,
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 1,
    borderColor: 'rgba(217,169,39,0.20)',
  },

  backgroundGlowRight: {
    position: 'absolute',
    right: -85,
    top: 330,
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 1,
    borderColor: 'rgba(217,169,39,0.16)',
  },

  topBar: {
    height: 46,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },

  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#5A4B28',
    backgroundColor: '#27251F',
    alignItems: 'center',
    justifyContent: 'center',
  },

  header: {
    alignItems: 'center',
    marginTop: 3,
  },

  brandName: {
    marginTop: 0,
    color: COLORS.gold,
    fontFamily: FONT_FAMILY.serifBold,
    fontSize: 26,
    lineHeight: 32,
    textAlign: 'center',
  },

  brandEnglish: {
    color: COLORS.lightGold,
    fontFamily: FONT_FAMILY.sansSemiBold,
    fontSize: 9.5,
    letterSpacing: 2.6,
    marginTop: 2,
  },

  brandTagline: {
    color: COLORS.lightGold,
    fontFamily: FONT_FAMILY.sans,
    fontSize: 8.5,
    letterSpacing: 1.5,
    marginTop: 4,
  },

  pageTitle: {
    color: COLORS.white,
    fontFamily: FONT_FAMILY.serifBold,
    fontSize: 29,
    lineHeight: 35,
    marginTop: 18,
    textAlign: 'center',
  },

  pageTitleGold: {
    color: COLORS.lightGold,
  },

  pageSubtitle: {
    color: '#C6C6C6',
    fontFamily: FONT_FAMILY.sans,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 5,
  },

  featureStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 17,
    marginBottom: 17,
  },

  feature: {
    width: '31%',
    alignItems: 'center',
  },

  featureTitle: {
    color: '#E5E5E5',
    fontFamily: FONT_FAMILY.sansSemiBold,
    fontSize: 11.5,
    marginTop: 4,
  },

  featureSubtitle: {
    color: '#A3A3A3',
    fontFamily: FONT_FAMILY.sans,
    fontSize: 9.5,
    textAlign: 'center',
    marginTop: 1,
  },

  formCard: {
    width: '100%',
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: '#3B3B3B',
    borderRadius: 21,
    padding: 15,
  },

  nameRow: {
    flexDirection: 'row',
    gap: 9,
  },

  halfField: {
    flex: 1,
    minWidth: 0,
  },

  fieldSpacing: {
    marginTop: 9,
  },

  strengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    marginBottom: 1,
  },

  strengthBar: {
    flex: 1,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#383838',
  },

  strengthBarActive: {
    backgroundColor: COLORS.gold,
  },

  strengthText: {
    marginLeft: 4,
    color: '#AFAFAF',
    fontFamily: FONT_FAMILY.sans,
    fontSize: 9,
    minWidth: 112,
  },

  strengthValue: {
    color: COLORS.lightGold,
    fontFamily: FONT_FAMILY.sansSemiBold,
  },

  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 11,
    paddingHorizontal: 2,
  },

  checkbox: {
    width: 27,
    height: 27,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#BEBEBE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },

  termsText: {
    flex: 1,
    color: '#D0D0D0',
    fontFamily: FONT_FAMILY.sans,
    fontSize: 11.5,
    lineHeight: 19,
    paddingTop: 2,
  },

  goldLink: {
    color: COLORS.gold,
    fontFamily: FONT_FAMILY.sansSemiBold,
  },

  registerButton: {
    width: '100%',
    marginTop: 13,
    minHeight: 54,
  },

  loginFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 17,
  },

  loginFooterText: {
    color: '#BDBDBD',
    fontFamily: FONT_FAMILY.sans,
    fontSize: 13,
  },

  loginLink: {
    color: COLORS.gold,
    fontFamily: FONT_FAMILY.sansSemiBold,
    fontSize: 13,
  },

  legacyBanner: {
    height: 154,
    marginTop: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#624B16',
    overflow: 'hidden',
    backgroundColor: '#0D0D0D',
    position: 'relative',
    justifyContent: 'center',
  },

  legacyGlowOne: {
    position: 'absolute',
    right: -40,
    top: -72,
    width: 215,
    height: 215,
    borderRadius: 108,
    borderWidth: 2,
    borderColor: 'rgba(230,184,58,0.34)',
    transform: [{ rotate: '-16deg' }],
  },

  legacyGlowTwo: {
    position: 'absolute',
    right: -95,
    bottom: -118,
    width: 250,
    height: 250,
    borderRadius: 125,
    borderWidth: 1,
    borderColor: 'rgba(230,184,58,0.17)',
  },

  legacyContent: {
    paddingLeft: 19,
    zIndex: 3,
  },

  legacyQuote: {
    color: '#F1F1F1',
    fontFamily: FONT_FAMILY.serifBold,
    fontStyle: 'italic',
    fontSize: 19,
    lineHeight: 26,
  },

  legacyLine: {
    width: 68,
    height: 2,
    backgroundColor: COLORS.gold,
    marginTop: 10,
  },

  legacyIcon: {
    position: 'absolute',
    right: 28,
    top: 45,
  },
});
