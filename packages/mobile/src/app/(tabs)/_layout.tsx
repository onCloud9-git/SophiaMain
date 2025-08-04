import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

// You can replace these with actual icons from expo-vector-icons or custom icons
const HomeIcon = () => null; // TODO: Add proper icons
const BusinessIcon = () => null;
const AnalyticsIcon = () => null;
const ProfileIcon = () => null;

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
          tabBarIcon: ({ color, size }) => <HomeIcon />,
        }}
      />
      <Tabs.Screen
        name="businesses"
        options={{
          title: 'Businesses',
          tabBarIcon: ({ color, size }) => <BusinessIcon />,
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ color, size }) => <AnalyticsIcon />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <ProfileIcon />,
        }}
      />
    </Tabs>
  );
}