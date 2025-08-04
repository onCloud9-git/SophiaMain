import React from 'react';
import { render } from '@testing-library/react-native';
import { LoadingSkeleton, BusinessCardSkeleton, DashboardStatSkeleton } from '../LoadingSkeleton';

// Mock useTheme hook
jest.mock('../../../hooks/useTheme', () => ({
  useTheme: () => ({
    colors: {
      surface: '#FFFFFF',
      surfaceSecondary: '#F1F3F6',
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
    shadows: {
      md: {
        shadowColor: '#174c6b',
        shadowOffset: { width: 8, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 6,
      },
    },
  }),
}));

// Mock Animated
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    Animated: {
      ...RN.Animated,
      Value: jest.fn(() => ({
        interpolate: jest.fn(() => '#F1F3F6'),
      })),
      loop: jest.fn(() => ({
        start: jest.fn(),
        stop: jest.fn(),
      })),
      sequence: jest.fn(),
      timing: jest.fn(),
    },
  };
});

describe('LoadingSkeleton', () => {
  it('renders with default props', () => {
    const { toJSON } = render(<LoadingSkeleton />);
    expect(toJSON()).toBeTruthy();
  });

  it('renders with custom width and height', () => {
    const { toJSON } = render(
      <LoadingSkeleton width={200} height={40} />
    );
    expect(toJSON()).toBeTruthy();
  });

  it('renders with custom border radius', () => {
    const { toJSON } = render(
      <LoadingSkeleton borderRadius={20} />
    );
    expect(toJSON()).toBeTruthy();
  });

  it('renders children when provided', () => {
    const { getByText } = render(
      <LoadingSkeleton>
        <text>Test Child</text>
      </LoadingSkeleton>
    );
    expect(getByText('Test Child')).toBeTruthy();
  });

  it('applies custom style', () => {
    const customStyle = { marginTop: 10 };
    const { toJSON } = render(
      <LoadingSkeleton style={customStyle} />
    );
    expect(toJSON()).toBeTruthy();
  });
});

describe('BusinessCardSkeleton', () => {
  it('renders business card skeleton structure', () => {
    const { toJSON } = render(<BusinessCardSkeleton />);
    expect(toJSON()).toBeTruthy();
  });

  it('has proper styling for business card layout', () => {
    const component = render(<BusinessCardSkeleton />);
    expect(component.toJSON()).toMatchSnapshot();
  });
});

describe('DashboardStatSkeleton', () => {
  it('renders dashboard stat skeleton structure', () => {
    const { toJSON } = render(<DashboardStatSkeleton />);
    expect(toJSON()).toBeTruthy();
  });

  it('has proper styling for dashboard stat layout', () => {
    const component = render(<DashboardStatSkeleton />);
    expect(component.toJSON()).toMatchSnapshot();
  });
});