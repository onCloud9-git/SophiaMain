import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

import { Text } from 'react-native';

// Simple text-based icons for now
const HomeIcon = ({ color }: { color: string }) => (
  <Text style={{ color, fontSize: 20, fontWeight: 'bold' }}>⌂</Text>
);
const BusinessIcon = ({ color }: { color: string }) => (
  <Text style={{ color, fontSize: 20, fontWeight: 'bold' }}>◆</Text>
);
const AnalyticsIcon = ({ color }: { color: string }) => (
  <Text style={{ color, fontSize: 20, fontWeight: 'bold' }}>📊</Text>
);
const ProfileIcon = ({ color }: { color: string }) => (
  <Text style={{ color, fontSize: 20, fontWeight: 'bold' }}>👤</Text>
);

export default function TabLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.text.secondary,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border.default,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          paddingTop: 8,
          height: Platform.OS === 'ios' ? 90 : 60,
          ...theme.shadows.sm,
        },
        tabBarLabelStyle: {
          fontSize: theme.typography.fontSize.xs,
          fontFamily: theme.typography.fontFamily.medium,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => <HomeIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="businesses"
        options={{
          title: 'Businesses',
          tabBarIcon: ({ color, size }) => <BusinessIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ color, size }) => <AnalyticsIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <ProfileIcon color={color} />,
        }}
      />
    </Tabs>
  );
}