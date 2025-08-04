import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { Card, Button } from '../components/ui';

export default function Help() {
  const theme = useTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      padding: theme.layout.screen.padding,
    },
    title: {
      fontSize: theme.typography.fontSize['2xl'],
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.xl,
    },
    sectionTitle: {
      fontSize: theme.typography.fontSize.lg,
      fontFamily: theme.typography.fontFamily.semiBold,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.md,
      marginTop: theme.spacing.lg,
    },
    faqItem: {
      marginBottom: theme.spacing.md,
    },
    question: {
      fontSize: theme.typography.fontSize.base,
      fontFamily: theme.typography.fontFamily.semiBold,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.sm,
    },
    answer: {
      fontSize: theme.typography.fontSize.base,
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.text.secondary,
      lineHeight: theme.typography.lineHeight.relaxed * theme.typography.fontSize.base,
    },
    contactCard: {
      alignItems: 'center',
      padding: theme.spacing.xl,
    },
    contactTitle: {
      fontSize: theme.typography.fontSize.xl,
      fontFamily: theme.typography.fontFamily.semiBold,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.md,
      textAlign: 'center',
    },
    contactDescription: {
      fontSize: theme.typography.fontSize.base,
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.text.secondary,
      textAlign: 'center',
      marginBottom: theme.spacing.lg,
      lineHeight: theme.typography.lineHeight.relaxed * theme.typography.fontSize.base,
    },
    buttonRow: {
      flexDirection: 'row',
      gap: theme.spacing.md,
      width: '100%',
    },
    featureCard: {
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.md,
    },
    featureTitle: {
      fontSize: theme.typography.fontSize.lg,
      fontFamily: theme.typography.fontFamily.semiBold,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.sm,
    },
    featureDescription: {
      fontSize: theme.typography.fontSize.base,
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.text.secondary,
      lineHeight: theme.typography.lineHeight.relaxed * theme.typography.fontSize.base,
    },
  });

  const handleEmailSupport = () => {
    Linking.openURL('mailto:support@sophia-ai.com?subject=Support Request');
  };

  const handleOpenDocs = () => {
    Linking.openURL('https://docs.sophia-ai.com');
  };

  const faqData = [
    {
      question: "How does Sophia AI create businesses automatically?",
      answer: "Sophia uses advanced AI to research market opportunities, generate business plans, create websites using development tools, and set up marketing campaigns automatically."
    },
    {
      question: "What happens if my business isn't performing well?",
      answer: "Sophia monitors all businesses continuously. If a business shows poor performance for 2 weeks, it will automatically pause campaigns and provide recommendations or close the business."
    },
    {
      question: "How much does it cost to create a business?",
      answer: "Business creation is included in your subscription. You only pay for the marketing budgets and hosting costs for each business, which are tracked transparently."
    },
    {
      question: "Can I control the AI's decisions?",
      answer: "Yes! You can set limits on budgets, review decisions before they're implemented, and manually override any AI recommendations in your settings."
    },
    {
      question: "How do I track my businesses' performance?",
      answer: "Each business has detailed analytics showing visitors, conversions, revenue, and campaign performance. You'll also receive regular reports and notifications."
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.title}>Help & Support</Text>

          {/* Getting Started */}
          <Text style={styles.sectionTitle}>🚀 Getting Started</Text>
          <Card style={styles.featureCard}>
            <Text style={styles.featureTitle}>Create Your First Business</Text>
            <Text style={styles.featureDescription}>
              Tap the "+" button to create a new business. Choose "AI Research" to let Sophia find opportunities, or "Create from Idea" to build your own concept.
            </Text>
          </Card>

          <Card style={styles.featureCard}>
            <Text style={styles.featureTitle}>Monitor Progress</Text>
            <Text style={styles.featureDescription}>
              Watch your businesses develop in real-time. Sophia will handle development, deployment, marketing, and optimization automatically.
            </Text>
          </Card>

          {/* FAQ Section */}
          <Text style={styles.sectionTitle}>❓ Frequently Asked Questions</Text>
          <Card>
            {faqData.map((faq, index) => (
              <View key={index} style={styles.faqItem}>
                <Text style={styles.question}>{faq.question}</Text>
                <Text style={styles.answer}>{faq.answer}</Text>
              </View>
            ))}
          </Card>

          {/* Key Features */}
          <Text style={styles.sectionTitle}>✨ Key Features</Text>
          <Card style={styles.featureCard}>
            <Text style={styles.featureTitle}>🤖 AI Business Creation</Text>
            <Text style={styles.featureDescription}>
              Sophia researches markets, generates business plans, and creates complete applications automatically.
            </Text>
          </Card>

          <Card style={styles.featureCard}>
            <Text style={styles.featureTitle}>📊 Smart Analytics</Text>
            <Text style={styles.featureDescription}>
              Real-time tracking of all business metrics with AI-powered insights and recommendations.
            </Text>
          </Card>

          <Card style={styles.featureCard}>
            <Text style={styles.featureTitle}>🎯 Automated Marketing</Text>
            <Text style={styles.featureDescription}>
              Sophia creates and optimizes marketing campaigns across multiple platforms automatically.
            </Text>
          </Card>

          {/* Contact Support */}
          <Text style={styles.sectionTitle}>📞 Need More Help?</Text>
          <Card>
            <View style={styles.contactCard}>
              <Text style={styles.contactTitle}>Contact Support</Text>
              <Text style={styles.contactDescription}>
                Our team is here to help you succeed with Sophia AI. Reach out for any questions or technical support.
              </Text>
              <View style={styles.buttonRow}>
                <Button
                  title="Email Support"
                  onPress={handleEmailSupport}
                  variant="primary"
                  style={{ flex: 1 }}
                />
                <Button
                  title="Documentation"
                  onPress={handleOpenDocs}
                  variant="secondary"
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}