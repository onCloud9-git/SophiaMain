import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Button, Card, Input } from '../ui';
import { API } from '../../services/api';

interface AIResearchModeProps {
  onComplete: (businessIdea: any) => Promise<void>;
  isLoading: boolean;
}

interface MarketResearchData {
  industry: string;
  targetAudience: string;
  preferences: string[];
  budget: string;
}

enum ResearchStep {
  PREFERENCES = 'preferences',
  RESEARCH_PROGRESS = 'research_progress',
  RESULTS = 'results',
}

export const AIResearchMode: React.FC<AIResearchModeProps> = ({
  onComplete,
  isLoading: externalLoading,
}) => {
  const theme = useTheme();
  const [currentStep, setCurrentStep] = useState<ResearchStep>(ResearchStep.PREFERENCES);
  const [isResearching, setIsResearching] = useState(false);
  const [researchData, setResearchData] = useState<MarketResearchData>({
    industry: '',
    targetAudience: '',
    preferences: [],
    budget: '',
  });
  const [researchResults, setResearchResults] = useState<any>(null);
  const [researchProgress, setResearchProgress] = useState(0);

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
    inputGroup: {
      marginBottom: theme.spacing.lg,
    },
    label: {
      fontSize: theme.typography.fontSize.base,
      fontFamily: theme.typography.fontFamily.medium,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.sm,
    },
    preferenceGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.lg,
    },
    preferenceChip: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.borderRadius.lg,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
    },
    preferenceChipSelected: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    preferenceChipText: {
      fontSize: theme.typography.fontSize.sm,
      fontFamily: theme.typography.fontFamily.medium,
      color: theme.colors.text.primary,
    },
    preferenceChipTextSelected: {
      color: theme.colors.white,
    },
    progressContainer: {
      alignItems: 'center',
      paddingVertical: theme.spacing.xxl,
    },
    progressTitle: {
      fontSize: theme.typography.fontSize.lg,
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.xl,
      textAlign: 'center',
    },
    progressBar: {
      width: '100%',
      height: 8,
      backgroundColor: theme.colors.surface,
      borderRadius: 4,
      marginBottom: theme.spacing.lg,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: theme.colors.primary,
      borderRadius: 4,
    },
    progressText: {
      fontSize: theme.typography.fontSize.base,
      fontFamily: theme.typography.fontFamily.medium,
      color: theme.colors.text.secondary,
      textAlign: 'center',
    },
    researchStep: {
      marginBottom: theme.spacing.md,
    },
    researchStepText: {
      fontSize: theme.typography.fontSize.sm,
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.text.secondary,
    },
    resultsContainer: {
      marginBottom: theme.spacing.lg,
    },
    resultSection: {
      marginBottom: theme.spacing.lg,
    },
    resultTitle: {
      fontSize: theme.typography.fontSize.lg,
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.sm,
    },
    resultText: {
      fontSize: theme.typography.fontSize.base,
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.text.secondary,
      lineHeight: theme.typography.lineHeight.relaxed * theme.typography.fontSize.base,
    },
    buttonContainer: {
      marginTop: theme.spacing.xl,
    },
  });

  const industryPreferences = [
    'SaaS & Technology',
    'E-commerce',
    'Health & Fitness',
    'Education',
    'Finance',
    'Entertainment',
    'Productivity',
    'Social Networking',
  ];

  const handlePreferenceToggle = (preference: string) => {
    const currentPreferences = researchData.preferences;
    const isSelected = currentPreferences.includes(preference);
    
    const newPreferences = isSelected
      ? currentPreferences.filter(p => p !== preference)
      : [...currentPreferences, preference];

    setResearchData({
      ...researchData,
      preferences: newPreferences,
    });
  };

  const startAIResearch = async () => {
    setIsResearching(true);
    setCurrentStep(ResearchStep.RESEARCH_PROGRESS);
    setResearchProgress(0);

    try {
      // Simulate research progress
      const steps = [
        'Analyzing market trends...',
        'Identifying opportunities...',
        'Evaluating competition...',
        'Generating business concepts...',
        'Finalizing recommendations...',
      ];

      for (let i = 0; i < steps.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        setResearchProgress(((i + 1) / steps.length) * 100);
      }

      // Mock research results
      const mockResults = {
        businessIdea: {
          name: 'FocusFlow',
          description: 'AI-powered productivity platform that helps remote teams stay focused and collaborate effectively through smart task management and distraction blocking.',
          industry: 'SaaS & Productivity',
          monthlyPrice: 24.99,
          targetMarket: 'Remote teams and freelancers looking to improve productivity',
        },
        marketAnalysis: {
          size: '$12.3B global productivity software market',
          growth: '13.2% CAGR expected through 2028',
          competition: 'Medium - opportunity for differentiation through AI features',
        },
        opportunities: [
          'Growing remote work trend increases demand for productivity tools',
          'AI integration provides competitive advantage',
          'Subscription model shows strong recurring revenue potential',
        ],
      };

      setResearchResults(mockResults);
      setCurrentStep(ResearchStep.RESULTS);
    } catch (error) {
      Alert.alert('Research Failed', 'Unable to complete market research. Please try again.');
      setCurrentStep(ResearchStep.PREFERENCES);
    } finally {
      setIsResearching(false);
    }
  };

  const handleAcceptResults = async () => {
    if (researchResults) {
      try {
        await onComplete(researchResults.businessIdea);
      } catch (error) {
        Alert.alert('Error', 'Failed to create business. Please try again.');
      }
    }
  };

  const renderPreferences = () => (
    <Card style={styles.card}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>Research Preferences</Text>
        <Text style={styles.stepDescription}>
          Help Sophia understand what type of business opportunities you're interested in
        </Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Preferred Industries (select multiple)</Text>
        <View style={styles.preferenceGrid}>
          {industryPreferences.map((preference) => {
            const isSelected = researchData.preferences.includes(preference);
            return (
              <Button
                key={preference}
                title={preference}
                onPress={() => handlePreferenceToggle(preference)}
                variant={isSelected ? 'primary' : 'secondary'}
                size="sm"
              />
            );
          })}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Target Audience (optional)</Text>
        <Input
          value={researchData.targetAudience}
          onChangeText={(text) => 
            setResearchData({ ...researchData, targetAudience: text })
          }
          placeholder="e.g., Small business owners, Students, Freelancers..."
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Budget Range (optional)</Text>
        <Input
          value={researchData.budget}
          onChangeText={(text) => 
            setResearchData({ ...researchData, budget: text })
          }
          placeholder="e.g., $1000-$5000 for initial setup"
        />
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title="Start AI Research"
          onPress={startAIResearch}
          variant="primary"
          fullWidth
          disabled={researchData.preferences.length === 0}
        />
      </View>
    </Card>
  );

  const renderResearchProgress = () => (
    <Card style={styles.card}>
      <View style={styles.progressContainer}>
        <Text style={styles.progressTitle}>Sophia is researching market opportunities...</Text>
        
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${researchProgress}%` }
            ]} 
          />
        </View>
        
        <Text style={styles.progressText}>
          {Math.round(researchProgress)}% Complete
        </Text>

        <View style={{ marginTop: theme.spacing.xl }}>
          <Text style={styles.researchStepText}>
            This may take a few minutes as Sophia analyzes market data, competitor landscape, and identifies the best opportunities for your preferences.
          </Text>
        </View>
      </View>
    </Card>
  );

  const renderResults = () => (
    <View style={styles.container}>
      <Card style={styles.card}>
        <View style={styles.stepHeader}>
          <Text style={styles.stepTitle}>Research Complete!</Text>
          <Text style={styles.stepDescription}>
            Sophia has identified a promising business opportunity for you
          </Text>
        </View>

        <View style={styles.resultsContainer}>
          <View style={styles.resultSection}>
            <Text style={styles.resultTitle}>Recommended Business</Text>
            <Text style={styles.resultText}>
              <Text style={{ fontFamily: theme.typography.fontFamily.bold }}>
                {researchResults?.businessIdea.name}
              </Text>
              {'\n\n'}
              {researchResults?.businessIdea.description}
              {'\n\n'}
              <Text style={{ fontFamily: theme.typography.fontFamily.bold }}>
                Suggested Price: ${researchResults?.businessIdea.monthlyPrice}/month
              </Text>
            </Text>
          </View>

          <View style={styles.resultSection}>
            <Text style={styles.resultTitle}>Market Analysis</Text>
            <Text style={styles.resultText}>
              • Market Size: {researchResults?.marketAnalysis.size}{'\n'}
              • Growth Rate: {researchResults?.marketAnalysis.growth}{'\n'}
              • Competition Level: {researchResults?.marketAnalysis.competition}
            </Text>
          </View>

          <View style={styles.resultSection}>
            <Text style={styles.resultTitle}>Key Opportunities</Text>
            <Text style={styles.resultText}>
              {researchResults?.opportunities.map((opp: string, index: number) => 
                `• ${opp}`
              ).join('\n')}
            </Text>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title="Create This Business"
            onPress={handleAcceptResults}
            variant="primary"
            fullWidth
            loading={externalLoading}
          />
          
          <Button
            title="Research Again"
            onPress={() => {
              setCurrentStep(ResearchStep.PREFERENCES);
              setResearchResults(null);
              setResearchProgress(0);
            }}
            variant="secondary"
            fullWidth
            style={{ marginTop: theme.spacing.md }}
          />
        </View>
      </Card>
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case ResearchStep.PREFERENCES:
        return renderPreferences();
      case ResearchStep.RESEARCH_PROGRESS:
        return renderResearchProgress();
      case ResearchStep.RESULTS:
        return renderResults();
      default:
        return null;
    }
  };

  return <View style={styles.container}>{renderCurrentStep()}</View>;
};