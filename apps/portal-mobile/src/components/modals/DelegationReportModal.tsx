import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import designTokens from '../../design-tokens.json';
import type { DelegationReportConfig } from '@protocolsync/shared-services';

interface DelegationReportModalProps {
  visible: boolean;
  onClose: () => void;
  onGenerate: (config: DelegationReportConfig) => Promise<void>;
  protocolVersions: any[];
  siteUsers: any[];
}

export const DelegationReportModal: React.FC<DelegationReportModalProps> = ({
  visible,
  onClose,
  onGenerate,
  protocolVersions,
  siteUsers,
}) => {
  const [generating, setGenerating] = useState(false);
  const [config, setConfig] = useState<DelegationReportConfig>({
    reportTitle: `Delegation Log - ${new Date().toLocaleDateString()}`,
    scopeFilter: 'current',
    dateFrom: '',
    dateTo: '',
    protocolId: '',
    userFilter: '',
    includeAuditTrail: true,
    reportFormat: 'pdf-signed',
  });

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      await onGenerate(config);
      onClose();
    } catch (error) {
      console.error('[DelegationReportModal] Error:', error);
      Alert.alert('Error', 'Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>📊 Generate Delegation Report</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView style={styles.content}>
          {/* Info Box */}
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>FDA 21 CFR Part 11 Compliant Report</Text>
            <Text style={styles.infoText}>
              Configure your official delegation log report. This document will include electronic
              signatures and audit trails suitable for regulatory inspections.
            </Text>
          </View>

          {/* Report Title */}
          <View style={styles.field}>
            <Text style={styles.label}>Report Title / Name *</Text>
            <TextInput
              style={styles.input}
              value={config.reportTitle}
              onChangeText={(text) => setConfig({ ...config, reportTitle: text })}
              placeholder="Delegation Log - 1/11/2026"
              placeholderTextColor={designTokens.color.text.subtle}
            />
            <Text style={styles.helpText}>
              Internal name for this report (e.g., "FDA Audit Q3 2025", "Protocol VV4.0 Delegation
              Log")
            </Text>
          </View>

          {/* Scope Filter */}
          <View style={styles.field}>
            <Text style={styles.label}>Scope Filter</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={config.scopeFilter}
                onValueChange={(value) => setConfig({ ...config, scopeFilter: value as any })}
                style={styles.picker}
              >
                <Picker.Item label="Current View/Filters Applied" value="current" />
                <Picker.Item label="All Delegations" value="all" />
                <Picker.Item label="Active Delegations Only" value="active" />
                <Picker.Item label="Pending Delegations Only" value="pending" />
                <Picker.Item label="Signed Delegations Only" value="signed" />
                <Picker.Item label="Revoked Delegations Only" value="revoked" />
              </Picker>
            </View>
            <Text style={styles.helpText}>Defines which delegations are included in the report</Text>
          </View>

          {/* Date Range */}
          <View style={styles.field}>
            <Text style={styles.label}>Date Range</Text>
            <View style={styles.dateRow}>
              <View style={styles.dateField}>
                <Text style={styles.dateLabel}>From</Text>
                <TextInput
                  style={styles.input}
                  value={config.dateFrom}
                  onChangeText={(text) => setConfig({ ...config, dateFrom: text })}
                  placeholder="mm/dd/yyyy"
                  placeholderTextColor={designTokens.color.text.subtle}
                />
              </View>
              <View style={styles.dateField}>
                <Text style={styles.dateLabel}>To</Text>
                <TextInput
                  style={styles.input}
                  value={config.dateTo}
                  onChangeText={(text) => setConfig({ ...config, dateTo: text })}
                  placeholder="mm/dd/yyyy"
                  placeholderTextColor={designTokens.color.text.subtle}
                />
              </View>
            </View>
            <Text style={styles.helpText}>
              Defines the period covered by the report. Leave blank for "All Time"
            </Text>
          </View>

          {/* Protocol Filter */}
          <View style={styles.field}>
            <Text style={styles.label}>Protocol Filter</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={config.protocolId}
                onValueChange={(value) => setConfig({ ...config, protocolId: value })}
                style={styles.picker}
              >
                <Picker.Item label="All Protocols" value="" />
                {protocolVersions.map((pv) => (
                  <Picker.Item
                    key={pv.version_id || pv.id}
                    label={`${pv.protocol_name || pv.display_name} - ${pv.version_number || pv.current_status}`}
                    value={String(pv.version_id || pv.id)}
                  />
                ))}
              </Picker>
            </View>
            <Text style={styles.helpText}>Optional: Filter by specific protocol version</Text>
          </View>

          {/* User Filter */}
          <View style={styles.field}>
            <Text style={styles.label}>User Filter</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={config.userFilter}
                onValueChange={(value) => setConfig({ ...config, userFilter: value })}
                style={styles.picker}
              >
                <Picker.Item label="All Users" value="" />
                {siteUsers.map((su) => (
                  <Picker.Item
                    key={su.user_id || su.id}
                    label={`${su.full_name || su.name} (${su.email})`}
                    value={String(su.user_id || su.id)}
                  />
                ))}
              </Picker>
            </View>
            <Text style={styles.helpText}>Optional: Filter by specific delegated user</Text>
          </View>

          {/* Include Audit Trail */}
          <View style={styles.field}>
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() =>
                setConfig({ ...config, includeAuditTrail: !config.includeAuditTrail })
              }
            >
              <View style={styles.checkbox}>
                {config.includeAuditTrail && <View style={styles.checkboxSelected} />}
              </View>
              <View style={styles.checkboxTextContainer}>
                <Text style={styles.checkboxLabel}>Include Full Audit Trail</Text>
                <Text style={styles.checkboxSubtext}>
                  Include complete e-signature audit trail for each delegation.{' '}
                  <Text style={styles.requiredText}>Required for FDA 21 CFR Part 11 compliance.</Text>
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Report Format */}
          <View style={styles.field}>
            <Text style={styles.label}>Report Format</Text>
            <View style={styles.radioGroup}>
              <TouchableOpacity
                style={styles.radioOption}
                onPress={() => setConfig({ ...config, reportFormat: 'pdf-signed' })}
              >
                <View style={styles.radio}>
                  {config.reportFormat === 'pdf-signed' && <View style={styles.radioSelected} />}
                </View>
                <View style={styles.radioTextContainer}>
                  <Text style={styles.radioLabel}>PDF (Signed) - Recommended for regulatory audits</Text>
                  <Text style={styles.radioSubtext}>Includes digital signature and tamper-evident seal</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.radioOption}
                onPress={() => setConfig({ ...config, reportFormat: 'pdf' })}
              >
                <View style={styles.radio}>
                  {config.reportFormat === 'pdf' && <View style={styles.radioSelected} />}
                </View>
                <View style={styles.radioTextContainer}>
                  <Text style={styles.radioLabel}>PDF (Standard) - Printable document</Text>
                  <Text style={styles.radioSubtext}>No digital signature, suitable for internal use</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.radioOption}
                onPress={() => setConfig({ ...config, reportFormat: 'csv' })}
              >
                <View style={styles.radio}>
                  {config.reportFormat === 'csv' && <View style={styles.radioSelected} />}
                </View>
                <View style={styles.radioTextContainer}>
                  <Text style={styles.radioLabel}>CSV (Excel) - Data export</Text>
                  <Text style={styles.radioSubtext}>Raw data for analysis, not suitable for regulatory submission</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={onClose}
            disabled={generating}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.generateButton, generating && styles.buttonDisabled]}
            onPress={handleGenerate}
            disabled={generating}
          >
            {generating ? (
              <>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={styles.generateButtonText}> Generating...</Text>
              </>
            ) : (
              <Text style={styles.generateButtonText}>Generate Report</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: designTokens.spacing.l,
    borderBottomWidth: 1,
    borderBottomColor: designTokens.color.border.subtle,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: designTokens.color.text.heading,
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 28,
    color: designTokens.color.text.subtle,
  },
  content: {
    flex: 1,
    padding: designTokens.spacing.l,
  },
  infoBox: {
    backgroundColor: '#DBEAFE',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#1E3A8A',
    lineHeight: 20,
  },
  field: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: designTokens.color.text.heading,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: designTokens.color.border.subtle,
    borderRadius: 6,
    padding: 12,
    fontSize: 14,
    color: designTokens.color.text.body,
  },
  helpText: {
    fontSize: 12,
    color: designTokens.color.text.subtle,
    marginTop: 4,
  },
  radioGroup: {
    gap: 12,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: designTokens.color.accent.green500,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: designTokens.color.accent.green500,
  },
  radioLabel: {
    fontSize: 14,
    color: designTokens.color.text.body,
    flex: 1,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateField: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: designTokens.color.text.subtle,
    marginBottom: 4,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: designTokens.color.accent.green500,
    marginRight: 12,
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    width: 12,
    height: 12,
    borderRadius: 2,
    backgroundColor: designTokens.color.accent.green500,
  },
  checkboxLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: designTokens.color.text.body,
    marginBottom: 4,
  },
  checkboxTextContainer: {
    flex: 1,
  },
  checkboxSubtext: {
    fontSize: 12,
    color: designTokens.color.text.subtle,
    lineHeight: 18,
  },
  requiredText: {
    color: '#F59E0B',
    fontWeight: '600',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: designTokens.color.border.subtle,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
  },
  picker: {
    height: 50,
  },
  radioTextContainer: {
    flex: 1,
  },
  radioSubtext: {
    fontSize: 12,
    color: designTokens.color.text.subtle,
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    padding: designTokens.spacing.l,
    borderTopWidth: 1,
    borderTopColor: designTokens.color.border.subtle,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  cancelButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: designTokens.color.border.subtle,
  },
  cancelButtonText: {
    color: designTokens.color.text.body,
    fontSize: 16,
    fontWeight: '600',
  },
  generateButton: {
    backgroundColor: designTokens.color.accent.green500,
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
