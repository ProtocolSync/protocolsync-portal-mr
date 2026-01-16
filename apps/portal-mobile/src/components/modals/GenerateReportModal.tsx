import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Platform,
} from 'react-native';
import { Modal } from 'react-native';
import { TextInput as PaperTextInput, HelperText } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import designTokens from '@protocolsync/shared-styles/mobile/tokens';

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
  actionTypeFilter: string;
  siteStatusFilter: string;
  includeTrialDetails: boolean;
  trialStatusFilter: string;
  changeTypeFilter: string;
  actionFilter: string;
  includeAll: boolean;
  statusFilter: string;
}

interface GenerateReportModalProps {
  visible: boolean;
  onDismiss: () => void;
  reportCard: ReportCard | null;
  reportConfig: ReportConfig;
  onConfigChange: (config: ReportConfig) => void;
  onGenerate: () => void;
  generating: boolean;
}

export const GenerateReportModal: React.FC<GenerateReportModalProps> = ({
  visible,
  onDismiss,
  reportCard,
  reportConfig,
  onConfigChange,
  onGenerate,
  generating,
}) => {
  if (!reportCard) return null;

  const renderCommonFields = () => (
    <>
      <PaperTextInput
        label="Report Title *"
        value={reportConfig.reportTitle}
        onChangeText={(text) => onConfigChange({ ...reportConfig, reportTitle: text })}
        mode="outlined"
        style={styles.input}
        placeholder={`Report - ${new Date().toLocaleDateString()}`}
      />
      <HelperText type="info" visible={true}>
        Internal name for this report
      </HelperText>
    </>
  );

  const renderDateRangeFields = () => (
    <>
      <Text style={styles.fieldLabel}>Date Range</Text>
      <PaperTextInput
        label="From Date"
        value={reportConfig.dateFrom}
        onChangeText={(text) => onConfigChange({ ...reportConfig, dateFrom: text })}
        mode="outlined"
        style={styles.input}
        placeholder="YYYY-MM-DD"
      />
      <PaperTextInput
        label="To Date"
        value={reportConfig.dateTo}
        onChangeText={(text) => onConfigChange({ ...reportConfig, dateTo: text })}
        mode="outlined"
        style={styles.input}
        placeholder="YYYY-MM-DD"
      />
      <HelperText type="info" visible={true}>
        Leave blank for "All Time"
      </HelperText>
    </>
  );

  const renderAuditTrailSwitch = () => (
    <View style={styles.switchContainer}>
      <View style={styles.switchTextContainer}>
        <Text style={styles.switchLabel}>Include Full Audit Trail</Text>
        <Text style={styles.switchHelper}>
          Include complete record hashes for each entry. Required for FDA 21 CFR Part 11 compliance.
        </Text>
      </View>
      <Switch
        value={reportConfig.includeAuditTrail}
        onValueChange={(value) => onConfigChange({ ...reportConfig, includeAuditTrail: value })}
        trackColor={{ false: '#D1D5DB', true: designTokens.color.accent.green600 }}
        thumbColor="#FFFFFF"
      />
    </View>
  );

  const renderModalFields = () => {
    switch (reportCard.id) {
      case 'system-access':
        return (
          <>
            {renderCommonFields()}
            {renderDateRangeFields()}
            <Text style={styles.fieldLabel}>Action Type Filter</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={reportConfig.actionTypeFilter}
                onValueChange={(value) => onConfigChange({ ...reportConfig, actionTypeFilter: value })}
                style={styles.picker}
              >
                <Picker.Item label="All Actions" value="all" />
                <Picker.Item label="User Created" value="user_created" />
                <Picker.Item label="User Activated" value="user_activated" />
                <Picker.Item label="User Deactivated" value="user_deactivated" />
                <Picker.Item label="Access Granted" value="access_granted" />
                <Picker.Item label="Access Revoked" value="access_revoked" />
              </Picker>
            </View>
            {renderAuditTrailSwitch()}
          </>
        );

      case 'site-trial-master':
        return (
          <>
            {renderCommonFields()}
            <Text style={styles.fieldLabel}>Site Status Filter</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={reportConfig.siteStatusFilter}
                onValueChange={(value) => onConfigChange({ ...reportConfig, siteStatusFilter: value })}
                style={styles.picker}
              >
                <Picker.Item label="All Sites" value="all" />
                <Picker.Item label="Active Sites Only" value="active" />
                <Picker.Item label="Inactive Sites Only" value="inactive" />
              </Picker>
            </View>
            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>Include Trial Details</Text>
              <Switch
                value={reportConfig.includeTrialDetails}
                onValueChange={(value) => onConfigChange({ ...reportConfig, includeTrialDetails: value })}
                trackColor={{ false: '#D1D5DB', true: designTokens.color.accent.green600 }}
                thumbColor="#FFFFFF"
              />
            </View>
            {reportConfig.includeTrialDetails && (
              <>
                <Text style={styles.fieldLabel}>Trial Status Filter</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={reportConfig.trialStatusFilter}
                    onValueChange={(value) => onConfigChange({ ...reportConfig, trialStatusFilter: value })}
                    style={styles.picker}
                  >
                    <Picker.Item label="All Trials" value="all" />
                    <Picker.Item label="Active Trials Only" value="active" />
                    <Picker.Item label="Completed Trials Only" value="completed" />
                    <Picker.Item label="Inactive Trials Only" value="inactive" />
                  </Picker>
                </View>
              </>
            )}
          </>
        );

      case 'permission-change':
        return (
          <>
            {renderCommonFields()}
            {renderDateRangeFields()}
            <Text style={styles.fieldLabel}>Change Type Filter</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={reportConfig.changeTypeFilter}
                onValueChange={(value) => onConfigChange({ ...reportConfig, changeTypeFilter: value })}
                style={styles.picker}
              >
                <Picker.Item label="All Changes" value="all" />
                <Picker.Item label="Role Changes" value="role_change" />
                <Picker.Item label="Site Access Changes" value="site_access" />
                <Picker.Item label="Permission Updates" value="permission_update" />
              </Picker>
            </View>
            <Text style={styles.fieldLabel}>Action Filter</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={reportConfig.actionFilter}
                onValueChange={(value) => onConfigChange({ ...reportConfig, actionFilter: value })}
                style={styles.picker}
              >
                <Picker.Item label="All Actions" value="all" />
                <Picker.Item label="Granted" value="granted" />
                <Picker.Item label="Revoked" value="revoked" />
                <Picker.Item label="Modified" value="modified" />
              </Picker>
            </View>
          </>
        );

      case 'deactivation':
        return (
          <>
            {renderCommonFields()}
            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>Include All Deactivations</Text>
              <Switch
                value={reportConfig.includeAll}
                onValueChange={(value) => onConfigChange({ ...reportConfig, includeAll: value })}
                trackColor={{ false: '#D1D5DB', true: designTokens.color.accent.green600 }}
                thumbColor="#FFFFFF"
              />
            </View>
            {!reportConfig.includeAll && renderDateRangeFields()}
            <Text style={styles.fieldLabel}>Status Filter</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={reportConfig.statusFilter}
                onValueChange={(value) => onConfigChange({ ...reportConfig, statusFilter: value })}
                style={styles.picker}
              >
                <Picker.Item label="All Users" value="all" />
                <Picker.Item label="Deactivated Users" value="deactivated" />
                <Picker.Item label="Inactive Users (30+ days)" value="inactive_30" />
                <Picker.Item label="Inactive Users (60+ days)" value="inactive_60" />
                <Picker.Item label="Inactive Users (90+ days)" value="inactive_90" />
              </Picker>
            </View>
          </>
        );

      default:
        return renderCommonFields();
    }
  };

  return (
    <Modal
      visible={visible}
      onRequestClose={onDismiss}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Generate {reportCard.title}</Text>
          <TouchableOpacity onPress={onDismiss} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView style={styles.content}>
          <View style={styles.alertBox}>
            <Text style={styles.alertTitle}>FDA 21 CFR Part 11 Compliant Report</Text>
            <Text style={styles.alertText}>
              Configure your official {reportCard.title.toLowerCase()}. This document will include audit
              trails suitable for regulatory inspections.
            </Text>
          </View>

          {renderModalFields()}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            onPress={onDismiss}
            style={styles.cancelButton}
            disabled={generating}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onGenerate}
            style={[styles.generateButton, generating && styles.generateButtonDisabled]}
            disabled={generating || !reportConfig.reportTitle.trim()}
          >
            <Text style={styles.generateButtonText}>
              {generating ? 'Generating...' : 'Generate Report'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: designTokens.color.background.page,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: designTokens.spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: designTokens.color.border.subtle,
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: designTokens.color.text.heading,
    flex: 1,
  },
  closeButton: {
    padding: designTokens.spacing.s,
  },
  closeButtonText: {
    fontSize: 28,
    color: designTokens.color.text.subtle,
    lineHeight: 28,
  },
  content: {
    flex: 1,
    padding: designTokens.spacing.l,
  },
  alertBox: {
    backgroundColor: '#EBF5FF',
    borderRadius: designTokens.spacing.s,
    padding: designTokens.spacing.m,
    marginBottom: designTokens.spacing.l,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  alertTitle: {
    fontSize: designTokens.typography.fontSize.m,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: designTokens.spacing.xs,
  },
  alertText: {
    fontSize: designTokens.typography.fontSize.s,
    color: '#1E3A8A',
    lineHeight: 20,
  },
  input: {
    marginBottom: designTokens.spacing.s,
    backgroundColor: '#FFFFFF',
  },
  fieldLabel: {
    fontSize: designTokens.typography.fontSize.m,
    fontWeight: '600',
    color: designTokens.color.text.heading,
    marginBottom: designTokens.spacing.s,
    marginTop: designTokens.spacing.s,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: designTokens.color.border.subtle,
    borderRadius: 4,
    marginBottom: designTokens.spacing.m,
    backgroundColor: '#FFFFFF',
  },
  picker: {
    height: 50,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: designTokens.spacing.m,
    paddingVertical: designTokens.spacing.s,
  },
  switchTextContainer: {
    flex: 1,
    marginRight: designTokens.spacing.m,
  },
  switchLabel: {
    fontSize: designTokens.typography.fontSize.m,
    fontWeight: '600',
    color: designTokens.color.text.heading,
    marginBottom: 4,
  },
  switchHelper: {
    fontSize: designTokens.typography.fontSize.s,
    color: designTokens.color.text.subtle,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: designTokens.spacing.m,
    padding: designTokens.spacing.m,
    borderTopWidth: 1,
    borderTopColor: designTokens.color.border.subtle,
    backgroundColor: '#FFFFFF',
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: designTokens.color.border.subtle,
    backgroundColor: '#FFFFFF',
  },
  cancelButtonText: {
    fontSize: designTokens.typography.fontSize.m,
    fontWeight: '600',
    color: designTokens.color.text.body,
  },
  generateButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: designTokens.color.accent.green500,
  },
  generateButtonDisabled: {
    opacity: 0.6,
  },
  generateButtonText: {
    fontSize: designTokens.typography.fontSize.m,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
