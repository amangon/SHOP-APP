import { useEffect, useState } from 'react';
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
import { COLORS, SIZES, SPACING, FONT_FAMILY } from '../../constants/theme';
import { LoginLogo, LuxuryButton, LuxuryInput } from '../../components';
import { signInWithEmail } from '../../services/auth';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const runDiagnostics = async () => {
      const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
      const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

      console.log('DIAGNOSTIC: Supabase URL from env:', url);
      console.log('DIAGNOSTIC: Supabase key present:', key ? 'Yes' : 'No');

      if (!url) {
        console.error('DIAGNOSTIC: Supabase URL is missing!');
        return;
      }

      try {
        const response = await fetch(url);
        console.log('DIAGNOSTIC: RAW FETCH STATUS:', response.status);
        console.log('DIAGNOSTIC: RAW FETCH BODY:', await response.text());
      } catch (error) {
        console.error('DIAGNOSTIC: RAW FETCH FAILED:', error);
      }

      if (key) {
        try {
          const response = await fetch(`${url}/auth/v1/settings`, {
            headers: { apikey: key },
          });
          console.log('DIAGNOSTIC: AUTH FETCH STATUS:', response.status);
          console.log('DIAGNOSTIC: AUTH FETCH BODY:', await response.text());
        } catch (error) {
          console.error('DIAGNOSTIC: AUTH FETCH FAILED:', error);
        }

        // Keep the existing diagnostic behavior.
        try {
          const signInResult = await signInWithEmail(
            'test@example.com',
            'testpassword123'
          );
          console.log(
            'DIAGNOSTIC: SIGN IN RESULT:',
            JSON.stringify(signInResult)
          );
        } catch (error) {
          console.error('DIAGNOSTIC: SIGN IN ERROR:', error);
        }
      }
    };

    runDiagnostics();
  }, []);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setLoading(true);

    try {
      const result = await signInWithEmail(email, password);

      if (result.success && result.user) {
        router.replace('/(tabs)');
      } else if (result.error) {
        Alert.alert('Login Failed', result.error);
      } else {
        Alert.alert(
          'Login Failed',
          'Unable to retrieve user profile. Please try again.'
        );
      }
    } catch (error: any) {
      Alert.alert(
        'Error',
        error?.message || 'An unexpected error occurred'
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
          {/* BRANDING */}
          <View style={styles.header}>
            <View style={styles.logoWrap}>
              <LoginLogo size={155} />
            </View>

            <Text style={styles.welcome}>Welcome to</Text>
            <Text style={styles.brandNameEnglish}>SWARNA ABHUSHAN</Text>
            <Text style={styles.subtitle}>
              Where Tradition Meets Modern Elegance
            </Text>

            <View style={styles.dividerDecor}>
              <View style={styles.decorLine} />
              <MaterialIcons
                name="auto-awesome"
                size={17}
                color={COLORS.gold}
              />
              <View style={styles.decorLine} />
            </View>

            <View style={styles.featureRow}>
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
          </View>

          {/* LOGIN CARD */}
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Login to Your Account</Text>
            <Text style={styles.formSubtitle}>
              Access your jewellery world
            </Text>

            <View style={styles.inputSpacing}>
              <LuxuryInput
                label="Email"
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputSpacing}>
              <LuxuryInput
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              onPress={() =>
                router.push('/(auth)/forgot-password')
              }
              activeOpacity={0.8}
            >
              <Text style={styles.forgotPassword}>
                Forgot Password?
              </Text>
            </TouchableOpacity>

            <LuxuryButton
              title="Login  →"
              onPress={handleLogin}
              loading={loading}
              style={styles.loginButton}
            />

                        {/* REGISTER */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Don't have an account?{' '}
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/(auth)/register')}
                activeOpacity={0.8}
              >
                <Text style={styles.linkText}>Create Account</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* BOTTOM BRAND BANNER */}
          <View style={styles.bottomBanner}>
            <View style={styles.bannerGoldGlowOne} />
            <View style={styles.bannerGoldGlowTwo} />
            <View style={styles.bottomBannerOverlay} />

            <View style={styles.bottomBannerTextWrap}>
              <Text style={styles.bottomBannerEyebrow}>SWARNA ABHUSHAN</Text>
              <Text style={styles.bottomQuote}>
                {'“More Than\nJewellery,\nA Legacy”'}
              </Text>
              <View style={styles.quoteLine} />
            </View>

            <View style={styles.decorJewel}>
              <View style={styles.decorJewelOuter} />
              <View style={styles.decorJewelInner} />
            </View>
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
        size={30}
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
    paddingBottom: 20,
  },

  content: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 12,
    position: 'relative',
  },

  backgroundGlowLeft: {
    position: 'absolute',
    left: -90,
    top: 120,
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: 'rgba(193,145,29,0.05)',
  },

  backgroundGlowRight: {
    position: 'absolute',
    right: -100,
    bottom: 220,
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: 'rgba(193,145,29,0.045)',
  },

  header: {
    alignItems: 'center',
    marginBottom: 18,
  },

  logoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },

  welcome: {
    color: '#D2D2D2',
    fontFamily: FONT_FAMILY.sans,
    fontSize: 17,
    marginTop: 4,
  },

  brandNameEnglish: {
    color: COLORS.lightGold,
    fontFamily: FONT_FAMILY.serifBold,
    fontSize: 28,
    letterSpacing: 2,
    marginTop: 5,
    textAlign: 'center',
  },

  subtitle: {
    color: '#C3C3C3',
    fontFamily: FONT_FAMILY.sans,
    fontSize: 13.5,
    marginTop: 5,
    textAlign: 'center',
  },

  dividerDecor: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '75%',
    marginTop: 14,
    gap: 9,
  },

  decorLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(214,170,58,0.42)',
  },

  featureRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 17,
  },

  feature: {
    width: '31%',
    alignItems: 'center',
  },

  featureTitle: {
    color: '#E7E7E7',
    fontFamily: FONT_FAMILY.sansSemiBold,
    fontSize: 12.5,
    marginTop: 5,
  },

  featureSubtitle: {
    color: '#A8A8A8',
    fontFamily: FONT_FAMILY.sans,
    fontSize: 10.5,
    textAlign: 'center',
    marginTop: 1,
  },

  formCard: {
    width: '100%',
    backgroundColor: 'rgba(20,20,20,0.97)',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#3B3B3B',
    paddingHorizontal: 18,
    paddingVertical: 19,
  },

  formTitle: {
    color: COLORS.white,
    fontFamily: FONT_FAMILY.serifBold,
    fontSize: 25,
    lineHeight: 31,
  },

  formSubtitle: {
    color: '#BEBEBE',
    fontFamily: FONT_FAMILY.sans,
    fontSize: 14,
    marginTop: 4,
    marginBottom: 18,
  },

  inputSpacing: {
    marginBottom: 11,
  },

  forgotPassword: {
    color: COLORS.gold,
    fontSize: 13,
    textAlign: 'right',
    marginTop: 1,
    marginBottom: 9,
    fontFamily: FONT_FAMILY.sansSemiBold,
  },

  loginButton: {
    marginTop: 3,
    width: '100%',
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 19,
  },

  footerText: {
    color: '#BDBDBD',
    fontSize: 13,
    fontFamily: FONT_FAMILY.sans,
  },

  linkText: {
    color: COLORS.gold,
    fontSize: 13,
    fontFamily: FONT_FAMILY.sansSemiBold,
  },

  bottomBanner: {
    height: 150,
    marginTop: 14,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#6B531A',
    position: 'relative',
    justifyContent: 'center',
    backgroundColor: '#0E0E0E',
  },

  bottomBannerTextWrap: {
    zIndex: 3,
    paddingLeft: 20,
    paddingRight: 165,
  },

  bottomBannerEyebrow: {
    color: COLORS.lightGold,
    fontFamily: FONT_FAMILY.sansSemiBold,
    fontSize: 9,
    letterSpacing: 2.1,
    marginBottom: 5,
  },

  bottomBannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5,5,5,0.18)',
  },

  bannerGoldGlowOne: {
    position: 'absolute',
    right: -40,
    top: -55,
    width: 210,
    height: 210,
    borderRadius: 105,
    borderWidth: 2,
    borderColor: 'rgba(226,180,58,0.36)',
    transform: [{ rotate: '-18deg' }],
  },

  bannerGoldGlowTwo: {
    position: 'absolute',
    right: -85,
    bottom: -110,
    width: 250,
    height: 250,
    borderRadius: 125,
    borderWidth: 1,
    borderColor: 'rgba(226,180,58,0.2)',
    transform: [{ rotate: '24deg' }],
  },

  decorJewel: {
    position: 'absolute',
    right: 26,
    top: 30,
    width: 112,
    height: 92,
    borderRadius: 56,
    borderWidth: 1,
    borderColor: 'rgba(230,189,78,0.45)',
    transform: [{ rotate: '-14deg' }],
    alignItems: 'center',
    justifyContent: 'center',
  },

  decorJewelOuter: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2,
    borderColor: '#DDB447',
    transform: [{ rotate: '45deg' }],
  },

  decorJewelInner: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#C79622',
    opacity: 0.72,
  },

  bottomQuote: {
    color: '#F1F1F1',
    fontFamily: FONT_FAMILY.serifBold,
    fontStyle: 'italic',
    fontSize: 18,
    lineHeight: 25,
  },

  quoteLine: {
    width: 82,
    height: 2,
    backgroundColor: COLORS.gold,
    marginTop: 10,
  },
});
