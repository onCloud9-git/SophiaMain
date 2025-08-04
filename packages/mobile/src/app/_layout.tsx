import { Stack } from 'expo-router';
import { View } from 'react-native';
import { useTheme } from '../hooks/useTheme';

export default function RootLayout() {
  const theme = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen 
          name="(tabs)" 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="auth" 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="business" 
          options={{ headerShown: false }} 
        />
      </Stack>
    </View>
  );
}