import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import RegisterScreen from '../../../app/auth/register';
import { useAuthStore } from '../../../stores/authStore';
import { API } from '../../../services/api';

// Mock dependencies
jest.mock('expo-router');
jest.mock('../../../stores/authStore');
jest.mock('../../../services/api');

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;
const mockAPI = API as jest.Mocked<typeof API>;

describe('RegisterScreen', () => {
  let queryClient: QueryClient;
  const mockRouter = {
    replace: jest.fn(),
    push: jest.fn(),
    back: jest.fn(),
  };
  const mockAuthStore = {
    login: jest.fn(),
    setLoading: jest.fn(),
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    
    mockUseRouter.mockReturnValue(mockRouter as any);
    mockUseAuthStore.mockReturnValue(mockAuthStore as any);
    
    jest.clearAllMocks();
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  it('should render register form correctly', () => {
    const { getByText, getByPlaceholderText } = renderWithProviders(<RegisterScreen />);
    
    expect(getByText('Stwórz konto')).toBeTruthy();
    expect(getByText('Rozpocznij swoją przygodę z Sophia AI')).toBeTruthy();
    expect(getByPlaceholderText('Wprowadź swoje imię')).toBeTruthy();
    expect(getByPlaceholderText('Wprowadź swój email')).toBeTruthy();
    expect(getByPlaceholderText('Wprowadź hasło')).toBeTruthy();
    expect(getByPlaceholderText('Potwierdź hasło')).toBeTruthy();
  });

  it('should show validation errors for invalid input', async () => {
    const { getByText } = renderWithProviders(<RegisterScreen />);
    
    const registerButton = getByText('Stwórz konto');
    fireEvent.press(registerButton);

    await waitFor(() => {
      expect(getByText('Imię musi mieć minimum 2 znaki')).toBeTruthy();
      expect(getByText('Nieprawidłowy adres email')).toBeTruthy();
      expect(getByText('Hasło musi mieć minimum 6 znaków')).toBeTruthy();
    });
  });

  it('should show password mismatch error', async () => {
    const { getByText, getByPlaceholderText } = renderWithProviders(<RegisterScreen />);
    
    const nameInput = getByPlaceholderText('Wprowadź swoje imię');
    const emailInput = getByPlaceholderText('Wprowadź swój email');
    const passwordInput = getByPlaceholderText('Wprowadź hasło');
    const confirmPasswordInput = getByPlaceholderText('Potwierdź hasło');
    const registerButton = getByText('Stwórz konto');
    
    fireEvent.changeText(nameInput, 'Test User');
    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.changeText(confirmPasswordInput, 'different123');
    fireEvent.press(registerButton);

    await waitFor(() => {
      expect(getByText('Hasła nie są identyczne')).toBeTruthy();
    });
  });

  it('should handle successful registration', async () => {
    const mockResponse = {
      user: { id: '1', email: 'test@example.com', name: 'Test User', createdAt: '2023-01-01' },
      token: 'test-token',
    };
    
    mockAPI.auth.register.mockResolvedValue(mockResponse);
    
    const { getByText, getByPlaceholderText } = renderWithProviders(<RegisterScreen />);
    
    const nameInput = getByPlaceholderText('Wprowadź swoje imię');
    const emailInput = getByPlaceholderText('Wprowadź swój email');
    const passwordInput = getByPlaceholderText('Wprowadź hasło');
    const confirmPasswordInput = getByPlaceholderText('Potwierdź hasło');
    const registerButton = getByText('Stwórz konto');
    
    fireEvent.changeText(nameInput, 'Test User');
    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.changeText(confirmPasswordInput, 'password123');
    fireEvent.press(registerButton);

    await waitFor(() => {
      expect(mockAPI.auth.register).toHaveBeenCalledWith({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });
      expect(mockAuthStore.login).toHaveBeenCalledWith(mockResponse.user, mockResponse.token);
      expect(mockRouter.replace).toHaveBeenCalledWith('/auth/onboarding');
    });
  });

  it('should navigate back to login', () => {
    const { getByText } = renderWithProviders(<RegisterScreen />);
    
    const loginButton = getByText('Mam już konto');
    fireEvent.press(loginButton);
    
    expect(mockRouter.back).toHaveBeenCalled();
  });
});