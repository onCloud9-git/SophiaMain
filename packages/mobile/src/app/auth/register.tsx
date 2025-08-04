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
const registerSchema = z.object({
  name: z.string().min(2, 'Imię musi mieć minimum 2 znaki'),
  email: z.string().email('Nieprawidłowy adres email'),
  password: z.string().min(6, 'Hasło musi mieć minimum 6 znaków'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Hasła nie są identyczne',
  path: ['confirmPassword'],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { login, setLoading } = useAuthStore();
  
  const [formData, setFormData] = useState<RegisterForm>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Partial<RegisterForm>>({});

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: API.auth.register,
    onMutate: () => {
      setLoading(true);
    },
    onSuccess: (response) => {
      login(response.user, response.token);
      router.replace('/auth/onboarding');
    },
    onError: (error: APIError) => {
      Alert.alert(
        'Błąd rejestracji',
        error.message || 'Wystąpił błąd podczas rejestracji'
      );
    },
    onSettled: () => {
      setLoading(false);
    },
  });

  const validateForm = (): boolean => {
    try {
      registerSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Partial<RegisterForm> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as keyof RegisterForm] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleRegister = () => {
    if (validateForm()) {
      const { confirmPassword, ...registerData } = formData;
      registerMutation.mutate(registerData);
    }
  };

  const navigateToLogin = () => {
    router.back();
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
            Stwórz konto
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
            Rozpocznij swoją przygodę z Sophia AI
          </Text>
        </View>

        <Card style={styles.formCard}>
          <View style={styles.form}>
            <Input
              label="Imię"
              value={formData.name}
              onChangeText={(name) => setFormData({ ...formData, name })}
              placeholder="Wprowadź swoje imię"
              autoCapitalize="words"
              autoComplete="name"
              error={errors.name}
            />

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
              placeholder="Wprowadź hasło"
              secureTextEntry
              autoComplete="new-password"
              error={errors.password}
            />

            <Input
              label="Potwierdź hasło"
              value={formData.confirmPassword}
              onChangeText={(confirmPassword) => setFormData({ ...formData, confirmPassword })}
              placeholder="Potwierdź hasło"
              secureTextEntry
              autoComplete="new-password"
              error={errors.confirmPassword}
            />

            <Button
              title="Stwórz konto"
              onPress={handleRegister}
              loading={registerMutation.isPending}
              style={styles.registerButton}
            />

            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: theme.colors.border.default }]} />
              <Text style={[styles.dividerText, { color: theme.colors.text.secondary }]}>
                lub
              </Text>
              <View style={[styles.dividerLine, { backgroundColor: theme.colors.border.default }]} />
            </View>

            <Button
              title="Mam już konto"
              variant="outline"
              onPress={navigateToLogin}
              style={styles.loginButton}
            />
          </View>
        </Card>

        <Text style={[styles.footer, { color: theme.colors.text.secondary }]}>
          Tworząc konto akceptujesz nasze Warunki Użytkowania i Politykę Prywatności
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
  registerButton: {
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
  loginButton: {
    marginTop: 8,
  },
  footer: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});