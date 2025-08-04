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
import { AIResearchMode } from '../../components/business/AIResearchMode';
import { useBusinessStore } from '../../stores/businessStore';
import { API } from '../../services/api';

export default function AIResearch() {
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
    backButton: {
      alignSelf: 'flex-start',
      marginBottom: theme.spacing.lg,
    },
  });

  const handleAIResearchComplete = async (businessIdea: any) => {
    setIsLoading(true);
    try {
      const businessData = {
        ...businessIdea,
        enableAIResearch: true,
      };
      
      const newBusiness = await API.businesses.create(businessData);
      addBusiness(newBusiness);
      
      Alert.alert(
        'AI Research Complete!',
        'Sophia has analyzed the market and created a comprehensive business plan. Your business is now being built.',
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
        'Research Failed',
        'Unable to complete AI research. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Back Button */}
        <Button
          title="← Back to Manual Creation"
          onPress={() => router.back()}
          variant="ghost"
          size="sm"
          style={styles.backButton}
        />

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>AI Market Research</Text>
          <Text style={styles.subtitle}>
            Let Sophia analyze market opportunities and generate a data-driven business idea for you
          </Text>
        </View>

        {/* AI Research Component */}
        <AIResearchMode
          onComplete={handleAIResearchComplete}
          isLoading={isLoading}
        />
      </ScrollView>
    </SafeAreaView>
  );
}