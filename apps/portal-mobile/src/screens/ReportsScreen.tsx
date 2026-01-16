import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Button, IconButton } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/apiClient';
import { ENV } from '../config/env';
import { LoadingState } from '../components/common/LoadingState';
import { AppFooter } from '../components/common/AppFooter';
import designTokens from '@protocolsync/shared-styles/mobile/tokens';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { GenerateReportModal } from '../components/modals/GenerateReportModal';

interface ReportCard {
  id: string;
  title: string;
  description: string;
  icon: string;
  hasViewRoute?: boolean;
}

interface ReportConfig {
  reportTitle: string;
  dateFrom: string;
  dateTo: string;
  includeAuditTrail: boolean;
  // System Access specific
  actionTypeFilter: string;
  // Site/Trial Master specific
  siteStatusFilter: string;
  includeTrialDetails: boolean;
  trialStatusFilter: string;
  // Permission Change specific
  changeTypeFilter: string;
  actionFilter: string;
  // Deactivation specific
  includeAll: boolean;
  statusFilter: string;
}

const reportCards: ReportCard[] = [
  {
    id: 'delegation-log',
    title: 'Delegation of Authority Log',
    description: 'View and generate DOA logs for protocol delegations',
    icon: 'clipboard-text-outline',
    hasViewRoute: true,
  },
  {
    id: 'system-access',
    title: 'System Access Report',
    description: 'Track user access grants and deactivations',
    icon: 'lock-outline',
  },
  {
    id: 'site-trial-master',
    title: 'Site/Trial Master Report',
    description: 'High-level overview of sites and trials',
    icon: 'office-building',
  },
  {
    id: 'permission-change',
    title: 'Permission Change Log',
    description: 'Audit trail of role and permission changes',
    icon: 'account-group',
  },
  {
    id: 'deactivation',
    title: 'Deactivation Report',
    description: 'List of deactivated and inactive users',
    icon: 'account-off',
  },
];

export const ReportsScreen = () => {
  const { user } = useAuth();
  const [generating, setGenerating] = useState(false);
  const [activeReport, setActiveReport] = useState<string | null>(null);
  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    reportTitle: '',
    dateFrom: '',
    dateTo: '',
    includeAuditTrail: true,
    actionTypeFilter: 'all',
    siteStatusFilter: 'all',
    includeTrialDetails: true,
    trialStatusFilter: 'all',
    changeTypeFilter: 'all',
    actionFilter: 'all',
    includeAll: false,
    statusFilter: 'all',
  });

  const handleCardPress = (card: ReportCard) => {
    if (card.hasViewRoute) {
      Alert.alert('Info', 'Delegation Log view is coming soon');
      return;
    }

    // Open modal for configuration
    setActiveReport(card.id);
    setReportConfig({
      ...reportConfig,
      reportTitle: `${card.title} - ${new Date().toLocaleDateString()}`,
    });
  };

  const handleGenerateReport = async () => {
    if (!activeReport || !user?.user_id) {
      Alert.alert('Error', 'Unable to generate report');
      return;
    }

    if (!reportConfig.reportTitle.trim()) {
      Alert.alert('Error', 'Report title is required');
      return;
    }

    try {
      setGenerating(true);
      setActiveReport(null);

      const endpointMap: Record<string, string> = {
        'system-access': '/reports/system-access',
        'site-trial-master': '/reports/site-trial-master',
        'permission-change': '/reports/permission-change',
        'deactivation': '/reports/deactivation',
      };

      const endpoint = endpointMap[activeReport];
      if (!endpoint) {
        throw new Error('Invalid report type');
      }

      const payload = {
        userId: user.user_id,
        ...reportConfig,
      };

      console.log('[Generate Report] Payload:', payload);

      const response = await api.post(endpoint, payload);

      console.log('[Generate Report] Response:', JSON.stringify(response, null, 2));

      if (response.success && response.data) {
        console.log('[Generate Report] Response data:', JSON.stringify(response.data, null, 2));

        // The API returns nested data: response.data.data.report_id
        const responseData = (response.data as any).data || response.data;
        const report_id = responseData.report_id;
        console.log('[Generate Report] Extracted report_id:', report_id);

        if (!report_id) {
          throw new Error('Report ID not received');
        }

        Alert.alert('Info', 'Report generation started. Download will begin shortly...');

        // Poll for completion
        let attempts = 0;
        const maxAttempts = 60;
        const pollInterval = 1000;

        const checkStatus = async (): Promise<boolean> => {
          const statusResponse = await api.get(`/reports/status/${report_id}`);

          if (statusResponse.success && statusResponse.data) {
            // Handle nested data structure: statusResponse.data.data.status
            const statusData = (statusResponse.data as any).data || statusResponse.data;
            const status = statusData.status;

            console.log(`[Poll Report] Attempt ${attempts + 1}: ${status}`);

            if (status === 'completed') {
              return true;
            } else if (status === 'failed') {
              const errorMessage = statusData.error_message;
              throw new Error(errorMessage || 'Report generation failed');
            }
          }

          return false;
        };

        while (attempts < maxAttempts) {
          const completed = await checkStatus();

          if (completed) {
            await downloadReport(report_id, reportConfig.reportTitle);
            return;
          }

          attempts++;
          await new Promise(resolve => setTimeout(resolve, pollInterval));
        }

        throw new Error('Report generation is taking longer than expected. Please check back later.');
      } else {
        throw new Error(response.error || 'Failed to generate report');
      }
    } catch (error) {
      console.error('[Generate Report] Error:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const downloadReport = async (reportId: string, reportTitle: string) => {
    try {
      console.log('[Download Report] Starting download for report:', reportId);

      // Use the download endpoint directly - it should return the PDF file
      const downloadUrl = `${ENV.API_URL}/reports/download/${reportId}`;
      const filename = reportTitle.trim().replace(/[^a-zA-Z0-9-_\.]/g, '_') + '.pdf';

      console.log('[Download Report] Download URL:', downloadUrl);
      console.log('[Download Report] Filename:', filename);

      if (Platform.OS === 'web') {
        // Web: Fetch and trigger download
        const token = await AsyncStorage.getItem('access_token');
        const response = await fetch(downloadUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-API-Key': ENV.API_KEY,
          },
        });

        if (!response.ok) {
          throw new Error(`Download failed with status ${response.status}`);
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        console.log('[Download Report] Web download completed');
      } else {
        // Native: Download and share
        const token = await AsyncStorage.getItem('access_token');
        const localUri = `${FileSystem.documentDirectory}${filename}`;

        console.log('[Download Report] Downloading to:', localUri);

        await FileSystem.downloadAsync(downloadUrl, localUri, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-API-Key': ENV.API_KEY,
          },
        });

        console.log('[Download Report] Download complete, checking sharing availability');

        const sharingAvailable = await Sharing.isAvailableAsync();
        if (sharingAvailable) {
          await Sharing.shareAsync(localUri, {
            mimeType: 'application/pdf',
            dialogTitle: 'Save Report',
          });
          console.log('[Download Report] Share dialog shown');
        } else {
          console.log('[Download Report] Sharing not available');
        }
      }

      Alert.alert('Success', 'Report generated and downloaded successfully!');
    } catch (error) {
      console.error('[Download Report] Error:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to download report');
    }
  };

  const activeCard = reportCards.find(c => c.id === activeReport);

  if (generating) {
    return <LoadingState message="Generating report..." />;
  }

  return (
    <View style={styles.wrapper}>
      <ScrollView style={styles.container}>
        {/* Page Header */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>FDA 21 CFR Part 11 Compliant Reports</Text>
          <Text style={styles.pageSubtitle}>Generate and download audit trail reports for compliance</Text>
        </View>

        {/* Report Cards */}
        <View style={styles.content}>
          {reportCards.map((card) => (
            <View key={card.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <IconButton
                  icon={card.icon}
                  size={24}
                  iconColor={designTokens.color.accent.green600}
                />
                <Text style={styles.cardTitle}>{card.title}</Text>
              </View>
              <Text style={styles.cardDescription}>{card.description}</Text>
              <Button
                mode="outlined"
                onPress={() => handleCardPress(card)}
                style={styles.cardButton}
                textColor={designTokens.color.accent.green600}
                buttonColor="transparent"
              >
                {card.hasViewRoute ? 'View' : 'Generate'}
              </Button>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Report Configuration Modal */}
      <GenerateReportModal
        visible={!!activeReport}
        onDismiss={() => setActiveReport(null)}
        reportCard={activeCard || null}
        reportConfig={reportConfig}
        onConfigChange={setReportConfig}
        onGenerate={handleGenerateReport}
        generating={generating}
      />

      <AppFooter />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: designTokens.color.background.page,
  },
  container: {
    flex: 1,
  },
  pageHeader: {
    backgroundColor: '#FFFFFF',
    padding: designTokens.spacing.l,
    borderBottomWidth: 1,
    borderBottomColor: designTokens.color.border.subtle,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: designTokens.color.text.heading,
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: designTokens.typography.fontSize.m,
    color: designTokens.color.text.subtle,
  },
  content: {
    padding: designTokens.spacing.m,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: designTokens.spacing.s,
    padding: designTokens.spacing.m,
    marginBottom: designTokens.spacing.m,
    borderWidth: 1,
    borderColor: designTokens.color.border.subtle,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: designTokens.spacing.s,
  },
  cardTitle: {
    fontSize: designTokens.typography.fontSize.l,
    fontWeight: '600',
    color: designTokens.color.text.heading,
    flex: 1,
  },
  cardDescription: {
    fontSize: designTokens.typography.fontSize.m,
    color: designTokens.color.text.subtle,
    marginBottom: designTokens.spacing.m,
  },
  cardButton: {
    marginTop: designTokens.spacing.s,
  },
});
