import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import OnboardingScreen from '../../../app/auth/onboarding';

// Mock dependencies
jest.mock('expo-router');

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

describe('OnboardingScreen', () => {
  const mockRouter = {
    replace: jest.fn(),
  };

  beforeEach(() => {
    mockUseRouter.mockReturnValue(mockRouter as any);
    jest.clearAllMocks();
  });

  it('should render first onboarding step correctly', () => {
    const { getByText } = render(<OnboardingScreen />);
    
    expect(getByText('Witaj w Sophia AI')).toBeTruthy();
    expect(getByText('Twój osobisty asystent biznesowy')).toBeTruthy();
    expect(getByText('Sophia pomoże Ci stworzyć, zarządzać i skalować Twoje biznesy w pełni automatycznie.')).toBeTruthy();
    expect(getByText('🤖')).toBeTruthy();
    expect(getByText('Dalej')).toBeTruthy();
    expect(getByText('Pomiń')).toBeTruthy();
  });

  it('should navigate through onboarding steps', () => {
    const { getByText, queryByText } = render(<OnboardingScreen />);
    
    // First step
    expect(getByText('Witaj w Sophia AI')).toBeTruthy();
    
    // Go to second step
    fireEvent.press(getByText('Dalej'));
    expect(getByText('Automatyczne tworzenie biznesów')).toBeTruthy();
    expect(getByText('🚀')).toBeTruthy();
    
    // Go to third step
    fireEvent.press(getByText('Dalej'));
    expect(getByText('AI-powered zarządzanie')).toBeTruthy();
    expect(getByText('📊')).toBeTruthy();
    
    // Go to final step
    fireEvent.press(getByText('Dalej'));
    expect(getByText('Gotowy do startu!')).toBeTruthy();
    expect(getByText('✨')).toBeTruthy();
    expect(getByText('Rozpocznij')).toBeTruthy();
    expect(queryByText('Pomiń')).toBeFalsy(); // Skip button should not be visible on last step
  });

  it('should complete onboarding on final step', () => {
    const { getByText } = render(<OnboardingScreen />);
    
    // Navigate to final step
    fireEvent.press(getByText('Dalej')); // Step 2
    fireEvent.press(getByText('Dalej')); // Step 3
    fireEvent.press(getByText('Dalej')); // Step 4
    
    // Complete onboarding
    fireEvent.press(getByText('Rozpocznij'));
    
    expect(mockRouter.replace).toHaveBeenCalledWith('/(tabs)');
  });

  it('should skip onboarding when skip button is pressed', () => {
    const { getByText } = render(<OnboardingScreen />);
    
    fireEvent.press(getByText('Pomiń'));
    
    expect(mockRouter.replace).toHaveBeenCalledWith('/(tabs)');
  });

  it('should show correct progress indicators', () => {
    const { getByText } = render(<OnboardingScreen />);
    
    // Should show 4 progress dots
    const progressContainer = getByText('Witaj w Sophia AI').parent?.parent?.parent;
    expect(progressContainer).toBeTruthy();
  });
});