import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Switch,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { Card } from '../components/ui';

export default function Settings() {
  const theme = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [autoScalingEnabled, setAutoScalingEnabled] = React.useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = React.useState(false);

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
    sectionTitle: {
      fontSize: theme.typography.fontSize.lg,
      fontFamily: theme.typography.fontFamily.semiBold,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.md,
      marginTop: theme.spacing.lg,
    },
    settingItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border.default,
    },
    settingLabel: {
      fontSize: theme.typography.fontSize.base,
      fontFamily: theme.typography.fontFamily.medium,
      color: theme.colors.text.primary,
      flex: 1,
      marginRight: theme.spacing.md,
    },
    settingDescription: {
      fontSize: theme.typography.fontSize.sm,
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.text.secondary,
      marginTop: theme.spacing.xs,
    },
    actionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: theme.spacing.lg,
      paddingHorizontal: theme.spacing.lg,
    },
    actionIcon: {
      fontSize: 20,
      marginRight: theme.spacing.md,
    },
    actionLabel: {
      fontSize: theme.typography.fontSize.base,
      fontFamily: theme.typography.fontFamily.medium,
      color: theme.colors.text.primary,
      flex: 1,
    },
    actionArrow: {
      fontSize: 16,
      color: theme.colors.text.secondary,
    },
    version: {
      fontSize: theme.typography.fontSize.sm,
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.text.secondary,
      textAlign: 'center',
      marginTop: theme.spacing.xl,
    },
  });

  const SettingToggle = ({ label, description, value, onValueChange }: {
    label: string;
    description?: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
  }) => (
    <View style={styles.settingItem}>
      <View style={{ flex: 1 }}>
        <Text style={styles.settingLabel}>{label}</Text>
        {description && <Text style={styles.settingDescription}>{description}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: theme.colors.border.default, true: theme.colors.primary }}
        thumbColor={value ? theme.colors.surface : theme.colors.text.disabled}
      />
    </View>
  );

  const ActionItem = ({ icon, label, onPress }: {
    icon: string;
    label: string;
    onPress: () => void;
  }) => (
    <TouchableOpacity style={styles.actionItem} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.actionIcon}>{icon}</Text>
      <Text style={styles.actionLabel}>{label}</Text>
      <Text style={styles.actionArrow}>›</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.title}>Settings</Text>

          {/* Notifications Section */}
          <Text style={styles.sectionTitle}>Notifications</Text>
          <Card padding="none" margin="none">
            <SettingToggle
              label="Push Notifications"
              description="Receive notifications about business updates and performance"
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
            />
          </Card>

          {/* AI Automation Section */}
          <Text style={styles.sectionTitle}>AI Automation</Text>
          <Card padding="none" margin="none">
            <SettingToggle
              label="Auto-scaling"
              description="Allow Sophia AI to automatically scale campaigns and budgets"
              value={autoScalingEnabled}
              onValueChange={setAutoScalingEnabled}
            />
          </Card>

          {/* Appearance Section */}
          <Text style={styles.sectionTitle}>Appearance</Text>
          <Card padding="none" margin="none">
            <SettingToggle
              label="Dark Mode"
              description="Switch to dark theme (Coming soon)"
              value={darkModeEnabled}
              onValueChange={setDarkModeEnabled}
            />
          </Card>

          {/* Account Section */}
          <Text style={styles.sectionTitle}>Account</Text>
          <Card padding="none" margin="none">
            <ActionItem
              icon="👤"
              label="Edit Profile"
              onPress={() => {/* TODO: Navigate to profile edit */}}
            />
            <ActionItem
              icon="🔒"
              label="Privacy & Security"
              onPress={() => {/* TODO: Navigate to privacy settings */}}
            />
            <ActionItem
              icon="💳"
              label="Billing & Subscription"
              onPress={() => {/* TODO: Navigate to billing */}}
            />
          </Card>

          {/* Support Section */}
          <Text style={styles.sectionTitle}>Support</Text>
          <Card padding="none" margin="none">
            <ActionItem
              icon="📧"
              label="Contact Support"
              onPress={() => {/* TODO: Open contact support */}}
            />
            <ActionItem
              icon="📋"
              label="Terms of Service"
              onPress={() => {/* TODO: Open terms */}}
            />
            <ActionItem
              icon="🔐"
              label="Privacy Policy"
              onPress={() => {/* TODO: Open privacy policy */}}
            />
          </Card>

          <Text style={styles.version}>Sophia AI v1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}