import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';

export interface LoadingSkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
  children?: React.ReactNode;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius,
  style,
  children,
}) => {
  const theme = useTheme();
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [animatedValue]);

  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.colors.surfaceSecondary, theme.colors.border.default],
  });

  const styles = StyleSheet.create({
    skeleton: {
      backgroundColor: theme.colors.surfaceSecondary,
      width,
      height,
      borderRadius: borderRadius ?? theme.borderRadius.sm,
    },
  });

  if (children) {
    return (
      <View style={style}>
        {children}
      </View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { backgroundColor },
        style,
      ]}
    />
  );
};

// Pre-built skeleton components for common use cases
export const BusinessCardSkeleton: React.FC = () => {
  const theme = useTheme();

  return (
    <View style={{
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.md,
      ...theme.shadows.md,
    }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: theme.spacing.md }}>
        <View style={{ flex: 1 }}>
          <LoadingSkeleton width="70%" height={20} style={{ marginBottom: theme.spacing.xs }} />
          <LoadingSkeleton width="40%" height={14} />
        </View>
        <LoadingSkeleton width={60} height={24} borderRadius={theme.borderRadius.md} />
      </View>
      
      <LoadingSkeleton width="100%" height={16} style={{ marginBottom: theme.spacing.xs }} />
      <LoadingSkeleton width="80%" height={16} style={{ marginBottom: theme.spacing.lg }} />
      
      <LoadingSkeleton width="30%" height={16} style={{ marginBottom: theme.spacing.md }} />
      
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: theme.spacing.md,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border.default,
      }}>
        <View style={{ alignItems: 'center' }}>
          <LoadingSkeleton width={40} height={18} style={{ marginBottom: theme.spacing.xs }} />
          <LoadingSkeleton width={50} height={12} />
        </View>
        <View style={{ alignItems: 'center' }}>
          <LoadingSkeleton width={40} height={18} style={{ marginBottom: theme.spacing.xs }} />
          <LoadingSkeleton width={60} height={12} />
        </View>
        <View style={{ alignItems: 'center' }}>
          <LoadingSkeleton width={40} height={18} style={{ marginBottom: theme.spacing.xs }} />
          <LoadingSkeleton width={45} height={12} />
        </View>
      </View>
    </View>
  );
};

export const DashboardStatSkeleton: React.FC = () => {
  const theme = useTheme();

  return (
    <View style={{
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      alignItems: 'center',
      ...theme.shadows.md,
      flex: 1,
    }}>
      <LoadingSkeleton width={60} height={24} style={{ marginBottom: theme.spacing.xs }} />
      <LoadingSkeleton width={80} height={14} />
    </View>
  );
};

export default LoadingSkeleton;