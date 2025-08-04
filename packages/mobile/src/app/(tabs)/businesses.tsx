import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  FlatList,
} from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { Button, Card, BusinessCardSkeleton } from '../../components/ui';
import { BusinessCard } from '../../components/business';
import { useBusinessStore } from '../../stores/businessStore';

export default function Businesses() {
  const theme = useTheme();
  const { 
    businesses, 
    metrics, 
    isLoading, 
    error,
    setBusinesses,
    setLoading,
    setError 
  } = useBusinessStore();

  // Simulate loading businesses data
  useEffect(() => {
    loadBusinesses();
  }, []);

  const loadBusinesses = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock businesses data for demonstration
      const mockBusinesses = [
        {
          id: '1',
          name: 'TaskFlow Pro',
          description: 'AI-powered task management platform that helps teams organize, prioritize, and complete projects efficiently.',
          industry: 'SaaS',
          status: 'ACTIVE' as const,
          websiteUrl: 'https://taskflow-pro.com',
          monthlyPrice: 29.99,
          currency: 'USD',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'FitTracker AI',
          description: 'Smart fitness tracking app with personalized workout plans and nutrition guidance.',
          industry: 'Health & Fitness',
          status: 'DEVELOPING' as const,
          monthlyPrice: 19.99,
          currency: 'USD',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '3',
          name: 'LearnCode Hub',
          description: 'Interactive coding bootcamp platform with live mentorship and project-based learning.',
          industry: 'Education',
          status: 'DEPLOYING' as const,
          monthlyPrice: 49.99,
          currency: 'USD',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      
      setBusinesses(mockBusinesses);
    } catch (err) {
      setError('Failed to load businesses');
    } finally {
      setLoading(false);
    }
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
    errorContainer: {
      alignItems: 'center',
      padding: theme.spacing.xl,
    },
    errorText: {
      fontSize: theme.typography.fontSize.base,
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.error,
      textAlign: 'center',
      marginBottom: theme.spacing.md,
    },
    listContainer: {
      flex: 1,
    },
  });

  const handleCreateBusiness = () => {
    router.push('/business/create');
  };

  const handleRetry = () => {
    loadBusinesses();
  };

  // Render loading state
  const renderLoadingState = () => (
    <View>
      {[1, 2, 3].map((index) => (
        <BusinessCardSkeleton key={index} />
      ))}
    </View>
  );

  // Render error state
  const renderErrorState = () => (
    <Card>
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Button
          title="Try Again"
          onPress={handleRetry}
          variant="secondary"
        />
      </View>
    </Card>
  );

  // Render empty state
  const renderEmptyState = () => (
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
  );

  return (
    <SafeAreaView style={styles.container}>
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

        {/* Content */}
        <View style={styles.listContainer}>
          {isLoading ? (
            renderLoadingState()
          ) : error ? (
            renderErrorState()
          ) : businesses.length === 0 ? (
            renderEmptyState()
          ) : (
            <FlatList
              data={businesses}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <BusinessCard
                  business={item}
                  metrics={metrics[item.id]}
                />
              )}
              showsVerticalScrollIndicator={false}
              refreshing={isLoading}
              onRefresh={loadBusinesses}
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}