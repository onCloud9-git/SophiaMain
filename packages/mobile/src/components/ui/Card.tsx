import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';

export interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  margin?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'sm' | 'md' | 'lg';
  onPress?: () => void;
  disabled?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  padding = 'md',
  margin = 'md',
  shadow = 'md',
  onPress,
  disabled = false,
}) => {
  const theme = useTheme();

  const getPaddingValue = () => {
    switch (padding) {
      case 'none':
        return 0;
      case 'sm':
        return theme.spacing.sm;
      case 'md':
        return theme.spacing.md;
      case 'lg':
        return theme.spacing.lg;
      default:
        return theme.spacing.md;
    }
  };

  const getMarginValue = () => {
    switch (margin) {
      case 'none':
        return 0;
      case 'sm':
        return theme.spacing.sm;
      case 'md':
        return theme.spacing.md;
      case 'lg':
        return theme.spacing.lg;
      default:
        return theme.spacing.md;
    }
  };

  const getShadowStyle = () => {
    switch (shadow) {
      case 'sm':
        return theme.shadows.sm;
      case 'md':
        return theme.shadows.md;
      case 'lg':
        return theme.shadows.lg;
      default:
        return theme.shadows.md;
    }
  };

  const cardStyles = StyleSheet.create({
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      padding: getPaddingValue(),
      margin: getMarginValue(),
      opacity: disabled ? 0.6 : 1,
      // Neumorphic shadow effect
      ...getShadowStyle(),
      // Subtle border for enhanced soft UI effect
      borderWidth: 1,
      borderColor: theme.colors.border.default,
    } as ViewStyle,
    touchable: {
      borderRadius: theme.borderRadius.lg,
    } as ViewStyle,
  });

  if (onPress) {
    return (
      <TouchableOpacity
        style={cardStyles.touchable}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.95}
      >
        <View style={[cardStyles.card, style]}>
          {children}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[cardStyles.card, style]}>
      {children}
    </View>
  );
};

export default Card;