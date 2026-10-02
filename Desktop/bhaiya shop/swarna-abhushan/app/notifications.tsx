import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { COLORS, FONT_FAMILY, RADIUS, SIZES, SPACING } from '../constants/theme';
import { EmptyState, ErrorState, LoadingScreen } from '../components';
import { useNotifications } from '../hooks';
import { markNotificationRead } from '../services/api';

export default function NotificationsScreen() {
  const router = useRouter();
  const { data: notifications, isLoading, error, refetch } = useNotifications();
  if (isLoading) return <LoadingScreen message="Loading notifications..." />;
  if (error) return <ErrorState title="Unable to load notifications" message="Please try again." onRetry={() => refetch()} />;

  const openNotification = async (notification: NonNullable<typeof notifications>[number]) => {
    try {
      if (!notification.read_at) await markNotificationRead(notification.id);
      if (notification.target_route) router.push(notification.target_route as never);
      else await refetch();
    } catch (notificationError: any) {
      console.error('Notification update failed:', notificationError);
      Alert.alert('Unable to update notification', notificationError?.message || 'Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.back}>‹</Text></TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        <View style={styles.spacer} />
      </View>
      {!notifications?.length ? (
        <EmptyState title="All caught up" message="New rate updates and jewellery news will appear here." />
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {notifications.map((notification) => (
            <TouchableOpacity key={notification.id} style={[styles.card, !notification.read_at && styles.unread]} onPress={() => void openNotification(notification)}>
              <View style={styles.dot} />
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{notification.title}</Text>
                <Text style={styles.message}>{notification.message}</Text>
                <Text style={styles.date}>{new Date(notification.created_at).toLocaleString('en-IN')}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING.lg, paddingTop: SPACING.xl, borderBottomWidth: 1, borderBottomColor: COLORS.darkBorder },
  back: { color: COLORS.gold, fontSize: 36 },
  title: { color: COLORS.white, fontFamily: FONT_FAMILY.serifBold, fontSize: SIZES.xxl },
  spacer: { width: 24 },
  list: { padding: SPACING.lg },
  card: { flexDirection: 'row', backgroundColor: COLORS.secondary, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.darkBorder, padding: SPACING.md, marginBottom: SPACING.md },
  unread: { borderColor: COLORS.goldBorder },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.gold, marginTop: 6, marginRight: SPACING.md },
  cardContent: { flex: 1 },
  cardTitle: { color: COLORS.white, fontFamily: FONT_FAMILY.sansSemiBold, fontSize: SIZES.md },
  message: { color: COLORS.secondaryText, fontFamily: FONT_FAMILY.sans, fontSize: SIZES.sm, lineHeight: 20, marginTop: SPACING.xs },
  date: { color: COLORS.secondaryText, fontFamily: FONT_FAMILY.sans, fontSize: SIZES.xs, marginTop: SPACING.sm },
});
