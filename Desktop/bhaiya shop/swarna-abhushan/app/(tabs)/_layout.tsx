import React from 'react';
import { Platform, View } from 'react-native';
import { Tabs, Redirect } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS, FONT_FAMILY } from '../../constants/theme';
import { useAuth } from '../../lib/auth-context';
import { BusinessTicker } from '../../components';

export default function TabsLayout() {
  const { isAuthenticated, loading } = useAuth();
  const insets = useSafeAreaInsets();

  if (loading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  const TAB_CONTENT_HEIGHT = 64;

  const safeBottom = Math.max(
    insets.bottom,
    Platform.OS === 'ios' ? 8 : 8
  );

  const TAB_TOTAL_HEIGHT =
    TAB_CONTENT_HEIGHT + safeBottom;

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarHideOnKeyboard: true,

          tabBarStyle: {
            height: TAB_TOTAL_HEIGHT,
            paddingTop: 5,
            paddingBottom: safeBottom,
            backgroundColor: '#111111',
            borderTopWidth: 1,
            borderTopColor: '#303030',
            elevation: 0,
            shadowOpacity: 0,
          },

          tabBarActiveTintColor: COLORS.gold,
          tabBarInactiveTintColor: '#B8B8B8',

          tabBarLabelStyle: {
            fontSize: 11,
            lineHeight: 14,
            fontFamily: FONT_FAMILY.sansSemiBold,
            fontWeight: '600',
            marginTop: 0,
            marginBottom: 1,
          },

          tabBarIconStyle: {
            marginTop: 1,
          },

          tabBarItemStyle: {
            paddingVertical: 0,
          },

          tabBarShowLabel: true,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarAccessibilityLabel: 'Home',
            tabBarIcon: ({ color }) => (
              <MaterialIcons
                name="home"
                size={27}
                color={color}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="jewellery"
          options={{
            title: 'Jewellery',
            tabBarAccessibilityLabel: 'Jewellery',
            tabBarIcon: ({ color }) => (
              <MaterialIcons
                name="diamond"
                size={26}
                color={color}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="rates"
          options={{
            title: 'Rates',
            tabBarAccessibilityLabel: 'Rates',
            tabBarIcon: ({ color }) => (
              <MaterialIcons
                name="trending-up"
                size={27}
                color={color}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarAccessibilityLabel: 'Profile',
            tabBarIcon: ({ color }) => (
              <MaterialIcons
                name="person"
                size={27}
                color={color}
              />
            ),
          }}
        />
      </Tabs>

      <View
        style={{
          position: 'absolute',
          bottom: TAB_TOTAL_HEIGHT,
          left: 0,
          right: 0,
        }}
      >
        <BusinessTicker />
      </View>
    </View>
  );
}