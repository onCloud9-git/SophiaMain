import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { Button, Card } from '../../components/ui';
import { BusinessDetails } from '../../components/business/BusinessDetails';
import { ProgressTracker } from '../../components/business/ProgressTracker';
import { useBusinessStore } from '../../stores/businessStore';
import { useWebSocket } from '../../hooks/useWebSocket';
import { API } from '../../services/api';

export default function BusinessDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const { getBusiness, updateBusiness } = useBusinessStore();
  const [business, setBusiness] = useState(getBusiness(id!));
  const [isRefreshing, setIsRefreshing] = useState(false);

  // WebSocket connection for real-time updates
  const { data: realtimeData } = useWebSocket(`business:${id}`);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      flex: 1,
      padding: theme.layout.screen.padding,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.xl,
    },
    backButton: {
      alignSelf: 'flex-start',
    },
    title: {
      fontSize: theme.typography.fontSize.xl,
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.text.primary,
      flex: 1,
      textAlign: 'center',
      marginHorizontal: theme.spacing.md,
    },
    placeholder: {
      width: 80, // Same width as back button for balance
    },
  });

  useEffect(() => {
    if (realtimeData) {
      const updatedBusiness = { ...business, ...realtimeData };
      setBusiness(updatedBusiness);
      updateBusiness(id!, updatedBusiness);
    }
  }, [realtimeData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const updatedBusiness = await API.businesses.getById(id!);
      setBusiness(updatedBusiness);
      updateBusiness(id!, updatedBusiness);
    } catch (error) {
      console.error('Failed to refresh business:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!business) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text>Business not found</Text>
          <Button
            title="← Go Back"
            onPress={() => router.back()}
            variant="secondary"
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Button
            title="←"
            onPress={() => router.back()}
            variant="ghost"
            size="sm"
            style={styles.backButton}
          />
          <Text style={styles.title} numberOfLines={1}>
            {business.name}
          </Text>
          <View style={styles.placeholder} />
        </View>

        {/* Progress Tracker */}
        <ProgressTracker business={business} />

        {/* Business Details */}
        <BusinessDetails business={business} />
      </ScrollView>
    </SafeAreaView>
  );
}