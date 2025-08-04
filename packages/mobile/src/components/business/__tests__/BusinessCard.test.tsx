import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { BusinessCard } from '../BusinessCard';
import { Business, BusinessMetrics } from '../../../stores/businessStore';

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
      surfaceSecondary: '#F1F3F6',
      primary: '#667EEA',
      success: '#48BB78',
      warning: '#ECC94B',
      error: '#F56565',
      text: {
        primary: '#2D3748',
        secondary: '#718096',
        disabled: '#A0AEC0',
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
    borderRadius: {
      sm: 8,
      md: 16,
      lg: 24,
    },
    typography: {
      fontSize: {
        xs: 12,
        sm: 14,
        base: 16,
        lg: 18,
        xl: 20,
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
  }),
}));

const mockBusiness: Business = {
  id: '1',
  name: 'Test Business',
  description: 'A test business for unit testing',
  industry: 'Technology',
  status: 'ACTIVE',
  websiteUrl: 'https://test-business.com',
  monthlyPrice: 29.99,
  currency: 'USD',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockMetrics: BusinessMetrics = {
  visitors: 1000,
  conversions: 50,
  revenue: 1500,
  bounceRate: 0.3,
  sessionDuration: 180,
  pageViews: 2500,
};

describe('BusinessCard', () => {
  it('renders business information correctly', () => {
    const { getByText } = render(
      <BusinessCard business={mockBusiness} />
    );

    expect(getByText('Test Business')).toBeTruthy();
    expect(getByText('TECHNOLOGY')).toBeTruthy();
    expect(getByText('A test business for unit testing')).toBeTruthy();
    expect(getByText('$29.99/month')).toBeTruthy();
  });

  it('displays correct status badge', () => {
    const { getByText } = render(
      <BusinessCard business={mockBusiness} />
    );

    expect(getByText('Active')).toBeTruthy();
  });

  it('displays metrics when provided', () => {
    const { getByText } = render(
      <BusinessCard business={mockBusiness} metrics={mockMetrics} />
    );

    expect(getByText('1K')).toBeTruthy(); // Visitors
    expect(getByText('50')).toBeTruthy(); // Conversions
    expect(getByText('Visitors')).toBeTruthy();
    expect(getByText('Conversions')).toBeTruthy();
    expect(getByText('Revenue')).toBeTruthy();
  });

  it('handles different business statuses', () => {
    const developingBusiness = { ...mockBusiness, status: 'DEVELOPING' as const };
    const { getByText } = render(
      <BusinessCard business={developingBusiness} />
    );

    expect(getByText('Developing')).toBeTruthy();
  });

  it('calls onPress when card is tapped', () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(
      <BusinessCard business={mockBusiness} onPress={mockOnPress} />
    );

    fireEvent.press(getByText('Test Business'));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('navigates to business detail when no onPress provided', () => {
    const { router } = require('expo-router');
    const { getByText } = render(
      <BusinessCard business={mockBusiness} />
    );

    fireEvent.press(getByText('Test Business'));
    expect(router.push).toHaveBeenCalledWith('/business/1');
  });

  it('formats currency correctly', () => {
    const euroBusiness = { ...mockBusiness, currency: 'EUR', monthlyPrice: 25.50 };
    const { getByText } = render(
      <BusinessCard business={euroBusiness} />
    );

    expect(getByText('€25.50/month')).toBeTruthy();
  });

  it('formats large numbers correctly', () => {
    const largeMetrics: BusinessMetrics = {
      visitors: 1500000,
      conversions: 2500,
      revenue: 50000,
      pageViews: 0,
    };

    const { getByText } = render(
      <BusinessCard business={mockBusiness} metrics={largeMetrics} />
    );

    expect(getByText('1.5M')).toBeTruthy(); // Visitors
    expect(getByText('2.5K')).toBeTruthy(); // Conversions
  });

  it('truncates long descriptions', () => {
    const longDescriptionBusiness = {
      ...mockBusiness,
      description: 'This is a very long description that should be truncated when displayed in the business card component to maintain proper layout and readability',
    };

    const { getByText } = render(
      <BusinessCard business={longDescriptionBusiness} />
    );

    // The component should still render, but with numberOfLines={2}
    expect(getByText(longDescriptionBusiness.description)).toBeTruthy();
  });
});