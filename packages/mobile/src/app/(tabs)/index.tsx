import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { Button, Card } from '../../components/ui';

export default function Dashboard() {
  const theme = useTheme();

  const handleCreateBusiness = () => {
    router.push('/business/create');
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      padding: theme.layout.screen.padding,
    },
    header: {
      marginBottom: theme.spacing.xl,
    },
    title: {
      fontSize: theme.typography.fontSize['3xl'],
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.xs,
    },
    subtitle: {
      fontSize: theme.typography.fontSize.lg,
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.text.secondary,
      lineHeight: theme.typography.lineHeight.relaxed * theme.typography.fontSize.lg,
    },
    quickActions: {
      marginBottom: theme.spacing.xl,
    },
    sectionTitle: {
      fontSize: theme.typography.fontSize.xl,
      fontFamily: theme.typography.fontFamily.semiBold,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.md,
    },
    cardContent: {
      alignItems: 'center',
    },
    cardTitle: {
      fontSize: theme.typography.fontSize.lg,
      fontFamily: theme.typography.fontFamily.semiBold,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.sm,
      textAlign: 'center',
    },
    cardDescription: {
      fontSize: theme.typography.fontSize.base,
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.text.secondary,
      textAlign: 'center',
      marginBottom: theme.spacing.lg,
      lineHeight: theme.typography.lineHeight.relaxed * theme.typography.fontSize.base,
    },
    statsCard: {
      alignItems: 'center',
      padding: theme.spacing.lg,
    },
    statValue: {
      fontSize: theme.typography.fontSize['2xl'],
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.primary,
      marginBottom: theme.spacing.xs,
    },
    statLabel: {
      fontSize: theme.typography.fontSize.sm,
      fontFamily: theme.typography.fontFamily.medium,
      color: theme.colors.text.secondary,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Welcome to Sophia AI</Text>
            <Text style={styles.subtitle}>
              Your autonomous business creation and management platform
            </Text>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            
            <Card style={{ marginBottom: theme.spacing.md }}>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>Create New Business</Text>
                <Text style={styles.cardDescription}>
                  Let Sophia AI create and manage a complete business for you automatically
                </Text>
                <Button
                  title="Get Started"
                  onPress={handleCreateBusiness}
                  variant="primary"
                  fullWidth
                />
              </View>
            </Card>

            <Card>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>AI Research Mode</Text>
                <Text style={styles.cardDescription}>
                  Let AI conduct market research and propose business ideas
                </Text>
                <Button
                  title="Start Research"
                  onPress={() => router.push('/business/ai-research')}
                  variant="secondary"
                  fullWidth
                />
              </View>
            </Card>
          </View>

          {/* Quick Stats */}
          <View>
            <Text style={styles.sectionTitle}>Overview</Text>
            
            <View style={{ flexDirection: 'row', gap: theme.spacing.md }}>
              <Card style={{ flex: 1 }}>
                <View style={styles.statsCard}>
                  <Text style={styles.statValue}>0</Text>
                  <Text style={styles.statLabel}>Active Businesses</Text>
                </View>
              </Card>
              
              <Card style={{ flex: 1 }}>
                <View style={styles.statsCard}>
                  <Text style={styles.statValue}>$0</Text>
                  <Text style={styles.statLabel}>Monthly Revenue</Text>
                </View>
              </Card>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}