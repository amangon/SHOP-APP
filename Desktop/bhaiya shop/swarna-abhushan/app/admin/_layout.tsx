import { Stack, Redirect } from 'expo-router';
import { COLORS } from '../../constants/theme';
import { useAuth } from '../../lib/auth-context';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

export default function AdminLayout() {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.gold} />
      </View>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return <Redirect href="/(tabs)/profile" />;
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.secondary },
        headerTitleStyle: { color: COLORS.gold, fontWeight: '600' },
        contentStyle: { backgroundColor: COLORS.primary },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" options={{ headerTitle: 'Dashboard' }} />
      <Stack.Screen name="products" options={{ headerTitle: 'Products' }} />
      <Stack.Screen name="featured" options={{ headerTitle: 'Featured Products' }} />
      <Stack.Screen name="new-arrivals" options={{ headerTitle: 'New Arrivals' }} />
      <Stack.Screen name="banners" options={{ headerTitle: 'Home Banners' }} />
      <Stack.Screen name="categories" options={{ headerTitle: 'Categories' }} />
      <Stack.Screen name="users" options={{ headerTitle: 'Users' }} />
      <Stack.Screen name="login-logo" options={{ headerTitle: 'Login Logo' }} />
      <Stack.Screen name="settings" options={{ headerTitle: 'App Settings' }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
