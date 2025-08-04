import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { Card } from '../ui';
import { Business, BusinessMetrics } from '../../stores/businessStore';

export interface BusinessCardProps {
  business: Business;
  metrics?: BusinessMetrics;
  onPress?: () => void;
}

export const BusinessCard: React.FC<BusinessCardProps> = ({
  business,
  metrics,
  onPress,
}) => {
  const theme = useTheme();

  const getStatusColor = (status: Business['status']) => {
    switch (status) {
      case 'ACTIVE':
        return theme.colors.success;
      case 'DEVELOPING':
        return theme.colors.warning;
      case 'DEPLOYING':
        return theme.colors.primary;
      case 'PAUSED':
        return theme.colors.text.secondary;
      case 'CLOSED':
        return theme.colors.error;
      default:
        return theme.colors.text.secondary;
    }
  };

  const getStatusLabel = (status: Business['status']) => {
    switch (status) {
      case 'PLANNING':
        return 'Planning';
      case 'DEVELOPING':
        return 'Developing';
      case 'DEPLOYING':
        return 'Deploying';
      case 'ACTIVE':
        return 'Active';
      case 'PAUSED':
        return 'Paused';
      case 'CLOSED':
        return 'Closed';
      default:
        return status;
    }
  };

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/business/${business.id}`);
    }
  };

  const styles = StyleSheet.create({
    container: {
      marginBottom: theme.spacing.md,
    },
    content: {
      paddingVertical: theme.spacing.lg,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: theme.spacing.md,
    },
    titleSection: {
      flex: 1,
      marginRight: theme.spacing.md,
    },
    title: {
      fontSize: theme.typography.fontSize.lg,
      fontFamily: theme.typography.fontFamily.semiBold,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.xs,
    },
    industry: {
      fontSize: theme.typography.fontSize.sm,
      fontFamily: theme.typography.fontFamily.medium,
      color: theme.colors.text.secondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    statusBadge: {
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.borderRadius.md,
      backgroundColor: theme.colors.surfaceSecondary,
    },
    statusText: {
      fontSize: theme.typography.fontSize.xs,
      fontFamily: theme.typography.fontFamily.medium,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    description: {
      fontSize: theme.typography.fontSize.base,
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.text.secondary,
      lineHeight: theme.typography.lineHeight.relaxed * theme.typography.fontSize.base,
      marginBottom: theme.spacing.lg,
    },
    metricsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingTop: theme.spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border.default,
    },
    metric: {
      alignItems: 'center',
    },
    metricValue: {
      fontSize: theme.typography.fontSize.lg,
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.xs,
    },
    metricLabel: {
      fontSize: theme.typography.fontSize.xs,
      fontFamily: theme.typography.fontFamily.medium,
      color: theme.colors.text.secondary,
      textAlign: 'center',
    },
    price: {
      fontSize: theme.typography.fontSize.base,
      fontFamily: theme.typography.fontFamily.semiBold,
      color: theme.colors.primary,
    },
  });

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.95} style={styles.container}>
      <Card padding="none" margin="none">
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleSection}>
              <Text style={styles.title}>{business.name}</Text>
              <Text style={styles.industry}>{business.industry}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(business.status) + '20' }]}>
              <Text style={[styles.statusText, { color: getStatusColor(business.status) }]}>
                {getStatusLabel(business.status)}
              </Text>
            </View>
          </View>

          {/* Description */}
          <Text style={styles.description} numberOfLines={2}>
            {business.description}
          </Text>

          {/* Price */}
          <Text style={styles.price}>
            {formatCurrency(business.monthlyPrice, business.currency)}/month
          </Text>

          {/* Metrics */}
          {metrics && (
            <View style={styles.metricsRow}>
              <View style={styles.metric}>
                <Text style={styles.metricValue}>{formatNumber(metrics.visitors)}</Text>
                <Text style={styles.metricLabel}>Visitors</Text>
              </View>
              <View style={styles.metric}>
                <Text style={styles.metricValue}>{formatNumber(metrics.conversions)}</Text>
                <Text style={styles.metricLabel}>Conversions</Text>
              </View>
              <View style={styles.metric}>
                <Text style={styles.metricValue}>
                  {formatCurrency(metrics.revenue, business.currency)}
                </Text>
                <Text style={styles.metricLabel}>Revenue</Text>
              </View>
            </View>
          )}
        </View>
      </Card>
    </TouchableOpacity>
  );
};

export default BusinessCard;