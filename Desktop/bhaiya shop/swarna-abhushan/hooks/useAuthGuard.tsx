import { useEffect } from 'react';
import { useRouter, useSegments, Redirect } from 'expo-router';
import { useAuth } from '../lib/auth-context';

export const useAuthGuard = (requireAdmin = false) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inAdminGroup = segments[0] === 'admin';
    const inTabsGroup = segments[0] === '(tabs)';

    if (!isAuthenticated && (inTabsGroup || inAdminGroup)) {
      router.replace('/(auth)/login');
      return;
    }

    if (isAuthenticated && inAuthGroup) {
      if (isAdmin) {
        router.replace('/admin');
      } else {
        router.replace('/(tabs)');
      }
      return;
    }

    if (isAuthenticated && inAdminGroup && requireAdmin && !isAdmin) {
      router.replace('/(tabs)');
      return;
    }

    if (!isAuthenticated && !inAuthGroup && !inTabsGroup) {
      router.replace('/(auth)/login');
      return;
    }
  }, [isAuthenticated, isAdmin, loading, segments, router, requireAdmin]);

  return { isAuthenticated, isAdmin, loading };
};

export const withAuthGuard = (Component: React.ComponentType<any>, requireAdmin = false) => {
  return function AuthGuardedComponent(props: any) {
    const { isAuthenticated, isAdmin, loading } = useAuthGuard(requireAdmin);

    if (loading) {
      return null;
    }

    if (!isAuthenticated) {
      return null;
    }

    if (requireAdmin && !isAdmin) {
      return <Redirect href="/(tabs)" />;
    }

    return <Component {...props} />;
  };
};
