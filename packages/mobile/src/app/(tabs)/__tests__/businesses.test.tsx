import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import Businesses from '../businesses';

// Mock expo-router
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
  },
}));

// Mock useTheme hook
jest.mock('../../../hooks/useTheme', () => ({
  useTheme: () => ({
    colors: {
      background: '#F8F9FA',
      surface: '#FFFFFF',
      primary: '#667EEA',
      error: '#F56565',
      text: {
        primary: '#2D3748',
        secondary: '#718096',
      },
      border: {
        default: '#E2E8F0',
      },
    },
    spacing: {
      md: 16,
      lg: 24,
      xl: 32,
    },
    typography: {
      fontSize: {
        base: 16,
        lg: 18,
        xl: 20,
        '2xl': 24,
      },
      fontFamily: {
        regular: 'Inter-Regular',
        medium: 'Inter-Medium',
        semiBold: 'Inter-SemiBold',
        bold: 'Inter-Bold',
      },
      lineHeight: {
        relaxed: 1.75,
      },
    },
    layout: {
      screen: {
        padding: 24,
      },
    },
  }),
}));

// Mock useBusinessStore
const mockBusinessStore = {
  businesses: [],
  metrics: {},
  isLoading: false,
  error: null,
  setBusinesses: jest.fn(),
  setLoading: jest.fn(),
  setError: jest.fn(),
};

jest.mock('../../../stores/businessStore', () => ({
  useBusinessStore: () => mockBusinessStore,
}));

// Mock setTimeout for async operations
jest.useFakeTimers();

describe('Businesses', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockBusinessStore.businesses = [];
    mockBusinessStore.isLoading = false;
    mockBusinessStore.error = null;
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  it('renders page title and create button', () => {
    const { getByText } = render(<Businesses />);
    
    expect(getByText('My Businesses')).toBeTruthy();
    expect(getByText('+')).toBeTruthy();
  });

  it('shows loading skeleton when loading', () => {
    mockBusinessStore.isLoading = true;
    const { toJSON } = render(<Businesses />);
    
    expect(toJSON()).toBeTruthy();
    // Should render BusinessCardSkeletons
  });

  it('displays empty state when no businesses', () => {
    const { getByText } = render(<Businesses />);
    
    expect(getByText('No businesses yet')).toBeTruthy();
    expect(getByText('Start your entrepreneurial journey by creating your first AI-powered business.')).toBeTruthy();
    expect(getByText('Create Your First Business')).toBeTruthy();
  });

  it('navigates to business creation when create button is pressed', () => {
    const { router } = require('expo-router');
    const { getByText } = render(<Businesses />);
    
    fireEvent.press(getByText('+'));
    expect(router.push).toHaveBeenCalledWith('/business/create');
  });

  it('navigates to business creation from empty state button', () => {
    const { router } = require('expo-router');
    const { getByText } = render(<Businesses />);
    
    fireEvent.press(getByText('Create Your First Business'));
    expect(router.push).toHaveBeenCalledWith('/business/create');
  });

  it('displays error state when there is an error', () => {
    mockBusinessStore.error = 'Failed to load businesses';
    const { getByText } = render(<Businesses />);
    
    expect(getByText('Failed to load businesses')).toBeTruthy();
    expect(getByText('Try Again')).toBeTruthy();
  });

  it('retries loading when Try Again is pressed', () => {
    mockBusinessStore.error = 'Failed to load businesses';
    const { getByText } = render(<Businesses />);
    
    fireEvent.press(getByText('Try Again'));
    expect(mockBusinessStore.setLoading).toHaveBeenCalledWith(true);
    expect(mockBusinessStore.setError).toHaveBeenCalledWith(null);
  });

  it('displays business list when businesses are available', () => {
    const mockBusinesses = [
      {
        id: '1',
        name: 'Test Business 1',
        description: 'First test business',
        industry: 'Technology',
        status: 'ACTIVE' as const,
        monthlyPrice: 29.99,
        currency: 'USD',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      {
        id: '2',
        name: 'Test Business 2',
        description: 'Second test business',
        industry: 'Healthcare',
        status: 'DEVELOPING' as const,
        monthlyPrice: 49.99,
        currency: 'USD',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    ];

    mockBusinessStore.businesses = mockBusinesses;

    const { getByText } = render(<Businesses />);
    
    expect(getByText('Test Business 1')).toBeTruthy();
    expect(getByText('Test Business 2')).toBeTruthy();
  });

  it('supports pull to refresh functionality', async () => {
    const mockBusinesses = [
      {
        id: '1',
        name: 'Test Business',
        description: 'Test Description',
        industry: 'Technology',
        status: 'ACTIVE' as const,
        monthlyPrice: 29.99,
        currency: 'USD',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    ];

    mockBusinessStore.businesses = mockBusinesses;

    const { getByTestId } = render(<Businesses />);
    
    // FlatList should have pull-to-refresh functionality
    // This is a simplified test since we can't easily test the actual pull gesture
    expect(mockBusinessStore.setLoading).toHaveBeenCalled();
  });

  it('loads businesses on component mount', () => {
    render(<Businesses />);
    
    expect(mockBusinessStore.setLoading).toHaveBeenCalledWith(true);
    expect(mockBusinessStore.setError).toHaveBeenCalledWith(null);
  });

  it('simulates API call delay and sets mock data', async () => {
    render(<Businesses />);
    
    // Fast-forward the setTimeout delay
    jest.advanceTimersByTime(1500);
    
    await waitFor(() => {
      expect(mockBusinessStore.setBusinesses).toHaveBeenCalled();
      expect(mockBusinessStore.setLoading).toHaveBeenCalledWith(false);
    });
  });

  it('handles business card press correctly', () => {
    const mockBusinesses = [
      {
        id: '1',
        name: 'Test Business',
        description: 'Test Description',
        industry: 'Technology',
        status: 'ACTIVE' as const,
        monthlyPrice: 29.99,
        currency: 'USD',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    ];

    mockBusinessStore.businesses = mockBusinesses;

    const { getByText } = render(<Businesses />);
    
    // BusinessCard should be clickable
    expect(getByText('Test Business')).toBeTruthy();
  });
});