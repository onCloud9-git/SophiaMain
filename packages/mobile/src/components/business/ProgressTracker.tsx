import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Card } from '../ui';

interface Business {
  id: string;
  name: string;
  status: 'PLANNING' | 'DEVELOPING' | 'DEPLOYING' | 'ACTIVE' | 'PAUSED' | 'CLOSED';
  createdAt: string;
}

interface ProgressTrackerProps {
  business: Business;
}

interface ProgressStep {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'in-progress' | 'pending';
  estimatedTime?: string;
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({ business }) => {
  const theme = useTheme();

  const styles = StyleSheet.create({
    container: {
      marginBottom: theme.spacing.lg,
    },
    header: {
      marginBottom: theme.spacing.lg,
    },
    title: {
      fontSize: theme.typography.fontSize.lg,
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.sm,
    },
    statusBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.borderRadius.lg,
      marginBottom: theme.spacing.sm,
    },
    statusText: {
      fontSize: theme.typography.fontSize.sm,
      fontFamily: theme.typography.fontFamily.medium,
      color: theme.colors.white,
    },
    progressOverview: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.lg,
    },
    progressBar: {
      flex: 1,
      height: 8,
      backgroundColor: theme.colors.surface,
      borderRadius: 4,
      marginRight: theme.spacing.md,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 4,
    },
    progressText: {
      fontSize: theme.typography.fontSize.sm,
      fontFamily: theme.typography.fontFamily.medium,
      color: theme.colors.text.secondary,
    },
    stepsList: {
      marginTop: theme.spacing.md,
    },
    stepItem: {
      flexDirection: 'row',
      marginBottom: theme.spacing.lg,
    },
    stepIndicator: {
      width: 24,
      height: 24,
      borderRadius: 12,
      marginRight: theme.spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
    },
    stepIndicatorCompleted: {
      backgroundColor: theme.colors.success,
    },
    stepIndicatorInProgress: {
      backgroundColor: theme.colors.primary,
    },
    stepIndicatorPending: {
      backgroundColor: theme.colors.surface,
      borderWidth: 2,
      borderColor: theme.colors.border,
    },
    stepContent: {
      flex: 1,
    },
    stepTitle: {
      fontSize: theme.typography.fontSize.base,
      fontFamily: theme.typography.fontFamily.semiBold,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.xs,
    },
    stepDescription: {
      fontSize: theme.typography.fontSize.sm,
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.text.secondary,
      lineHeight: theme.typography.lineHeight.relaxed * theme.typography.fontSize.sm,
    },
    stepTime: {
      fontSize: theme.typography.fontSize.xs,
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.text.tertiary,
      marginTop: theme.spacing.xs,
    },
    stepIcon: {
      fontSize: 12,
      color: theme.colors.white,
      fontFamily: theme.typography.fontFamily.bold,
    },
  });

  const getStatusColor = (status: Business['status']) => {
    switch (status) {
      case 'PLANNING':
        return theme.colors.warning;
      case 'DEVELOPING':
        return theme.colors.primary;
      case 'DEPLOYING':
        return theme.colors.info;
      case 'ACTIVE':
        return theme.colors.success;
      case 'PAUSED':
        return theme.colors.warning;
      case 'CLOSED':
        return theme.colors.error;
      default:
        return theme.colors.text.secondary;
    }
  };

  const getStatusText = (status: Business['status']) => {
    switch (status) {
      case 'PLANNING':
        return 'Planning';
      case 'DEVELOPING':
        return 'In Development';
      case 'DEPLOYING':
        return 'Deploying';
      case 'ACTIVE':
        return 'Live & Active';
      case 'PAUSED':
        return 'Paused';
      case 'CLOSED':
        return 'Closed';
      default:
        return 'Unknown';
    }
  };

  const getProgressSteps = (status: Business['status']): ProgressStep[] => {
    const baseSteps: ProgressStep[] = [
      {
        id: 'planning',
        title: 'Business Planning',
        description: 'Sophia is analyzing your business requirements and creating a comprehensive plan.',
        status: 'completed',
        estimatedTime: '2-5 minutes',
      },
      {
        id: 'development',
        title: 'Application Development',
        description: 'Cursor AI is generating your application code and building the core functionality.',
        status: status === 'PLANNING' ? 'pending' : status === 'DEVELOPING' ? 'in-progress' : 'completed',
        estimatedTime: '15-30 minutes',
      },
      {
        id: 'deployment',
        title: 'Deployment & Setup',
        description: 'Setting up hosting, domain, analytics, and payment processing for your business.',
        status: status === 'DEPLOYING' ? 'in-progress' : ['ACTIVE', 'PAUSED', 'CLOSED'].includes(status) ? 'completed' : 'pending',
        estimatedTime: '5-10 minutes',
      },
      {
        id: 'marketing',
        title: 'Marketing Campaigns',
        description: 'Creating and launching automated marketing campaigns across multiple platforms.',
        status: ['ACTIVE', 'PAUSED', 'CLOSED'].includes(status) ? 'completed' : 'pending',
        estimatedTime: '10-15 minutes',
      },
      {
        id: 'monitoring',
        title: 'Active Monitoring',
        description: 'Sophia is continuously monitoring performance and optimizing your business.',
        status: status === 'ACTIVE' ? 'completed' : 'pending',
      },
    ];

    return baseSteps;
  };

  const getOverallProgress = (steps: ProgressStep[]): number => {
    const completedSteps = steps.filter(step => step.status === 'completed').length;
    return (completedSteps / steps.length) * 100;
  };

  const steps = getProgressSteps(business.status);
  const overallProgress = getOverallProgress(steps);

  const renderStepIndicator = (step: ProgressStep) => {
    const indicatorStyle = [
      styles.stepIndicator,
      step.status === 'completed' 
        ? styles.stepIndicatorCompleted
        : step.status === 'in-progress'
        ? styles.stepIndicatorInProgress
        : styles.stepIndicatorPending,
    ];

    return (
      <View style={indicatorStyle}>
        {step.status === 'completed' && (
          <Text style={styles.stepIcon}>✓</Text>
        )}
        {step.status === 'in-progress' && (
          <View style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: theme.colors.white,
          }} />
        )}
      </View>
    );
  };

  return (
    <Card style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Creation Progress</Text>
        
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(business.status) }]}>
          <Text style={styles.statusText}>{getStatusText(business.status)}</Text>
        </View>

        <View style={styles.progressOverview}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${overallProgress}%`,
                  backgroundColor: getStatusColor(business.status),
                }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {Math.round(overallProgress)}% Complete
          </Text>
        </View>
      </View>

      <View style={styles.stepsList}>
        {steps.map((step, index) => (
          <View key={step.id} style={styles.stepItem}>
            {renderStepIndicator(step)}
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepDescription}>{step.description}</Text>
              {step.estimatedTime && step.status !== 'completed' && (
                <Text style={styles.stepTime}>
                  Estimated time: {step.estimatedTime}
                </Text>
              )}
            </View>
          </View>
        ))}
      </View>
    </Card>
  );
};