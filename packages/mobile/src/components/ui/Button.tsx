import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  View,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  textStyle,
}) => {
  const theme = useTheme();

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: theme.colors.primary,
          textColor: theme.colors.text.inverse,
        };
      case 'secondary':
        return {
          backgroundColor: theme.colors.surface,
          textColor: theme.colors.text.primary,
        };
      case 'success':
        return {
          backgroundColor: theme.colors.success,
          textColor: theme.colors.text.inverse,
        };
      case 'warning':
        return {
          backgroundColor: theme.colors.warning,
          textColor: theme.colors.text.primary,
        };
      case 'error':
        return {
          backgroundColor: theme.colors.error,
          textColor: theme.colors.text.inverse,
        };
      default:
        return {
          backgroundColor: theme.colors.primary,
          textColor: theme.colors.text.inverse,
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          height: 36,
          paddingHorizontal: theme.spacing.md,
          fontSize: theme.typography.fontSize.sm,
        };
      case 'md':
        return {
          height: theme.layout.button.height,
          paddingHorizontal: theme.layout.button.paddingHorizontal,
          fontSize: theme.typography.fontSize.base,
        };
      case 'lg':
        return {
          height: 56,
          paddingHorizontal: theme.spacing.xl,
          fontSize: theme.typography.fontSize.lg,
        };
      default:
        return {
          height: theme.layout.button.height,
          paddingHorizontal: theme.layout.button.paddingHorizontal,
          fontSize: theme.typography.fontSize.base,
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  const buttonStyles = StyleSheet.create({
    button: {
      backgroundColor: variantStyles.backgroundColor,
      borderRadius: theme.borderRadius.md,
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'row',
      height: sizeStyles.height,
      paddingHorizontal: sizeStyles.paddingHorizontal,
      width: fullWidth ? '100%' : undefined,
      opacity: disabled ? 0.6 : 1,
      // Neumorphic shadow effect
      ...theme.shadows.md,
      // Additional soft UI styling
      shadowColor: variant === 'secondary' ? theme.colors.shadow.dark : theme.colors.shadow.primary,
    } as ViewStyle,
    text: {
      color: variantStyles.textColor,
      fontSize: sizeStyles.fontSize,
      fontFamily: theme.typography.fontFamily.semiBold,
      textAlign: 'center',
      marginLeft: loading ? theme.spacing.sm : 0,
    } as TextStyle,
    loadingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    } as ViewStyle,
  });

  const handlePress = () => {
    if (!disabled && !loading) {
      onPress();
    }
  };

  return (
    <TouchableOpacity
      style={[buttonStyles.button, style]}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      <View style={buttonStyles.loadingContainer}>
        {loading && (
          <ActivityIndicator
            size="small"
            color={variantStyles.textColor}
          />
        )}
        <Text style={[buttonStyles.text, textStyle]}>
          {loading ? 'Loading...' : title}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default Button;