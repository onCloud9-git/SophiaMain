import React, { useState } from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';

export interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  disabled?: boolean;
  secureTextEntry?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
}

export const Input: React.FC<InputProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  disabled = false,
  secureTextEntry = false,
  multiline = false,
  numberOfLines = 1,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  autoCorrect = true,
  style,
  inputStyle,
  icon,
  rightIcon,
  onRightIconPress,
}) => {
  const theme = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const inputStyles = StyleSheet.create({
    container: {
      marginBottom: theme.spacing.md,
    } as ViewStyle,
    label: {
      fontSize: theme.typography.fontSize.sm,
      fontFamily: theme.typography.fontFamily.medium,
      color: theme.colors.text.secondary,
      marginBottom: theme.spacing.xs,
    } as TextStyle,
    inputContainer: {
      flexDirection: 'row',
      alignItems: multiline ? 'flex-start' : 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      borderWidth: 2,
      borderColor: error
        ? theme.colors.error
        : isFocused
        ? theme.colors.border.focused
        : theme.colors.border.default,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: multiline ? theme.spacing.md : 0,
      minHeight: multiline ? undefined : theme.layout.input.height,
      // Soft UI inset shadow effect when focused
      ...(isFocused ? theme.shadows.inset : theme.shadows.sm),
      shadowColor: isFocused ? theme.colors.shadow.primary : theme.colors.shadow.dark,
      opacity: disabled ? 0.6 : 1,
    } as ViewStyle,
    input: {
      flex: 1,
      fontSize: theme.typography.fontSize.base,
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.text.primary,
      paddingVertical: multiline ? 0 : theme.spacing.sm,
      textAlignVertical: multiline ? 'top' : 'center',
      height: multiline ? numberOfLines * 20 : undefined,
    } as TextStyle,
    icon: {
      marginRight: theme.spacing.sm,
      opacity: 0.7,
    } as ViewStyle,
    rightIcon: {
      marginLeft: theme.spacing.sm,
      padding: theme.spacing.xs,
    } as ViewStyle,
    errorText: {
      fontSize: theme.typography.fontSize.xs,
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.error,
      marginTop: theme.spacing.xs,
    } as TextStyle,
  });

  return (
    <View style={[inputStyles.container, style]}>
      {label && (
        <Text style={inputStyles.label}>{label}</Text>
      )}
      
      <View style={inputStyles.inputContainer}>
        {icon && (
          <View style={inputStyles.icon}>
            {icon}
          </View>
        )}
        
        <TextInput
          style={[inputStyles.input, inputStyle]}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.text.disabled}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          editable={!disabled}
          secureTextEntry={secureTextEntry}
          multiline={multiline}
          numberOfLines={numberOfLines}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          selectionColor={theme.colors.primary}
        />
        
        {rightIcon && (
          <TouchableOpacity
            style={inputStyles.rightIcon}
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
          >
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>
      
      {error && (
        <Text style={inputStyles.errorText}>{error}</Text>
      )}
    </View>
  );
};

export default Input;