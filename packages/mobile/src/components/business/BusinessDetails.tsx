import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Linking,
  Alert,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Button, Card } from '../ui';

interface Business {
  id: string;
  name: string;
  description: string;
  industry: string;
  status: 'PLANNING' | 'DEVELOPING' | 'DEPLOYING' | 'ACTIVE' | 'PAUSED' | 'CLOSED';
  websiteUrl?: string;
  monthlyPrice: number;
  currency: string;
  createdAt: string;
  repositoryUrl?: string;
  landingPageUrl?: string;
}

interface BusinessDetailsProps {
  business: Business;
}

export const BusinessDetails: React.FC<BusinessDetailsProps> = ({ business }) => {
  const theme = useTheme();

  const styles = StyleSheet.create({
    container: {
      gap: theme.spacing.lg,
    },
    card: {
      padding: theme.spacing.lg,
    },
    sectionTitle: {
      fontSize: theme.typography.fontSize.lg,
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.md,
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: theme.spacing.sm,
    },
    infoLabel: {
      fontSize: theme.typography.fontSize.base,
      fontFamily: theme.typography.fontFamily.medium,
      color: theme.colors.text.secondary,
      flex: 1,
    },
    infoValue: {
      fontSize: theme.typography.fontSize.base,
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.text.primary,
      flex: 2,
      textAlign: 'right',
    },
    description: {
      fontSize: theme.typography.fontSize.base,
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.text.secondary,
      lineHeight: theme.typography.lineHeight.relaxed * theme.typography.fontSize.base,
    },
    linkButton: {
      marginBottom: theme.spacing.sm,
    },
    actionButtons: {
      gap: theme.spacing.md,
    },
    warningText: {
      fontSize: theme.typography.fontSize.sm,
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.warning,
      textAlign: 'center',
      fontStyle: 'italic',
      marginTop: theme.spacing.md,
    },
    priceContainer: {
      alignItems: 'center',
      backgroundColor: theme.colors.primary + '10',
      borderRadius: theme.borderRadius.lg,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
    },
    priceValue: {
      fontSize: theme.typography.fontSize['2xl'],
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.primary,
    },
    priceLabel: {
      fontSize: theme.typography.fontSize.sm,
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.text.secondary,
    },
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleOpenLink = async (url: string, title: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', `Cannot open ${title}`);
      }
    } catch (error) {
      Alert.alert('Error', `Failed to open ${title}`);
    }
  };

  const handlePauseBusiness = () => {
    Alert.alert(
      'Pause Business',
      'Are you sure you want to pause this business? This will stop all marketing campaigns and put the business on hold.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Pause', 
          style: 'destructive',
          onPress: () => {
            // TODO: Implement pause functionality
            Alert.alert('Paused', 'Business has been paused successfully.');
          }
        },
      ]
    );
  };

  const handleDeleteBusiness = () => {
    Alert.alert(
      'Delete Business',
      'Are you sure you want to permanently delete this business? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            // TODO: Implement delete functionality
            Alert.alert('Deleted', 'Business has been deleted successfully.');
          }
        },
      ]
    );
  };

  const isBusinessLive = business.status === 'ACTIVE';
  const hasWebsite = business.websiteUrl || business.landingPageUrl;

  return (
    <View style={styles.container}>
      {/* Pricing Information */}
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Subscription Pricing</Text>
        <View style={styles.priceContainer}>
          <Text style={styles.priceValue}>
            ${business.monthlyPrice.toFixed(2)}
          </Text>
          <Text style={styles.priceLabel}>per month</Text>
        </View>
      </Card>

      {/* Basic Information */}
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Business Information</Text>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Industry:</Text>
          <Text style={styles.infoValue}>{business.industry}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Created:</Text>
          <Text style={styles.infoValue}>{formatDate(business.createdAt)}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Status:</Text>
          <Text style={styles.infoValue}>{business.status}</Text>
        </View>

        <View style={{ marginTop: theme.spacing.md }}>
          <Text style={styles.infoLabel}>Description:</Text>
          <Text style={styles.description}>{business.description}</Text>
        </View>
      </Card>

      {/* Links and Actions */}
      {hasWebsite && (
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Quick Links</Text>
          
          {business.websiteUrl && (
            <Button
              title="🌐 Visit Website"
              onPress={() => handleOpenLink(business.websiteUrl!, 'website')}
              variant="secondary"
              fullWidth
              style={styles.linkButton}
            />
          )}

          {business.landingPageUrl && (
            <Button
              title="📄 Landing Page"
              onPress={() => handleOpenLink(business.landingPageUrl!, 'landing page')}
              variant="secondary"
              fullWidth
              style={styles.linkButton}
            />
          )}

          {business.repositoryUrl && (
            <Button
              title="💻 View Code"
              onPress={() => handleOpenLink(business.repositoryUrl!, 'repository')}
              variant="ghost"
              fullWidth
              style={styles.linkButton}
            />
          )}

          {!isBusinessLive && (
            <Text style={styles.warningText}>
              Links will be available once the business is live
            </Text>
          )}
        </Card>
      )}

      {/* Management Actions */}
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Management</Text>
        
        <View style={styles.actionButtons}>
          {business.status === 'ACTIVE' && (
            <Button
              title="⏸️ Pause Business"
              onPress={handlePauseBusiness}
              variant="warning"
              fullWidth
            />
          )}

          {business.status === 'PAUSED' && (
            <Button
              title="▶️ Resume Business"
              onPress={() => {
                // TODO: Implement resume functionality
                Alert.alert('Resumed', 'Business has been resumed successfully.');
              }}
              variant="primary"
              fullWidth
            />
          )}

          <Button
            title="🗑️ Delete Business"
            onPress={handleDeleteBusiness}
            variant="error"
            fullWidth
          />
        </View>
      </Card>
    </View>
  );
};