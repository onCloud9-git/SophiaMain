import { Drawer } from 'expo-router/drawer';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useTheme } from '../hooks/useTheme';
import { Text } from 'react-native';

// Simple text-based icons for drawer
const SettingsIcon = ({ color }: { color: string }) => (
  <Text style={{ color, fontSize: 20 }}>⚙️</Text>
);

const HelpIcon = ({ color }: { color: string }) => (
  <Text style={{ color, fontSize: 20 }}>❓</Text>
);

const NotificationsIcon = ({ color }: { color: string }) => (
  <Text style={{ color, fontSize: 20 }}>🔔</Text>
);

export default function RootLayout() {
  const theme = useTheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        screenOptions={{
          headerShown: true,
          headerStyle: {
            backgroundColor: theme.colors.surface,
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border.default,
          },
          headerTintColor: theme.colors.text.primary,
          headerTitleStyle: {
            fontFamily: theme.typography.fontFamily.semiBold,
            fontSize: theme.typography.fontSize.lg,
          },
          drawerStyle: {
            backgroundColor: theme.colors.background,
            width: 280,
          },
          drawerActiveTintColor: theme.colors.primary,
          drawerInactiveTintColor: theme.colors.text.secondary,
          drawerLabelStyle: {
            fontFamily: theme.typography.fontFamily.medium,
            fontSize: theme.typography.fontSize.base,
            marginLeft: -16,
          },
          drawerItemStyle: {
            borderRadius: theme.borderRadius.md,
            marginHorizontal: theme.spacing.sm,
            marginVertical: 2,
          },
        }}
      >
        <Drawer.Screen
          name="(tabs)"
          options={{
            title: 'Sophia AI',
            drawerLabel: 'Dashboard',
            drawerIcon: ({ color, size }) => (
              <Text style={{ color, fontSize: 20 }}>⌂</Text>
            ),
          }}
        />
        <Drawer.Screen
          name="notifications"
          options={{
            title: 'Notifications',
            drawerLabel: 'Notifications',
            drawerIcon: ({ color, size }) => <NotificationsIcon color={color} />,
          }}
        />
        <Drawer.Screen
          name="settings"
          options={{
            title: 'Settings',
            drawerLabel: 'Settings',
            drawerIcon: ({ color, size }) => <SettingsIcon color={color} />,
          }}
        />
        <Drawer.Screen
          name="help"
          options={{
            title: 'Help & Support',
            drawerLabel: 'Help & Support',
            drawerIcon: ({ color, size }) => <HelpIcon color={color} />,
          }}
        />
        <Drawer.Screen
          name="auth"
          options={{
            drawerItemStyle: { display: 'none' }, // Hide auth from drawer
          }}
        />
        <Drawer.Screen
          name="business"
          options={{
            drawerItemStyle: { display: 'none' }, // Hide business from drawer
          }}
        />
      </Drawer>
    </GestureHandlerRootView>
  );
}