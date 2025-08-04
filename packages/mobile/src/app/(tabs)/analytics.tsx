import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Card } from '../../components/ui';

export default function Analytics() {
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
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: theme.spacing.xxxl,
    },
    emptyTitle: {
      fontSize: theme.typography.fontSize.xl,
      fontFamily: theme.typography.fontFamily.semiBold,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.md,
      textAlign: 'center',
    },
    emptyDescription: {
      fontSize: theme.typography.fontSize.base,
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.text.secondary,
      textAlign: 'center',
      lineHeight: theme.typography.lineHeight.relaxed * theme.typography.fontSize.base,
      paddingHorizontal: theme.spacing.lg,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.title}>Analytics</Text>

          {/* Empty State */}
          <Card>
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No analytics data yet</Text>
              <Text style={styles.emptyDescription}>
                Once you create your first business, you'll see detailed analytics, 
                performance metrics, and AI-powered insights here.
              </Text>
            </View>
          </Card>

          {/* TODO: Add analytics charts and metrics when data exists */}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}