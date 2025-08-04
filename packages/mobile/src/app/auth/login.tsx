import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';

import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { useTheme } from '../../hooks/useTheme';
import { useAuthStore } from '../../stores/authStore';
import { API, APIError } from '../../services/api';

// Form validation schema
const loginSchema = z.object({
  email: z.string().email('Nieprawidłowy adres email'),
  password: z.string().min(6, 'Hasło musi mieć minimum 6 znaków'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { login, setLoading } = useAuthStore();
  
  const [formData, setFormData] = useState<LoginForm>({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Partial<LoginForm>>({});

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: API.auth.login,
    onMutate: () => {
      setLoading(true);
    },
    onSuccess: (response) => {
      login(response.user, response.token);
      router.replace('/(tabs)');
    },
    onError: (error: APIError) => {
      Alert.alert(
        'Błąd logowania',
        error.message || 'Wystąpił błąd podczas logowania'
      );
    },
    onSettled: () => {
      setLoading(false);
    },
  });

  const validateForm = (): boolean => {
    try {
      loginSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Partial<LoginForm> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as keyof LoginForm] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleLogin = () => {
    if (validateForm()) {
      loginMutation.mutate(formData);
    }
  };

  const navigateToRegister = () => {
    router.push('/auth/register');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text.primary }]}>
            Witaj ponownie
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
            Zaloguj się do swojego konta Sophia AI
          </Text>
        </View>

        <Card style={styles.formCard}>
          <View style={styles.form}>
            <Input
              label="Email"
              value={formData.email}
              onChangeText={(email) => setFormData({ ...formData, email })}
              placeholder="Wprowadź swój email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              error={errors.email}
            />

            <Input
              label="Hasło"
              value={formData.password}
              onChangeText={(password) => setFormData({ ...formData, password })}
              placeholder="Wprowadź swoje hasło"
              secureTextEntry
              autoComplete="password"
              error={errors.password}
              style={styles.passwordInput}
            />

            <Button
              title="Zaloguj się"
              onPress={handleLogin}
              loading={loginMutation.isPending}
              style={styles.loginButton}
            />

            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: theme.colors.border.default }]} />
              <Text style={[styles.dividerText, { color: theme.colors.text.secondary }]}>
                lub
              </Text>
              <View style={[styles.dividerLine, { backgroundColor: theme.colors.border.default }]} />
            </View>

            <Button
              title="Stwórz nowe konto"
              variant="outline"
              onPress={navigateToRegister}
              style={styles.registerButton}
            />
          </View>
        </Card>

        <Text style={[styles.footer, { color: theme.colors.text.secondary }]}>
          Logując się akceptujesz nasze Warunki Użytkowania i Politykę Prywatności
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  formCard: {
    marginBottom: 24,
  },
  form: {
    gap: 20,
  },
  passwordInput: {
    marginTop: 4,
  },
  loginButton: {
    marginTop: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
  },
  registerButton: {
    marginTop: 8,
  },
  footer: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});