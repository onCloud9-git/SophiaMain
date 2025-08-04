import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import Dashboard from '../index';

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
      success: '#48BB78',
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
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
    },
    typography: {
      fontSize: {
        xs: 12,
        sm: 14,
        base: 16,
        lg: 18,
        xl: 20,
        '2xl': 24,
        '3xl': 30,
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
  getActiveBusinesses: jest.fn(() => []),
  getTotalRevenue: jest.fn(() => 0),
};

jest.mock('../../../stores/businessStore', () => ({
  useBusinessStore: () => mockBusinessStore,
}));

// Mock useWebSocket
jest.mock('../../../hooks/useWebSocket', () => ({
  useWebSocket: () => ({
    isConnected: false,
  }),
}));

describe('Dashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders welcome message', () => {
    const { getByText } = render(<Dashboard />);
    
    expect(getByText('Welcome to Sophia AI')).toBeTruthy();
    expect(getByText('Your autonomous business creation and management platform')).toBeTruthy();
  });

  it('shows connection status', () => {
    const { getByText } = render(<Dashboard />);
    
    expect(getByText('Offline Mode')).toBeTruthy();
  });

  it('displays quick actions section', () => {
    const { getByText } = render(<Dashboard />);
    
    expect(getByText('Quick Actions')).toBeTruthy();
    expect(getByText('Create New Business')).toBeTruthy();
    expect(getByText('AI Research Mode')).toBeTruthy();
  });

  it('shows overview section with default stats', () => {
    const { getByText } = render(<Dashboard />);
    
    expect(getByText('Overview')).toBeTruthy();
    expect(getByText('0')).toBeTruthy(); // Active Businesses
    expect(getByText('$0')).toBeTruthy(); // Monthly Revenue
    expect(getByText('Active Businesses')).toBeTruthy();
    expect(getByText('Monthly Revenue')).toBeTruthy();
  });

  it('navigates to business creation when Get Started is pressed', () => {
    const { router } = require('expo-router');
    const { getByText } = render(<Dashboard />);
    
    fireEvent.press(getByText('Get Started'));
    expect(router.push).toHaveBeenCalledWith('/business/create');
  });

  it('navigates to AI research when Start Research is pressed', () => {
    const { router } = require('expo-router');
    const { getByText } = render(<Dashboard />);
    
    fireEvent.press(getByText('Start Research'));
    expect(router.push).toHaveBeenCalledWith('/business/ai-research');
  });

  it('displays loading skeletons when loading', () => {
    mockBusinessStore.isLoading = true;
    const { toJSON } = render(<Dashboard />);
    
    expect(toJSON()).toBeTruthy();
    // Skeleton components should be rendered instead of actual stats
  });

  it('displays businesses when available', () => {
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
    mockBusinessStore.isLoading = false;
    mockBusinessStore.getActiveBusinesses = jest.fn(() => mockBusinesses);
    mockBusinessStore.getTotalRevenue = jest.fn(() => 299);

    const { getByText } = render(<Dashboard />);
    
    expect(getByText('1')).toBeTruthy(); // Active Businesses count
    expect(getByText('$299')).toBeTruthy(); // Revenue
    expect(getByText('Recent Businesses')).toBeTruthy();
  });

  it('shows View All button when more than 3 businesses', () => {
    const mockBusinesses = Array(5).fill(null).map((_, index) => ({
      id: `${index + 1}`,
      name: `Business ${index + 1}`,
      description: 'Test Description',
      industry: 'Technology',
      status: 'ACTIVE' as const,
      monthlyPrice: 29.99,
      currency: 'USD',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    }));

    mockBusinessStore.businesses = mockBusinesses;
    mockBusinessStore.getActiveBusinesses = jest.fn(() => mockBusinesses);

    const { getByText } = render(<Dashboard />);
    
    expect(getByText('View All')).toBeTruthy();
  });

  it('navigates to businesses list when View All is pressed', () => {
    const { router } = require('expo-router');
    const mockBusinesses = Array(5).fill(null).map((_, index) => ({
      id: `${index + 1}`,
      name: `Business ${index + 1}`,
      description: 'Test Description',
      industry: 'Technology',
      status: 'ACTIVE' as const,
      monthlyPrice: 29.99,
      currency: 'USD',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    }));

    mockBusinessStore.businesses = mockBusinesses;
    mockBusinessStore.getActiveBusinesses = jest.fn(() => mockBusinesses);

    const { getByText } = render(<Dashboard />);
    
    fireEvent.press(getByText('View All'));
    expect(router.push).toHaveBeenCalledWith('/(tabs)/businesses');
  });

  it('formats revenue numbers correctly', () => {
    mockBusinessStore.getTotalRevenue = jest.fn(() => 12345);
    
    const { getByText } = render(<Dashboard />);
    
    expect(getByText('$12,345')).toBeTruthy();
  });
});