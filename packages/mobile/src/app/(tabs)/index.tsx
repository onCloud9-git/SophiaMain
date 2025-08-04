import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { useWebSocket } from '../../hooks/useWebSocket';
import { Button, Card, DashboardStatSkeleton } from '../../components/ui';
import { BusinessCard } from '../../components/business';
import { useBusinessStore } from '../../stores/businessStore';

export default function Dashboard() {
  const theme = useTheme();
  const { 
    businesses, 
    metrics, 
    isLoading,
    getActiveBusinesses,
    getTotalRevenue 
  } = useBusinessStore();

  // Initialize WebSocket connection
  const { isConnected } = useWebSocket('user-123'); // TODO: Use real user ID

  const activeBusinesses = getActiveBusinesses();
  const totalRevenue = getTotalRevenue();
  const recentBusinesses = businesses.slice(0, 3); // Show latest 3 businesses

  const handleCreateBusiness = () => {
    router.push('/business/create');
  };

  const handleViewAllBusinesses = () => {
    router.push('/(tabs)/businesses');
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
    recentSection: {
      marginTop: theme.spacing.xl,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    sectionHeaderText: {
      fontSize: theme.typography.fontSize.xl,
      fontFamily: theme.typography.fontFamily.semiBold,
      color: theme.colors.text.primary,
    },
    viewAllButton: {
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
    },
    viewAllText: {
      fontSize: theme.typography.fontSize.sm,
      fontFamily: theme.typography.fontFamily.medium,
      color: theme.colors.primary,
    },
    recentBusinessCard: {
      marginBottom: theme.spacing.sm,
    },
    emptyRecentState: {
      alignItems: 'center',
      padding: theme.spacing.lg,
    },
    emptyRecentText: {
      fontSize: theme.typography.fontSize.base,
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.text.secondary,
      textAlign: 'center',
      marginBottom: theme.spacing.md,
    },
    connectionStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      marginBottom: theme.spacing.sm,
    },
    connectionDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: theme.spacing.xs,
    },
    connectionText: {
      fontSize: theme.typography.fontSize.xs,
      fontFamily: theme.typography.fontFamily.medium,
      color: theme.colors.text.secondary,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Connection Status */}
          <View style={styles.connectionStatus}>
            <View 
              style={[
                styles.connectionDot, 
                { backgroundColor: isConnected ? theme.colors.success : theme.colors.error }
              ]} 
            />
            <Text style={styles.connectionText}>
              {isConnected ? 'Connected' : 'Offline Mode'}
            </Text>
          </View>

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
              {isLoading ? (
                <>
                  <DashboardStatSkeleton />
                  <DashboardStatSkeleton />
                </>
              ) : (
                <>
                  <Card style={{ flex: 1 }}>
                    <View style={styles.statsCard}>
                      <Text style={styles.statValue}>{activeBusinesses.length}</Text>
                      <Text style={styles.statLabel}>Active Businesses</Text>
                    </View>
                  </Card>
                  
                  <Card style={{ flex: 1 }}>
                    <View style={styles.statsCard}>
                      <Text style={styles.statValue}>
                        ${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </Text>
                      <Text style={styles.statLabel}>Monthly Revenue</Text>
                    </View>
                  </Card>
                </>
              )}
            </View>
          </View>

          {/* Recent Businesses */}
          {!isLoading && businesses.length > 0 && (
            <View style={styles.recentSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionHeaderText}>Recent Businesses</Text>
                {businesses.length > 3 && (
                  <TouchableOpacity onPress={handleViewAllBusinesses} style={styles.viewAllButton}>
                    <Text style={styles.viewAllText}>View All</Text>
                  </TouchableOpacity>
                )}
              </View>
              
              {recentBusinesses.length > 0 ? (
                <View>
                  {recentBusinesses.map((business) => (
                    <View key={business.id} style={styles.recentBusinessCard}>
                      <BusinessCard
                        business={business}
                        metrics={metrics[business.id]}
                      />
                    </View>
                  ))}
                </View>
              ) : (
                <Card>
                  <View style={styles.emptyRecentState}>
                    <Text style={styles.emptyRecentText}>
                      No recent businesses to show
                    </Text>
                    <Button
                      title="Create First Business"
                      onPress={handleCreateBusiness}
                      variant="secondary"
                      size="sm"
                    />
                  </View>
                </Card>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}