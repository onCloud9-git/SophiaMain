import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import LoginScreen from '../../../app/auth/login';
import { useAuthStore } from '../../../stores/authStore';
import { API } from '../../../services/api';

// Mock dependencies
jest.mock('expo-router');
jest.mock('../../../stores/authStore');
jest.mock('../../../services/api');

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;
const mockAPI = API as jest.Mocked<typeof API>;

describe('LoginScreen', () => {
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

  it('should render login form correctly', () => {
    const { getByText, getByPlaceholderText } = renderWithProviders(<LoginScreen />);
    
    expect(getByText('Witaj ponownie')).toBeTruthy();
    expect(getByText('Zaloguj się do swojego konta Sophia AI')).toBeTruthy();
    expect(getByPlaceholderText('Wprowadź swój email')).toBeTruthy();
    expect(getByPlaceholderText('Wprowadź swoje hasło')).toBeTruthy();
    expect(getByText('Zaloguj się')).toBeTruthy();
  });

  it('should show validation errors for invalid input', async () => {
    const { getByText, getByPlaceholderText } = renderWithProviders(<LoginScreen />);
    
    const loginButton = getByText('Zaloguj się');
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(getByText('Nieprawidłowy adres email')).toBeTruthy();
      expect(getByText('Hasło musi mieć minimum 6 znaków')).toBeTruthy();
    });
  });

  it('should handle valid form submission', async () => {
    const mockResponse = {
      user: { id: '1', email: 'test@example.com', name: 'Test User', createdAt: '2023-01-01' },
      token: 'test-token',
    };
    
    mockAPI.auth.login.mockResolvedValue(mockResponse);
    
    const { getByText, getByPlaceholderText } = renderWithProviders(<LoginScreen />);
    
    const emailInput = getByPlaceholderText('Wprowadź swój email');
    const passwordInput = getByPlaceholderText('Wprowadź swoje hasło');
    const loginButton = getByText('Zaloguj się');
    
    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(mockAPI.auth.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(mockAuthStore.login).toHaveBeenCalledWith(mockResponse.user, mockResponse.token);
      expect(mockRouter.replace).toHaveBeenCalledWith('/(tabs)');
    });
  });

  it('should navigate to register screen', () => {
    const { getByText } = renderWithProviders(<LoginScreen />);
    
    const registerButton = getByText('Stwórz nowe konto');
    fireEvent.press(registerButton);
    
    expect(mockRouter.push).toHaveBeenCalledWith('/auth/register');
  });
});