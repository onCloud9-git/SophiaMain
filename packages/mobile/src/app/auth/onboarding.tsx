import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { useTheme } from '../../hooks/useTheme';

const { width } = Dimensions.get('window');

const onboardingSteps = [
  {
    title: 'Witaj w Sophia AI',
    subtitle: 'Twój osobisty asystent biznesowy',
    description: 'Sophia pomoże Ci stworzyć, zarządzać i skalować Twoje biznesy w pełni automatycznie.',
    icon: '🤖',
  },
  {
    title: 'Automatyczne tworzenie biznesów',
    subtitle: 'Jednym kliknięciem do sukcesu',
    description: 'Sophia może wygenerować pomysł na biznes, stworzyć aplikację i uruchomić kampanie marketingowe.',
    icon: '🚀',
  },
  {
    title: 'AI-powered zarządzanie',
    subtitle: 'Inteligentne decyzje 24/7',
    description: 'System automatycznie analizuje wyniki i podejmuje decyzje o skalowaniu lub zamykaniu projektów.',
    icon: '📊',
  },
  {
    title: 'Gotowy do startu!',
    subtitle: 'Rozpocznijmy Twoją przygodę',
    description: 'Teraz możesz rozpocząć tworzenie swoich pierwszych projektów biznesowych.',
    icon: '✨',
  },
];

export default function OnboardingScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete onboarding
      router.replace('/(tabs)');
    }
  };

  const handleSkip = () => {
    router.replace('/(tabs)');
  };

  const currentStepData = onboardingSteps[currentStep];
  const isLastStep = currentStep === onboardingSteps.length - 1;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress indicator */}
        <View style={styles.progressContainer}>
          {onboardingSteps.map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                {
                  backgroundColor: index <= currentStep 
                    ? theme.colors.primary 
                    : theme.colors.border.default,
                },
              ]}
            />
          ))}
        </View>

        {/* Main content */}
        <View style={styles.content}>
          <Text style={styles.icon}>{currentStepData.icon}</Text>
          
          <Text style={[styles.title, { color: theme.colors.text.primary }]}>
            {currentStepData.title}
          </Text>
          
          <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
            {currentStepData.subtitle}
          </Text>
          
          <Card style={styles.descriptionCard}>
            <Text style={[styles.description, { color: theme.colors.text.primary }]}>
              {currentStepData.description}
            </Text>
          </Card>
        </View>

        {/* Navigation */}
        <View style={styles.navigation}>
          <Button
            title={isLastStep ? 'Rozpocznij' : 'Dalej'}
            onPress={handleNext}
            style={styles.nextButton}
          />
          
          {!isLastStep && (
            <Button
              title="Pomiń"
              variant="ghost"
              onPress={handleSkip}
              style={styles.skipButton}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 60,
    gap: 12,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 80,
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 32,
  },
  descriptionCard: {
    width: '100%',
    marginBottom: 32,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  navigation: {
    gap: 16,
  },
  nextButton: {
    width: '100%',
  },
  skipButton: {
    width: '100%',
  },
});