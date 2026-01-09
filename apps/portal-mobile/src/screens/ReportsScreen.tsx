import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Button, Card, TextInput, Switch } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/apiClient';
import { LoadingState } from '../components/common/LoadingState';
import { AppFooter } from '../components/common/AppFooter';
import designTokens from '../design-tokens.json';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

interface ReportType {
  id: string;
  name: string;
  description: string;
}

const reportTypes: ReportType[] = [
  {
    id: 'delegation-log',
    name: 'Delegation of Authority Log',
    description: 'FDA 21 CFR Part 11 compliant delegation log',
  },
  {
    id: 'system-access',
    name: 'System Access Report',
    description: 'User access and activity report',
  },
  {
    id: 'site-trial-master',
    name: 'Site/Trial Master Report',
    description: 'Comprehensive site and trial information',
  },
  {
    id: 'permission-change',
    name: 'Permission Change Log',
    description: 'Audit trail of permission changes',
  },
  {
    id: 'deactivation',
    name: 'Deactivation Report',
    description: 'User deactivation history',
  },
];

export const ReportsScreen = () => {
  const { user } = useAuth();
  const [selectedReport, setSelectedReport] = useState(reportTypes[0].id);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [includeAuditTrail, setIncludeAuditTrail] = useState(false);
  const [generating, setGenerating] = useState(false);

  const handleGenerateReport = async () => {
    if (!selectedReport) {
      Alert.alert('Error', 'Please select a report type');
      return;
    }

    try {
      setGenerating(true);

      const reportData = {
        reportType: selectedReport,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        includeAuditTrail,
        companyId: user?.company?.id,
      };

      const response = await api.post(`/reports/${selectedReport}`, reportData);

      if (response.success && response.data) {
        const { report_id, download_url } = response.data;

        // Poll for completion
        let attempts = 0;
        const maxAttempts = 60;
        const pollInterval = 1000;

        const checkStatus = async (): Promise<boolean> => {
          const statusResponse = await api.post(`/reports/status/${report_id}`);

          if (statusResponse.success && statusResponse.data) {
            const { status } = statusResponse.data;

            if (status === 'completed') {
              return true;
            } else if (status === 'failed') {
              throw new Error('Report generation failed');
            }
          }

          return false;
        };

        while (attempts < maxAttempts) {
          const completed = await checkStatus();

          if (completed) {
            // Download the report
            const downloadResponse = await api.post(`/reports/download/${report_id}`);

            if (downloadResponse.success && downloadResponse.data?.url) {
              // Download and share the file
              const filename = `report_${selectedReport}_${Date.now()}.pdf`;
              const localUri = `${FileSystem.documentDirectory}${filename}`;

              await FileSystem.downloadAsync(downloadResponse.data.url, localUri);

              await Sharing.shareAsync(localUri, {
                mimeType: 'application/pdf',
                dialogTitle: 'Save Report',
              });

              Alert.alert('Success', 'Report generated successfully!');
              setGenerating(false);
              return;
            }
          }

          attempts++;
          await new Promise(resolve => setTimeout(resolve, pollInterval));
        }

        throw new Error('Report generation timeout');
      } else {
        throw new Error(response.error || 'Failed to generate report');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const selectedReportType = reportTypes.find(r => r.id === selectedReport);

  if (generating) {
    return <LoadingState message="Generating report..." />;
  }

  return (
    <View style={styles.wrapper}>
      <ScrollView style={styles.container}>
        <View style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.title}>Generate Report</Text>
            <Text style={styles.subtitle}>
              FDA 21 CFR Part 11 Compliant Reports
            </Text>

            <View style={styles.section}>
              <Text style={styles.label}>Report Type</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedReport}
                  onValueChange={setSelectedReport}
                  style={styles.picker}
                >
                  {reportTypes.map(type => (
                    <Picker.Item
                      key={type.id}
                      label={type.name}
                      value={type.id}
                    />
                  ))}
                </Picker>
              </View>
              {selectedReportType && (
                <Text style={styles.description}>
                  {selectedReportType.description}
                </Text>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Date Range (Optional)</Text>
              <TextInput
                label="From Date"
                value={dateFrom}
                onChangeText={setDateFrom}
                placeholder="YYYY-MM-DD"
                mode="outlined"
                style={styles.input}
              />
              <TextInput
                label="To Date"
                value={dateTo}
                onChangeText={setDateTo}
                placeholder="YYYY-MM-DD"
                mode="outlined"
                style={styles.input}
              />
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Include Audit Trail</Text>
              <Switch
                value={includeAuditTrail}
                onValueChange={setIncludeAuditTrail}
                color={designTokens.color.accent.green600}
              />
            </View>

            <Button
              mode="contained"
              onPress={handleGenerateReport}
              style={styles.button}
              buttonColor={designTokens.color.accent.green600}
              loading={generating}
              disabled={generating}
            >
              Generate Report
            </Button>
          </Card.Content>
        </Card>

        <Card style={styles.infoCard}>
          <Card.Content>
            <Text style={styles.infoTitle}>ℹ️ About Reports</Text>
            <Text style={styles.infoText}>
              All reports are generated in compliance with FDA 21 CFR Part 11 electronic records requirements.
              {'\n\n'}
              Reports include digital signatures, timestamps, and audit trails where applicable.
              {'\n\n'}
              Generated reports will be downloaded to your device and can be shared or saved.
            </Text>
          </Card.Content>
        </Card>

        </View>
      </ScrollView>
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
  content: {
    padding: designTokens.spacing.m,
  },
  card: {
    marginBottom: designTokens.spacing.m,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: designTokens.typography.fontSize.xl,
    fontWeight: '600',
    color: designTokens.color.text.heading,
    marginBottom: designTokens.spacing.xs,
  },
  subtitle: {
    fontSize: designTokens.typography.fontSize.s,
    color: designTokens.color.text.subtle,
    marginBottom: designTokens.spacing.l,
  },
  section: {
    marginBottom: designTokens.spacing.l,
  },
  label: {
    fontSize: designTokens.typography.fontSize.m,
    fontWeight: '600',
    color: designTokens.color.text.heading,
    marginBottom: designTokens.spacing.s,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: designTokens.color.border.subtle,
    borderRadius: 4,
    marginBottom: designTokens.spacing.s,
  },
  picker: {
    height: 50,
  },
  description: {
    fontSize: designTokens.typography.fontSize.s,
    color: designTokens.color.text.subtle,
    fontStyle: 'italic',
  },
  input: {
    marginBottom: designTokens.spacing.m,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: designTokens.spacing.l,
    paddingVertical: designTokens.spacing.s,
  },
  switchLabel: {
    fontSize: designTokens.typography.fontSize.m,
    color: designTokens.color.text.body,
  },
  button: {
    marginTop: designTokens.spacing.m,
  },
  infoCard: {
    backgroundColor: '#F0F9FF',
    marginBottom: designTokens.spacing.m,
  },
  infoTitle: {
    fontSize: designTokens.typography.fontSize.l,
    fontWeight: '600',
    color: designTokens.color.text.heading,
    marginBottom: designTokens.spacing.s,
  },
  infoText: {
    fontSize: designTokens.typography.fontSize.m,
    color: designTokens.color.text.body,
    lineHeight: 22,
  },
});
