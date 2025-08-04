import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Button, Card } from '../../components/ui';

export default function Profile() {
  const theme = useTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      padding: theme.layout.screen.padding,
    },
    title: {
      fontSize: theme.typography.fontSize['2xl'],
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.xl,
    },
    profileInfo: {
      alignItems: 'center',
      marginBottom: theme.spacing.xl,
    },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    avatarText: {
      fontSize: theme.typography.fontSize['2xl'],
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.text.inverse,
    },
    userName: {
      fontSize: theme.typography.fontSize.xl,
      fontFamily: theme.typography.fontFamily.semiBold,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.xs,
    },
    userEmail: {
      fontSize: theme.typography.fontSize.base,
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.text.secondary,
    },
    menuItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: theme.spacing.md,
    },
    menuText: {
      fontSize: theme.typography.fontSize.base,
      fontFamily: theme.typography.fontFamily.medium,
      color: theme.colors.text.primary,
    },
    menuArrow: {
      fontSize: theme.typography.fontSize.lg,
      color: theme.colors.text.secondary,
    },
    dangerButton: {
      marginTop: theme.spacing.xl,
    },
  });

  const menuItems = [
    { title: 'Account Settings', onPress: () => {} },
    { title: 'Notification Preferences', onPress: () => {} },
    { title: 'Connected Services', onPress: () => {} },
    { title: 'Support & Help', onPress: () => {} },
    { title: 'About Sophia AI', onPress: () => {} },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.title}>Profile</Text>

          {/* Profile Info */}
          <Card>
            <View style={styles.profileInfo}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>U</Text>
              </View>
              <Text style={styles.userName}>User</Text>
              <Text style={styles.userEmail}>user@example.com</Text>
            </View>
          </Card>

          {/* Menu Items */}
          <Card>
            {menuItems.map((item, index) => (
              <View key={index}>
                <View style={styles.menuItem}>
                  <Text style={styles.menuText}>{item.title}</Text>
                  <Text style={styles.menuArrow}>›</Text>
                </View>
                {index < menuItems.length - 1 && (
                  <View 
                    style={{
                      height: 1,
                      backgroundColor: theme.colors.border.default,
                      marginVertical: theme.spacing.xs,
                    }}
                  />
                )}
              </View>
            ))}
          </Card>

          {/* Logout Button */}
          <View style={styles.dangerButton}>
            <Button
              title="Sign Out"
              onPress={() => {}}
              variant="error"
              fullWidth
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}