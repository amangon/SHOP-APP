import { Stack, SplashScreen, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect, useRef, useCallback } from 'react';
import { AuthProvider } from '../lib/auth-context';
import { supabase, withTimeout } from '../lib/supabase';
import * as Font from 'expo-font';
import * as Linking from 'expo-linking';

import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_500Medium,
  PlayfairDisplay_700Bold,
} from '@expo-google-fonts/playfair-display';

import {
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
} from '@expo-google-fonts/montserrat';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 2,
      gcTime: 1000 * 60 * 5,
    },
  },
});

export default function RootLayout() {
  const router = useRouter();

  const [client] = useState(() => queryClient);
  const [isReady, setIsReady] = useState(false);
  const isReadyRef = useRef(false);
  const hasHiddenSplash = useRef(false);

  const [fontsLoaded] = Font.useFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_500Medium,
    PlayfairDisplay_700Bold,
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
  });

  const hideSplash = useCallback(async () => {
    if (hasHiddenSplash.current) return;
    hasHiddenSplash.current = true;
    try {
      await SplashScreen.hideAsync();
      console.log('[BOOT] SplashScreen hidden');
    } catch (error) {
      console.error('[BOOT] SplashScreen.hideAsync failed:', error);
    }
  }, []);

  useEffect(() => {
    console.log('[BOOT] layout mounted, fontsLoaded:', fontsLoaded);

    const splashStartTime = Date.now();
    const MIN_SPLASH_MS = 1000;
    const MAX_INIT_MS = 4000;
    const maxTimer = setTimeout(() => {
      console.log('[BOOT] Max init timeout reached');
      if (!isReadyRef.current) {
        isReadyRef.current = true;
        setIsReady(true);
        hideSplash();
      }
    }, MAX_INIT_MS);

    if (!fontsLoaded) {
      console.log('[BOOT] Waiting for fonts...');
      return () => clearTimeout(maxTimer);
    }

    const init = async () => {
      try {
        console.log('[BOOT] Checking auth session...');
        await withTimeout(
          supabase.auth.getSession(),
          15000,
          'Auth session check'
        );
        console.log('[BOOT] Auth session check complete');
      } catch (error) {
        console.log('[BOOT] Auth session check failed:', error);
      } finally {
        clearTimeout(maxTimer);
        if (!isReadyRef.current) {
          isReadyRef.current = true;
          setIsReady(true);
          const elapsed = Date.now() - splashStartTime;
          const remaining = Math.max(0, MIN_SPLASH_MS - elapsed);
          setTimeout(() => hideSplash(), remaining);
          console.log('[BOOT] Initialization complete');
        }
      }
    };

    init();

    return () => clearTimeout(maxTimer);
  }, [fontsLoaded, hideSplash]);

  useEffect(() => {
    if (!isReady) return;

    let mounted = true;

    const handleDeepLink = async (
      url: string | null
    ) => {
      if (!url || !mounted) return;

      console.log(
        'APP DEEP LINK:',
        url
      );

      try {
        const parsed = Linking.parse(url);

        console.log(
          'DEEP LINK PATH:',
          parsed.path
        );

        console.log(
          'DEEP LINK QUERY:',
          parsed.queryParams
        );

        // ----------------------------------------------------
        // Detect reset-password deep link
        // ----------------------------------------------------
        const isResetLink =
          url.startsWith(
            'swarna-abhushan://reset-password'
          ) ||
          parsed.path === 'reset-password' ||
          parsed.hostname === 'reset-password';

        if (!isResetLink) {
          return;
        }

        console.log(
          'RESET PASSWORD DEEP LINK DETECTED'
        );

        // ----------------------------------------------------
        // Navigate explicitly to reset-password screen
        //
        // Important:
        // access_token / refresh_token may be in hash,
        // so we DO NOT try to put them into router params.
        // reset-password.tsx reads the complete URL using
        // Linking.getInitialURL / Linking event.
        // ----------------------------------------------------
        if (mounted) {
          router.replace(
            '/(auth)/reset-password'
          );
        }
      } catch (error) {
        console.error(
          'DEEP LINK HANDLING ERROR:',
          error
        );
      }
    };

    // --------------------------------------------------------
    // Cold start
    // --------------------------------------------------------
    Linking.getInitialURL()
      .then((url) => {
        if (mounted && url) {
          handleDeepLink(url);
        }
      })
      .catch((error) => {
        console.error(
          'INITIAL DEEP LINK ERROR:',
          error
        );
      });

    // --------------------------------------------------------
    // Warm start
    // --------------------------------------------------------
    const subscription =
      Linking.addEventListener(
        'url',
        ({ url }) => {
          handleDeepLink(url);
        }
      );

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, [isReady, router]);

  if (!isReady) {
    return null;
  }

  return (
    <QueryClientProvider client={client}>
      <AuthProvider>
        <StatusBar style="light" />

        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: {
              backgroundColor: '#080808',
            },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen
            name="index"
            options={{
              animation: 'fade',
            }}
          />

          <Stack.Screen
            name="(auth)/login"
            options={{
              animation: 'fade',
            }}
          />

          <Stack.Screen
            name="(auth)/register"
            options={{
              animation: 'fade',
            }}
          />

          <Stack.Screen
            name="(auth)/forgot-password"
            options={{
              animation: 'fade',
            }}
          />

          <Stack.Screen
            name="(auth)/reset-password"
            options={{
              animation: 'fade',
            }}
          />

          <Stack.Screen
            name="(tabs)"
            options={{
              animation: 'fade',
            }}
          />

          <Stack.Screen
            name="product/[id]"
            options={{
              animation: 'slide_from_right',
            }}
          />

          <Stack.Screen
            name="admin"
            options={{
              animation: 'fade',
            }}
          />

          <Stack.Screen
            name="about"
            options={{
              animation: 'slide_from_right',
            }}
          />

          <Stack.Screen
            name="contact"
            options={{
              animation: 'slide_from_right',
            }}
          />

          <Stack.Screen
            name="privacy"
            options={{
              animation: 'slide_from_right',
            }}
          />

          <Stack.Screen
            name="favourites"
            options={{
              animation: 'slide_from_right',
            }}
          />

          <Stack.Screen
            name="notifications"
            options={{
              animation: 'slide_from_right',
            }}
          />
        </Stack>
      </AuthProvider>
    </QueryClientProvider>
  );
}