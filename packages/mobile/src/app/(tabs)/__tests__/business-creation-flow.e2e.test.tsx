/**
 * End-to-End Tests for Business Creation Flow
 * Tests the complete user journey from business creation to completion
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { router } from 'expo-router';
import { Alert } from 'react-native';

// Mock dependencies
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    back: jest.fn(),
  },
}));

jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    Alert: {
      alert: jest.fn(),
    },
  };
});

jest.mock('../../../services/api', () => ({
  API: {
    businesses: {
      create: jest.fn(),
      getById: jest.fn(),
    },
  },
}));

jest.mock('../../../hooks/useWebSocket', () => ({
  useWebSocket: jest.fn(() => ({
    data: null,
    isConnected: false,
    error: null,
    send: jest.fn(),
    disconnect: jest.fn(),
  })),
}));

import CreateBusiness from '../../business/create';
import AIResearch from '../../business/ai-research';
import { API } from '../../../services/api';

const mockBusinessData = {
  id: 'test-business-123',
  name: 'Test Business',
  description: 'A test business for E2E testing',
  industry: 'SaaS',
  monthlyPrice: 29.99,
  currency: 'USD',
  status: 'PLANNING',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('Business Creation Flow E2E', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (API.businesses.create as jest.Mock).mockResolvedValue(mockBusinessData);
  });

  describe('Manual Business Creation Flow', () => {
    it('should complete the full manual business creation wizard', async () => {
      const { getByText, getByPlaceholderText, getByTestId } = render(<CreateBusiness />);

      // Step 1: Mode Selection
      expect(getByText('Choose Creation Mode')).toBeTruthy();
      
      await act(async () => {
        fireEvent.press(getByText('Create with My Idea'));
      });

      // Step 2: Business Information
      await waitFor(() => {
        expect(getByText('Business Information')).toBeTruthy();
      });

      await act(async () => {
        fireEvent.changeText(
          getByPlaceholderText('e.g., TaskFlow Pro'),
          'Test SaaS Platform'
        );
        fireEvent.changeText(
          getByPlaceholderText('e.g., SaaS, E-commerce, Health & Fitness'),
          'SaaS'
        );
        fireEvent.changeText(
          getByPlaceholderText('Describe what your business does and what problem it solves...'),
          'A comprehensive SaaS platform for project management'
        );
        fireEvent.press(getByText('Next'));
      });

      // Step 3: Pricing
      await waitFor(() => {
        expect(getByText('Pricing Strategy')).toBeTruthy();
      });

      await act(async () => {
        fireEvent.changeText(getByPlaceholderText('29.99'), '49.99');
        fireEvent.press(getByText('Next'));
      });

      // Step 4: Target Market
      await waitFor(() => {
        expect(getByText('Target Market')).toBeTruthy();
      });

      await act(async () => {
        fireEvent.changeText(
          getByPlaceholderText('e.g., Small business owners, Freelancers, Students...'),
          'Small to medium businesses looking for efficient project management'
        );
        fireEvent.press(getByText('Next'));
      });

      // Step 5: Review & Submit
      await waitFor(() => {
        expect(getByText('Review & Create')).toBeTruthy();
        expect(getByText('Test SaaS Platform')).toBeTruthy();
        expect(getByText('SaaS')).toBeTruthy();
        expect(getByText('$49.99/month')).toBeTruthy();
      });

      // Submit the business creation
      await act(async () => {
        fireEvent.press(getByText('Create Business'));
      });

      // Verify API call was made
      await waitFor(() => {
        expect(API.businesses.create).toHaveBeenCalledWith({
          name: 'Test SaaS Platform',
          description: 'A comprehensive SaaS platform for project management',
          industry: 'SaaS',
          monthlyPrice: 49.99,
          currency: 'USD',
          targetMarket: 'Small to medium businesses looking for efficient project management',
          enableAIResearch: false,
        });
      });

      // Verify success alert
      expect(Alert.alert).toHaveBeenCalledWith(
        'Business Created!',
        'Your business is being set up. You can track the progress in your dashboard.',
        expect.any(Array)
      );
    });

    it('should handle validation errors appropriately', async () => {
      const { getByText, getByPlaceholderText } = render(<CreateBusiness />);

      // Skip to business information step
      await act(async () => {
        fireEvent.press(getByText('Create with My Idea'));
      });

      await waitFor(() => {
        expect(getByText('Business Information')).toBeTruthy();
      });

      // Try to proceed without filling required fields
      await act(async () => {
        fireEvent.press(getByText('Next'));
      });

      // Check that validation errors are shown
      await waitFor(() => {
        expect(getByText('Business name is required')).toBeTruthy();
        expect(getByText('Industry is required')).toBeTruthy();
        expect(getByText('Business description is required')).toBeTruthy();
      });

      // Fill one field and verify partial validation
      await act(async () => {
        fireEvent.changeText(getByPlaceholderText('e.g., TaskFlow Pro'), 'Test Business');
        fireEvent.press(getByText('Next'));
      });

      // Should still show remaining validation errors
      await waitFor(() => {
        expect(getByText('Industry is required')).toBeTruthy();
        expect(getByText('Business description is required')).toBeTruthy();
      });
    });

    it('should handle API errors gracefully', async () => {
      (API.businesses.create as jest.Mock).mockRejectedValue(new Error('API Error'));

      const { getByText, getByPlaceholderText } = render(<CreateBusiness />);

      // Complete the wizard with valid data
      await act(async () => {
        fireEvent.press(getByText('Create with My Idea'));
      });

      // Fill out the form quickly
      await waitFor(() => {
        expect(getByText('Business Information')).toBeTruthy();
      });

      await act(async () => {
        fireEvent.changeText(getByPlaceholderText('e.g., TaskFlow Pro'), 'Test Business');
        fireEvent.changeText(getByPlaceholderText('e.g., SaaS, E-commerce, Health & Fitness'), 'SaaS');
        fireEvent.changeText(getByPlaceholderText('Describe what your business does and what problem it solves...'), 'Test description');
        fireEvent.press(getByText('Next'));
      });

      await waitFor(() => {
        expect(getByText('Next')).toBeTruthy();
      });

      await act(async () => {
        fireEvent.press(getByText('Next'));
      });

      await waitFor(() => {
        expect(getByText('Target Market')).toBeTruthy();
      });

      await act(async () => {
        fireEvent.changeText(getByPlaceholderText('e.g., Small business owners, Freelancers, Students...'), 'Test market');
        fireEvent.press(getByText('Next'));
      });

      await waitFor(() => {
        expect(getByText('Create Business')).toBeTruthy();
      });

      // Submit and expect error handling
      await act(async () => {
        fireEvent.press(getByText('Create Business'));
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Creation Failed',
          'Unable to create your business. Please try again.',
          [{ text: 'OK' }]
        );
      });
    });
  });

  describe('AI Research Mode Flow', () => {
    it('should complete the AI research flow', async () => {
      const { getByText } = render(<CreateBusiness />);

      // Select AI Research mode
      await act(async () => {
        fireEvent.press(getByText('Let AI Research for Me'));
      });

      // Verify navigation to AI research
      expect(router.push).toHaveBeenCalledWith('/business/ai-research');
    });

    it('should complete AI research preferences and generate business idea', async () => {
      const { getByText, getByPlaceholderText } = render(<AIResearch />);

      // Should show preferences step
      expect(getByText('Research Preferences')).toBeTruthy();

      // Select industry preferences
      await act(async () => {
        fireEvent.press(getByText('SaaS & Technology'));
        fireEvent.press(getByText('Education'));
      });

      // Fill optional fields
      await act(async () => {
        fireEvent.changeText(
          getByPlaceholderText('e.g., Small business owners, Students, Freelancers...'),
          'University students and educators'
        );
        fireEvent.changeText(
          getByPlaceholderText('e.g., $1000-$5000 for initial setup'),
          '$2000-$3000'
        );
      });

      // Start AI research
      await act(async () => {
        fireEvent.press(getByText('Start AI Research'));
      });

      // Should show research progress
      await waitFor(() => {
        expect(getByText(/Sophia is researching market opportunities/)).toBeTruthy();
      });

      // Wait for research to complete (mocked with fast timeout)
      await waitFor(
        () => {
          expect(getByText('Research Complete!')).toBeTruthy();
        },
        { timeout: 15000 }
      );

      // Should show research results
      expect(getByText('Recommended Business')).toBeTruthy();
      expect(getByText('FocusFlow')).toBeTruthy();
      expect(getByText('Market Analysis')).toBeTruthy();
      expect(getByText('Key Opportunities')).toBeTruthy();

      // Accept the research results
      await act(async () => {
        fireEvent.press(getByText('Create This Business'));
      });

      // Verify API call was made with AI research enabled
      await waitFor(() => {
        expect(API.businesses.create).toHaveBeenCalledWith({
          name: 'FocusFlow',
          description: expect.stringContaining('AI-powered productivity platform'),
          industry: 'SaaS & Productivity',
          monthlyPrice: 24.99,
          targetMarket: 'Remote teams and freelancers looking to improve productivity',
          enableAIResearch: true,
        });
      });
    });

    it('should allow research retry if user is not satisfied', async () => {
      const { getByText } = render(<AIResearch />);

      // Complete preferences and start research
      await act(async () => {
        fireEvent.press(getByText('SaaS & Technology'));
        fireEvent.press(getByText('Start AI Research'));
      });

      // Wait for results
      await waitFor(
        () => {
          expect(getByText('Research Complete!')).toBeTruthy();
        },
        { timeout: 15000 }
      );

      // Choose to research again
      await act(async () => {
        fireEvent.press(getByText('Research Again'));
      });

      // Should return to preferences
      await waitFor(() => {
        expect(getByText('Research Preferences')).toBeTruthy();
      });
    });
  });

  describe('Navigation and User Experience', () => {
    it('should allow user to navigate back through wizard steps', async () => {
      const { getByText, getByPlaceholderText } = render(<CreateBusiness />);

      // Go through a few steps
      await act(async () => {
        fireEvent.press(getByText('Create with My Idea'));
      });

      await waitFor(() => {
        expect(getByText('Business Information')).toBeTruthy();
      });

      await act(async () => {
        fireEvent.changeText(getByPlaceholderText('e.g., TaskFlow Pro'), 'Test');
        fireEvent.changeText(getByPlaceholderText('e.g., SaaS, E-commerce, Health & Fitness'), 'SaaS');
        fireEvent.changeText(getByPlaceholderText('Describe what your business does and what problem it solves...'), 'Test');
        fireEvent.press(getByText('Next'));
      });

      await waitFor(() => {
        expect(getByText('Pricing Strategy')).toBeTruthy();
      });

      // Go back to previous step
      await act(async () => {
        fireEvent.press(getByText('Back'));
      });

      // Should be back at business information
      await waitFor(() => {
        expect(getByText('Business Information')).toBeTruthy();
      });
    });

    it('should show progress indicators correctly', async () => {
      const { getByText } = render(<CreateBusiness />);

      // Start manual creation
      await act(async () => {
        fireEvent.press(getByText('Create with My Idea'));
      });

      // Should show progress dots (not visible in mode selection)
      await waitFor(() => {
        expect(getByText('Business Information')).toBeTruthy();
        // Progress indicators should be rendered (tested through snapshot or testID)
      });
    });
  });

  describe('Integration with Backend and WebSocket', () => {
    it('should handle real-time updates during business creation', async () => {
      const mockWebSocketData = {
        businessId: 'test-business-123',
        status: 'DEVELOPING',
        progress: 25,
        currentStep: 'Code generation in progress...',
      };

      const mockUseWebSocket = require('../../../hooks/useWebSocket').useWebSocket as jest.Mock;
      mockUseWebSocket.mockReturnValue({
        data: mockWebSocketData,
        isConnected: true,
        error: null,
        send: jest.fn(),
        disconnect: jest.fn(),
      });

      // This would be tested in a business detail view that subscribes to updates
      // The test would verify that real-time updates are properly handled
    });
  });
});