import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { Button, Card, Input } from '../ui';

interface BusinessCreationData {
  name: string;
  description: string;
  industry: string;
  monthlyPrice: number;
  currency: string;
  targetMarket: string;
  enableAIResearch: boolean;
}

interface BusinessCreationWizardProps {
  onSubmit: (data: BusinessCreationData) => Promise<void>;
  isLoading: boolean;
}

enum WizardStep {
  MODE_SELECTION = 'mode_selection',
  BUSINESS_INFO = 'business_info',
  PRICING = 'pricing',
  MARKET = 'market',
  REVIEW = 'review',
}

export const BusinessCreationWizard: React.FC<BusinessCreationWizardProps> = ({
  onSubmit,
  isLoading,
}) => {
  const theme = useTheme();
  const [currentStep, setCurrentStep] = useState<WizardStep>(WizardStep.MODE_SELECTION);
  const [formData, setFormData] = useState<BusinessCreationData>({
    name: '',
    description: '',
    industry: '',
    monthlyPrice: 29.99,
    currency: 'USD',
    targetMarket: '',
    enableAIResearch: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    card: {
      marginBottom: theme.spacing.lg,
    },
    stepHeader: {
      alignItems: 'center',
      marginBottom: theme.spacing.xl,
    },
    stepTitle: {
      fontSize: theme.typography.fontSize.xl,
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.sm,
      textAlign: 'center',
    },
    stepDescription: {
      fontSize: theme.typography.fontSize.base,
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.text.secondary,
      textAlign: 'center',
      lineHeight: theme.typography.lineHeight.relaxed * theme.typography.fontSize.base,
    },
    modeOption: {
      marginBottom: theme.spacing.md,
    },
    modeTitle: {
      fontSize: theme.typography.fontSize.lg,
      fontFamily: theme.typography.fontFamily.semiBold,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.sm,
    },
    modeDescription: {
      fontSize: theme.typography.fontSize.sm,
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.text.secondary,
      marginBottom: theme.spacing.md,
      lineHeight: theme.typography.lineHeight.relaxed * theme.typography.fontSize.sm,
    },
    inputGroup: {
      marginBottom: theme.spacing.lg,
    },
    label: {
      fontSize: theme.typography.fontSize.base,
      fontFamily: theme.typography.fontFamily.medium,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.sm,
    },
    errorText: {
      fontSize: theme.typography.fontSize.sm,
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.error,
      marginTop: theme.spacing.xs,
    },
    buttonContainer: {
      flexDirection: 'row',
      gap: theme.spacing.md,
      marginTop: theme.spacing.xl,
    },
    progressContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginBottom: theme.spacing.xl,
    },
    progressDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginHorizontal: theme.spacing.xs,
    },
    progressDotActive: {
      backgroundColor: theme.colors.primary,
    },
    progressDotInactive: {
      backgroundColor: theme.colors.border,
    },
    priceContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
    },
    currencyText: {
      fontSize: theme.typography.fontSize.base,
      fontFamily: theme.typography.fontFamily.medium,
      color: theme.colors.text.primary,
    },
    reviewItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: theme.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    reviewLabel: {
      fontSize: theme.typography.fontSize.base,
      fontFamily: theme.typography.fontFamily.medium,
      color: theme.colors.text.secondary,
    },
    reviewValue: {
      fontSize: theme.typography.fontSize.base,
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.text.primary,
      flex: 1,
      textAlign: 'right',
    },
  });

  const validateStep = (step: WizardStep): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case WizardStep.BUSINESS_INFO:
        if (!formData.name.trim()) {
          newErrors.name = 'Business name is required';
        }
        if (!formData.description.trim()) {
          newErrors.description = 'Business description is required';
        }
        if (!formData.industry.trim()) {
          newErrors.industry = 'Industry is required';
        }
        break;
      case WizardStep.PRICING:
        if (formData.monthlyPrice <= 0) {
          newErrors.monthlyPrice = 'Price must be greater than 0';
        }
        break;
      case WizardStep.MARKET:
        if (!formData.targetMarket.trim()) {
          newErrors.targetMarket = 'Target market is required';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getStepIndex = (step: WizardStep): number => {
    const steps = Object.values(WizardStep);
    return steps.indexOf(step);
  };

  const getTotalSteps = (): number => {
    return Object.values(WizardStep).length;
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) return;

    const steps = Object.values(WizardStep);
    const currentIndex = getStepIndex(currentStep);
    
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    const steps = Object.values(WizardStep);
    const currentIndex = getStepIndex(currentStep);
    
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;
    
    try {
      await onSubmit(formData);
    } catch (error) {
      Alert.alert('Error', 'Failed to create business. Please try again.');
    }
  };

  const handleModeSelection = (enableAIResearch: boolean) => {
    if (enableAIResearch) {
      router.push('/business/ai-research');
    } else {
      setFormData({ ...formData, enableAIResearch: false });
      setCurrentStep(WizardStep.BUSINESS_INFO);
    }
  };

  const renderProgress = () => (
    <View style={styles.progressContainer}>
      {Array.from({ length: getTotalSteps() }, (_, index) => (
        <View
          key={index}
          style={[
            styles.progressDot,
            index <= getStepIndex(currentStep)
              ? styles.progressDotActive
              : styles.progressDotInactive,
          ]}
        />
      ))}
    </View>
  );

  const renderModeSelection = () => (
    <Card style={styles.card}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>Choose Creation Mode</Text>
        <Text style={styles.stepDescription}>
          How would you like to create your business?
        </Text>
      </View>

      <View style={styles.modeOption}>
        <Text style={styles.modeTitle}>Manual Creation</Text>
        <Text style={styles.modeDescription}>
          Create your business by providing specific details and requirements. 
          You'll have full control over every aspect of your business setup.
        </Text>
        <Button
          title="Create with My Idea"
          onPress={() => handleModeSelection(false)}
          variant="primary"
          fullWidth
        />
      </View>

      <View style={styles.modeOption}>
        <Text style={styles.modeTitle}>AI Research Mode</Text>
        <Text style={styles.modeDescription}>
          Let Sophia AI conduct market research and generate a data-driven business 
          idea for you. Perfect for discovering new opportunities.
        </Text>
        <Button
          title="Let AI Research for Me"
          onPress={() => handleModeSelection(true)}
          variant="secondary"
          fullWidth
        />
      </View>
    </Card>
  );

  const renderBusinessInfo = () => (
    <Card style={styles.card}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>Business Information</Text>
        <Text style={styles.stepDescription}>
          Tell us about your business idea
        </Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Business Name</Text>
        <Input
          value={formData.name}
          onChangeText={(text) => setFormData({ ...formData, name: text })}
          placeholder="e.g., TaskFlow Pro"
          error={errors.name}
        />
        {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Industry</Text>
        <Input
          value={formData.industry}
          onChangeText={(text) => setFormData({ ...formData, industry: text })}
          placeholder="e.g., SaaS, E-commerce, Health & Fitness"
          error={errors.industry}
        />
        {errors.industry && <Text style={styles.errorText}>{errors.industry}</Text>}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Business Description</Text>
        <Input
          value={formData.description}
          onChangeText={(text) => setFormData({ ...formData, description: text })}
          placeholder="Describe what your business does and what problem it solves..."
          multiline
          numberOfLines={4}
          error={errors.description}
        />
        {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
      </View>
    </Card>
  );

  const renderPricing = () => (
    <Card style={styles.card}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>Pricing Strategy</Text>
        <Text style={styles.stepDescription}>
          Set your subscription pricing
        </Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Monthly Price</Text>
        <View style={styles.priceContainer}>
          <Text style={styles.currencyText}>$</Text>
          <Input
            value={formData.monthlyPrice.toString()}
            onChangeText={(text) => {
              const price = parseFloat(text) || 0;
              setFormData({ ...formData, monthlyPrice: price });
            }}
            placeholder="29.99"
            keyboardType="numeric"
            error={errors.monthlyPrice}
            style={{ flex: 1 }}
          />
          <Text style={styles.currencyText}>/ month</Text>
        </View>
        {errors.monthlyPrice && <Text style={styles.errorText}>{errors.monthlyPrice}</Text>}
      </View>
    </Card>
  );

  const renderMarket = () => (
    <Card style={styles.card}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>Target Market</Text>
        <Text style={styles.stepDescription}>
          Who is your ideal customer?
        </Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Target Market</Text>
        <Input
          value={formData.targetMarket}
          onChangeText={(text) => setFormData({ ...formData, targetMarket: text })}
          placeholder="e.g., Small business owners, Freelancers, Students..."
          multiline
          numberOfLines={3}
          error={errors.targetMarket}
        />
        {errors.targetMarket && <Text style={styles.errorText}>{errors.targetMarket}</Text>}
      </View>
    </Card>
  );

  const renderReview = () => (
    <Card style={styles.card}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>Review & Create</Text>
        <Text style={styles.stepDescription}>
          Review your business details before creation
        </Text>
      </View>

      <View style={styles.reviewItem}>
        <Text style={styles.reviewLabel}>Name:</Text>
        <Text style={styles.reviewValue}>{formData.name}</Text>
      </View>

      <View style={styles.reviewItem}>
        <Text style={styles.reviewLabel}>Industry:</Text>
        <Text style={styles.reviewValue}>{formData.industry}</Text>
      </View>

      <View style={styles.reviewItem}>
        <Text style={styles.reviewLabel}>Price:</Text>
        <Text style={styles.reviewValue}>${formData.monthlyPrice}/month</Text>
      </View>

      <View style={styles.reviewItem}>
        <Text style={styles.reviewLabel}>Target Market:</Text>
        <Text style={styles.reviewValue}>{formData.targetMarket}</Text>
      </View>
    </Card>
  );

  const renderButtons = () => {
    const isFirstStep = currentStep === WizardStep.MODE_SELECTION;
    const isLastStep = currentStep === WizardStep.REVIEW;

    return (
      <View style={styles.buttonContainer}>
        {!isFirstStep && (
          <Button
            title="Back"
            onPress={handleBack}
            variant="secondary"
            style={{ flex: 1 }}
            disabled={isLoading}
          />
        )}
        
        <Button
          title={isLastStep ? 'Create Business' : 'Next'}
          onPress={isLastStep ? handleSubmit : handleNext}
          variant="primary"
          style={{ flex: 1 }}
          loading={isLoading}
        />
      </View>
    );
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case WizardStep.MODE_SELECTION:
        return renderModeSelection();
      case WizardStep.BUSINESS_INFO:
        return renderBusinessInfo();
      case WizardStep.PRICING:
        return renderPricing();
      case WizardStep.MARKET:
        return renderMarket();
      case WizardStep.REVIEW:
        return renderReview();
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {currentStep !== WizardStep.MODE_SELECTION && renderProgress()}
      {renderCurrentStep()}
      {renderButtons()}
    </View>
  );
};