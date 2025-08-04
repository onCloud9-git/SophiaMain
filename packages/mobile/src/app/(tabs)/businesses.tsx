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

export default function Businesses() {
  const theme = useTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      padding: theme.layout.screen.padding,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.xl,
    },
    title: {
      fontSize: theme.typography.fontSize['2xl'],
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.text.primary,
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
      marginBottom: theme.spacing.xl,
      lineHeight: theme.typography.lineHeight.relaxed * theme.typography.fontSize.base,
      paddingHorizontal: theme.spacing.lg,
    },
  });

  const handleCreateBusiness = () => {
    router.push('/business/create');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>My Businesses</Text>
            <Button
              title="+"
              onPress={handleCreateBusiness}
              variant="primary"
              size="sm"
              style={{ width: 40, paddingHorizontal: 0 }}
            />
          </View>

          {/* Empty State */}
          <Card>
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No businesses yet</Text>
              <Text style={styles.emptyDescription}>
                Start your entrepreneurial journey by creating your first AI-powered business. 
                Sophia will handle everything from development to marketing automatically.
              </Text>
              <Button
                title="Create Your First Business"
                onPress={handleCreateBusiness}
                variant="primary"
                fullWidth
              />
            </View>
          </Card>

          {/* TODO: Add business list when businesses exist */}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}