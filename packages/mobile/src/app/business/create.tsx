import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { Button, Card, Input } from '../../components/ui';
import { BusinessCreationWizard } from '../../components/business/BusinessCreationWizard';
import { useBusinessStore } from '../../stores/businessStore';
import { API } from '../../services/api';

export default function CreateBusiness() {
  const theme = useTheme();
  const { addBusiness } = useBusinessStore();
  const [isLoading, setIsLoading] = useState(false);

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
      alignItems: 'center',
      marginBottom: theme.spacing.xl,
    },
    title: {
      fontSize: theme.typography.fontSize['2xl'],
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.sm,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: theme.typography.fontSize.base,
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.text.secondary,
      textAlign: 'center',
      lineHeight: theme.typography.lineHeight.relaxed * theme.typography.fontSize.base,
    },
  });

  const handleBusinessCreation = async (businessData: any) => {
    setIsLoading(true);
    try {
      const newBusiness = await API.businesses.create(businessData);
      addBusiness(newBusiness);
      
      Alert.alert(
        'Business Created!',
        'Your business is being set up. You can track the progress in your dashboard.',
        [
          {
            text: 'View Business',
            onPress: () => router.push(`/business/${newBusiness.id}`),
          },
          {
            text: 'Go to Dashboard',
            onPress: () => router.push('/(tabs)/'),
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        'Creation Failed',
        'Unable to create your business. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Create New Business</Text>
          <Text style={styles.subtitle}>
            Let Sophia AI help you build and manage your subscription business automatically
          </Text>
        </View>

        {/* Business Creation Wizard */}
        <BusinessCreationWizard
          onSubmit={handleBusinessCreation}
          isLoading={isLoading}
        />
      </ScrollView>
    </SafeAreaView>
  );
}