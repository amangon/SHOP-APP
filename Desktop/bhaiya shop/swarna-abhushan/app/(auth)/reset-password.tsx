import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';

import {
  COLORS,
  SIZES,
  SPACING,
  RADIUS,
  FONT_FAMILY,
} from '../../constants/theme';

import {
  LuxuryInput,
  AppLogo,
  LuxuryButton,
} from '../../components';

import { supabase } from '../../lib/supabase';

const RECOVERY_TIMEOUT = 12000;

type RecoveryData = {
  code?: string;
  flowId?: string;
  accessToken?: string;
  refreshToken?: string;
  type?: string;
};

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function parseKeyValueString(input: string): Record<string, string> {
  const result: Record<string, string> = {};

  if (!input) {
    return result;
  }

  const parts = input.split('&');

  for (const part of parts) {
    if (!part) continue;

    const equalIndex = part.indexOf('=');

    if (equalIndex === -1) {
      continue;
    }

    const key = safeDecode(
      part.substring(0, equalIndex)
    );

    const value = safeDecode(
      part.substring(equalIndex + 1)
    );

    if (key) {
      result[key] = value;
    }
  }

  return result;
}

function parseRecoveryUrl(
  url: string | null
): RecoveryData | null {
  if (!url) {
    return null;
  }

  try {
    console.log(
      'RESET RAW URL:',
      url.substring(0, 250)
    );

    let queryString = '';
    let hashString = '';

    // ---------------------------------------------------------
    // Query
    // ---------------------------------------------------------
    const questionIndex = url.indexOf('?');
    const hashIndex = url.indexOf('#');

    if (questionIndex !== -1) {
      const queryEnd =
        hashIndex !== -1 && hashIndex > questionIndex
          ? hashIndex
          : url.length;

      queryString = url.substring(
        questionIndex + 1,
        queryEnd
      );
    }

    // ---------------------------------------------------------
    // Hash
    // ---------------------------------------------------------
    if (hashIndex !== -1) {
      hashString = url.substring(
        hashIndex + 1
      );
    }

    const queryParams =
      parseKeyValueString(queryString);

    const hashParams =
      parseKeyValueString(hashString);

    const code =
      queryParams.code ||
      hashParams.code ||
      undefined;

    const flowId =
      queryParams.sb_flow_id ||
      hashParams.sb_flow_id ||
      undefined;

    const accessToken =
      queryParams.access_token ||
      hashParams.access_token ||
      undefined;

    const refreshToken =
      queryParams.refresh_token ||
      hashParams.refresh_token ||
      undefined;

    const type =
      queryParams.type ||
      hashParams.type ||
      undefined;

    console.log(
      'RESET PARSED:',
      JSON.stringify({
        hasCode: !!code,
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        type,
      })
    );

    return {
      code,
      flowId,
      accessToken,
      refreshToken,
      type,
    };
  } catch (error) {
    console.error(
      'RESET URL PARSE ERROR:',
      error
    );

    return null;
  }
}

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] =
    useState('');

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirm, setShowConfirm] =
    useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  const [authReady, setAuthReady] =
    useState(false);

  const [initializing, setInitializing] =
    useState(true);

  const [formError, setFormError] =
    useState<string | null>(null);

  const codeFromParams =
    typeof params.code === 'string' &&
    params.code
      ? params.code
      : undefined;

  const flowIdFromParams =
    typeof params.sb_flow_id === 'string' &&
    params.sb_flow_id
      ? params.sb_flow_id
      : undefined;

  useEffect(() => {
    let mounted = true;
    let handled = false;

    const finishReady = () => {
      if (!mounted) return;

      setAuthReady(true);
      setInitializing(false);
    };

    const finishFailed = () => {
      if (!mounted) return;

      setAuthReady(false);
      setInitializing(false);
    };

    const checkExistingSession =
      async (): Promise<boolean> => {
        try {
          const {
            data,
            error,
          } = await supabase.auth.getSession();

          if (!mounted) {
            return false;
          }

          if (error) {
            console.error(
              'RESET GET SESSION ERROR:',
              error.message
            );

            return false;
          }

          if (data.session?.user) {
            console.log(
              'RESET: existing session found'
            );

            finishReady();
            return true;
          }
        } catch (error: any) {
          console.error(
            'RESET GET SESSION CATCH:',
            error?.message || error
          );
        }

        return false;
      };

    const establishSession =
      async (
        accessToken: string,
        refreshToken: string
      ) => {
        if (!mounted || handled) {
          return;
        }

        handled = true;

        console.log(
          'RESET: establishing recovery session'
        );

        try {
          const {
            data,
            error,
          } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (!mounted) {
            return;
          }

          if (error) {
            console.error(
              'RESET SET SESSION ERROR:',
              error.message
            );

            finishFailed();
            return;
          }

          if (data.session?.user) {
            console.log(
              'RESET: recovery session established'
            );

            finishReady();
            return;
          }

          console.log(
            'RESET: setSession returned no session'
          );

          finishFailed();
        } catch (error: any) {
          if (!mounted) {
            return;
          }

          console.error(
            'RESET SET SESSION CATCH:',
            error?.message || error
          );

          finishFailed();
        }
      };

    const exchangeCode =
      async (
        code: string,
        flowId?: string
      ) => {
        if (!mounted || handled) {
          return;
        }

        handled = true;

        console.log(
          'RESET: exchanging recovery code'
        );

        try {
          const {
            data,
            error,
          } =
            await supabase.auth.exchangeCodeForSession(
              code,
              flowId
                ? { flowId }
                : undefined
            );

          if (!mounted) {
            return;
          }

          if (error) {
            console.error(
              'RESET CODE EXCHANGE ERROR:',
              error.message
            );

            const hasSession =
              await checkExistingSession();

            if (!hasSession) {
              finishFailed();
            }

            return;
          }

          if (data.session?.user) {
            console.log(
              'RESET: code exchange successful'
            );

            finishReady();
            return;
          }

          const hasSession =
            await checkExistingSession();

          if (!hasSession) {
            finishFailed();
          }
        } catch (error: any) {
          if (!mounted) {
            return;
          }

          console.error(
            'RESET CODE EXCHANGE CATCH:',
            error?.message || error
          );

          finishFailed();
        }
      };

    const processUrl =
      async (url: string | null) => {
        if (!url || !mounted || handled) {
          return;
        }

        console.log(
          'RESET DEEP LINK RECEIVED:',
          url.substring(0, 300)
        );

        const recovery =
          parseRecoveryUrl(url);

        if (!recovery) {
          return;
        }

        // -----------------------------------------------------
        // 1. Hash/query access + refresh token
        // -----------------------------------------------------
        if (
          recovery.accessToken &&
          recovery.refreshToken
        ) {
          await establishSession(
            recovery.accessToken,
            recovery.refreshToken
          );

          return;
        }

        // -----------------------------------------------------
        // 2. PKCE code
        // -----------------------------------------------------
        if (recovery.code) {
          await exchangeCode(
            recovery.code,
            recovery.flowId
          );

          return;
        }

        // -----------------------------------------------------
        // 3. Maybe Supabase already has session
        // -----------------------------------------------------
        const hasSession =
          await checkExistingSession();

        if (!hasSession && mounted) {
          console.log(
            'RESET: no recovery credentials found'
          );
        }
      };

    // ---------------------------------------------------------
    // Auth listener
    // ---------------------------------------------------------
    const {
      data: {
        subscription,
      },
    } =
      supabase.auth.onAuthStateChange(
        (event, session) => {
          if (!mounted) {
            return;
          }

          console.log(
            'RESET AUTH EVENT:',
            event
          );

          if (
            event === 'PASSWORD_RECOVERY' &&
            session?.user
          ) {
            console.log(
              'RESET: PASSWORD_RECOVERY received'
            );

            handled = true;
            finishReady();
            return;
          }

          if (
            event === 'SIGNED_IN' &&
            session?.user
          ) {
            console.log(
              'RESET: SIGNED_IN received'
            );

            // Do not force handled for regular signed-in
            // state unless we are on reset flow.
            if (!handled) {
              finishReady();
            }
          }
        }
      );

    // ---------------------------------------------------------
    // Params fallback
    // ---------------------------------------------------------
    if (codeFromParams) {
      exchangeCode(
        codeFromParams,
        flowIdFromParams
      );
    }

    // ---------------------------------------------------------
    // Cold start
    // ---------------------------------------------------------
    Linking.getInitialURL()
      .then(async (url) => {
        if (!mounted) {
          return;
        }

        if (url) {
          console.log(
            'RESET INITIAL URL:',
            url.substring(0, 300)
          );

          await processUrl(url);
        }
      })
      .catch((error) => {
        console.error(
          'RESET INITIAL URL ERROR:',
          error
        );
      });

    // ---------------------------------------------------------
    // Warm start
    // ---------------------------------------------------------
    const linkingSubscription =
      Linking.addEventListener(
        'url',
        async ({ url }) => {
          if (!mounted) {
            return;
          }

          console.log(
            'RESET WARM URL:',
            url.substring(0, 300)
          );

          await processUrl(url);
        }
      );

    // ---------------------------------------------------------
    // Fallback
    // ---------------------------------------------------------
    const timeout = setTimeout(
      async () => {
        if (!mounted || handled) {
          return;
        }

        console.log(
          'RESET: fallback session check'
        );

        const hasSession =
          await checkExistingSession();

        if (!hasSession && mounted) {
          finishFailed();
        }
      },
      RECOVERY_TIMEOUT
    );

    return () => {
      mounted = false;

      linkingSubscription.remove();
      subscription.unsubscribe();

      clearTimeout(timeout);
    };
  }, [
    codeFromParams,
    flowIdFromParams,
  ]);

  const validatePassword =
    (): string | null => {
      if (!password.trim()) {
        return 'Please enter a new password.';
      }

      if (!confirmPassword.trim()) {
        return 'Please confirm your new password.';
      }

      if (password !== confirmPassword) {
        return 'Passwords do not match.';
      }

      if (password.length < 6) {
        return 'Password must be at least 6 characters.';
      }

      return null;
    };

  const handleReset = async () => {
    const validationError =
      validatePassword();

    if (validationError) {
      setFormError(validationError);
      return;
    }

    setFormError(null);
    setSubmitting(true);

    try {
      // Verify there is still an authenticated
      // recovery session before changing password.
      const {
        data: {
          user,
        },
        error: userError,
      } =
        await supabase.auth.getUser();

      if (userError || !user) {
        setFormError(
          'Your reset session has expired. Please request a new reset link.'
        );

        return;
      }

      const {
        error: updateError,
      } =
        await supabase.auth.updateUser({
          password,
        });

      if (updateError) {
        console.error(
          'PASSWORD UPDATE ERROR:',
          updateError.message
        );

        setFormError(
          updateError.message ||
            'Unable to update your password. Please try again.'
        );

        return;
      }

      console.log(
        'PASSWORD RESET SUCCESS'
      );

      await supabase.auth.signOut();

      Alert.alert(
        'Password Reset Successful',
        'Your password has been changed successfully.',
        [
          {
            text: 'Continue',
            onPress: () => {
              router.replace(
                '/(auth)/login'
              );
            },
          },
        ]
      );
    } catch (error: any) {
      console.error(
        'PASSWORD RESET CATCH:',
        error
      );

      setFormError(
        error?.message ||
          'An unexpected error occurred.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestNewLink = () => {
    router.replace(
      '/(auth)/forgot-password'
    );
  };

  const handleBackToLogin = () => {
    router.replace(
      '/(auth)/login'
    );
  };

  // -----------------------------------------------------------
  // Verifying
  // -----------------------------------------------------------
  if (initializing) {
    return (
      <View
        style={[
          styles.container,
          styles.centered,
        ]}
      >
        <AppLogo
          size={96}
          showText={false}
        />

        <Text style={styles.title}>
          Reset Password
        </Text>

        <Text style={styles.subtitle}>
          Verifying your reset link…
        </Text>

        <ActivityIndicator
          color={COLORS.gold}
          style={styles.loading}
          size="large"
        />
      </View>
    );
  }

  // -----------------------------------------------------------
  // Invalid / expired
  // -----------------------------------------------------------
  if (!authReady) {
    return (
      <View
        style={[
          styles.container,
          styles.centered,
        ]}
      >
        <AppLogo
          size={96}
          showText={false}
        />

        <View style={styles.expiredIcon}>
          <MaterialIcons
            name="error-outline"
            size={64}
            color={COLORS.error}
          />
        </View>

        <Text style={styles.title}>
          Reset Link Expired
        </Text>

        <Text style={styles.subtitle}>
          Your password reset link has expired or
          is invalid. Please request a new password
          reset email.
        </Text>

        <LuxuryButton
          title="Request New Reset Link"
          onPress={handleRequestNewLink}
          style={styles.button}
        />

        <TouchableOpacity
          onPress={handleBackToLogin}
          style={styles.backLink}
          activeOpacity={0.8}
        >
          <Text style={styles.backText}>
            Back to Login
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // -----------------------------------------------------------
  // Reset form
  // -----------------------------------------------------------
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={
        Platform.OS === 'android'
          ? 'height'
          : 'padding'
      }
    >
      <ScrollView
        contentContainerStyle={
          styles.scrollContent
        }
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <AppLogo
            size={96}
            showText={false}
          />

          <Text style={styles.title}>
            Reset Password
          </Text>

          <Text style={styles.subtitle}>
            Create a new password for your account.
          </Text>

          {formError ? (
            <View style={styles.errorBox}>
              <MaterialIcons
                name="error-outline"
                size={16}
                color={COLORS.error}
              />

              <Text style={styles.errorText}>
                {formError}
              </Text>
            </View>
          ) : null}

          <View style={styles.fieldRow}>
            <LuxuryInput
              label="New Password"
              placeholder="Enter new password"
              value={password}
              onChangeText={(value) => {
                setPassword(value);

                if (formError) {
                  setFormError(null);
                }
              }}
              secureTextEntry={
                !showPassword
              }
              autoCapitalize="none"
              autoCorrect={false}
              error={
                formError &&
                password.length < 6
                  ? 'Must be at least 6 characters'
                  : undefined
              }
            />

            <TouchableOpacity
              style={styles.eye}
              onPress={() =>
                setShowPassword(
                  (value) => !value
                )
              }
              activeOpacity={0.7}
            >
              <MaterialIcons
                name={
                  showPassword
                    ? 'visibility'
                    : 'visibility-off'
                }
                size={20}
                color={
                  COLORS.secondaryText
                }
              />
            </TouchableOpacity>
          </View>

          <View style={styles.fieldRow}>
            <LuxuryInput
              label="Confirm Password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChangeText={(value) => {
                setConfirmPassword(value);

                if (formError) {
                  setFormError(null);
                }
              }}
              secureTextEntry={
                !showConfirm
              }
              autoCapitalize="none"
              autoCorrect={false}
              error={
                formError &&
                password !== confirmPassword
                  ? 'Passwords do not match'
                  : undefined
              }
            />

            <TouchableOpacity
              style={styles.eye}
              onPress={() =>
                setShowConfirm(
                  (value) => !value
                )
              }
              activeOpacity={0.7}
            >
              <MaterialIcons
                name={
                  showConfirm
                    ? 'visibility'
                    : 'visibility-off'
                }
                size={20}
                color={
                  COLORS.secondaryText
                }
              />
            </TouchableOpacity>
          </View>

          <LuxuryButton
            title="Set New Password"
            onPress={handleReset}
            loading={submitting}
            style={styles.button}
          />

          <TouchableOpacity
            onPress={handleBackToLogin}
            style={styles.backLink}
            activeOpacity={0.8}
          >
            <Text style={styles.backText}>
              Back to Login
            </Text>
          </TouchableOpacity>
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

  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },

  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },

  content: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },

  title: {
    color: COLORS.gold,
    fontFamily: FONT_FAMILY.serifBold,
    fontSize: SIZES.xxxl,
    textAlign: 'center',
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },

  subtitle: {
    color: COLORS.secondaryText,
    fontFamily: FONT_FAMILY.sans,
    fontSize: SIZES.md,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.md,
  },

  fieldRow: {
    position: 'relative',
    width: '100%',
    marginBottom: SPACING.sm,
  },

  eye: {
    position: 'absolute',
    right: SPACING.md,
    top: SPACING.xl,
    padding: SPACING.xs,
  },

  button: {
    marginTop: SPACING.md,
    width: '100%',
  },

  loading: {
    marginTop: SPACING.xl,
  },

  expiredIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: SPACING.xl,
  },

  errorBox: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor:
      'rgba(255, 68, 68, 0.10)',
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.sm,
    gap: SPACING.xs,
  },

  errorText: {
    color: COLORS.error,
    fontSize: SIZES.sm,
    fontFamily: FONT_FAMILY.sans,
    flex: 1,
  },

  backLink: {
    marginTop: SPACING.lg,
    padding: SPACING.sm,
  },

  backText: {
    color: COLORS.gold,
    fontSize: SIZES.md,
    textAlign: 'center',
    fontFamily: FONT_FAMILY.sansSemiBold,
  },
});