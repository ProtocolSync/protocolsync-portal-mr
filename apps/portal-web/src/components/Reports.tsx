import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Title } from 'react-admin';
import {
  CCard,
  CCardBody,
  CCardText,
  CCardTitle,
  CButton,
  CRow,
  CCol,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CFormLabel,
  CFormInput,
  CFormSelect,
  CAlert
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import {
  cilClipboard,
  cilLockLocked,
  cilBuilding,
  cilPeople,
  cilUserUnfollow
} from '@coreui/icons';
import { useUser } from '../contexts/UserContext';
import { useReportGeneration } from '../hooks/useReportGeneration';
import type { ReportType } from '../types/reports';

export const Reports = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const { generateReport, isGenerating } = useReportGeneration();

  const [activeReport, setActiveReport] = useState<ReportType | null>(null);
  const [reportConfig, setReportConfig] = useState({
    reportTitle: '',
    dateFrom: '',
    dateTo: '',
    includeAuditTrail: true,
    // System Access specific
    actionTypeFilter: 'all',
    // Site/Trial Master specific
    siteStatusFilter: 'all',
    includeTrialDetails: true,
    trialStatusFilter: 'all',
    // Permission Change specific
    changeTypeFilter: 'all',
    actionFilter: 'all',
    // Deactivation specific
    includeAll: false,
    statusFilter: 'all'
  });

  const reportCards = [
    {
      id: 'delegation-log' as ReportType,
      title: 'Delegation of Authority Log',
      description: 'View and generate DOA logs for protocol delegations',
      icon: cilClipboard,
      route: '/delegation-log',
      color: 'primary'
    },
    {
      id: 'system-access' as ReportType,
      title: 'System Access Report',
      description: 'Track user access grants and deactivations',
      icon: cilLockLocked,
      color: 'info'
    },
    {
      id: 'site-trial-master' as ReportType,
      title: 'Site/Trial Master Report',
      description: 'High-level overview of sites and trials',
      icon: cilBuilding,
      color: 'success'
    },
    {
      id: 'permission-change' as ReportType,
      title: 'Permission Change Log',
      description: 'Audit trail of role and permission changes',
      icon: cilPeople,
      color: 'warning'
    },
    {
      id: 'deactivation' as ReportType,
      title: 'Deactivation Report',
      description: 'List of deactivated and inactive users',
      icon: cilUserUnfollow,
      color: 'danger'
    }
  ];

  const handleCardClick = (card: typeof reportCards[0]) => {
    if (card.route) {
      navigate(card.route);
    } else {
      setActiveReport(card.id);
      setReportConfig({
        ...reportConfig,
        reportTitle: `${card.title} - ${new Date().toLocaleDateString()}`
      });
    }
  };

  const handleGenerateReport = async () => {
    if (!user?.id || !activeReport) return;

    await generateReport(activeReport, parseInt(user.id), reportConfig);
    setActiveReport(null);
  };

  const renderModalFields = () => {
    if (!activeReport) return null;

    const commonFields = (
      <>
        <div className="mb-3">
          <CFormLabel className="fw-semibold">Report Title *</CFormLabel>
          <CFormInput
            type="text"
            value={reportConfig.reportTitle}
            onChange={(e) => setReportConfig({ ...reportConfig, reportTitle: e.target.value })}
            placeholder={`Report - ${new Date().toLocaleDateString()}`}
            required
          />
          <small className="text-muted">Internal name for this report</small>
        </div>
      </>
    );

    const dateRangeFields = (
      <div className="mb-3">
        <CFormLabel className="fw-semibold">Date Range</CFormLabel>
        <div className="d-flex gap-2">
          <div className="flex-fill">
            <CFormLabel className="small">From</CFormLabel>
            <CFormInput
              type="date"
              value={reportConfig.dateFrom}
              onChange={(e) => setReportConfig({ ...reportConfig, dateFrom: e.target.value })}
            />
          </div>
          <div className="flex-fill">
            <CFormLabel className="small">To</CFormLabel>
            <CFormInput
              type="date"
              value={reportConfig.dateTo}
              onChange={(e) => setReportConfig({ ...reportConfig, dateTo: e.target.value })}
            />
          </div>
        </div>
        <small className="text-muted">Leave blank for "All Time"</small>
      </div>
    );

    const auditTrailCheckbox = (
      <div className="mb-3">
        <div className="form-check">
          <input
            className="form-check-input"
            type="checkbox"
            id="includeAuditTrail"
            checked={reportConfig.includeAuditTrail}
            onChange={(e) => setReportConfig({ ...reportConfig, includeAuditTrail: e.target.checked })}
          />
          <label className="form-check-label fw-semibold" htmlFor="includeAuditTrail">
            Include Full Audit Trail
          </label>
          <div className="small text-muted ms-4">
            Include complete record hashes for each entry.
            <strong className="text-warning"> Required for FDA 21 CFR Part 11 compliance.</strong>
          </div>
        </div>
      </div>
    );

    switch (activeReport) {
      case 'system-access':
        return (
          <>
            {commonFields}
            {dateRangeFields}
            <div className="mb-3">
              <CFormLabel className="fw-semibold">Action Type Filter</CFormLabel>
              <CFormSelect
                value={reportConfig.actionTypeFilter}
                onChange={(e) => setReportConfig({ ...reportConfig, actionTypeFilter: e.target.value })}
              >
                <option value="all">All Actions</option>
                <option value="user_created">User Created</option>
                <option value="user_activated">User Activated</option>
                <option value="user_deactivated">User Deactivated</option>
                <option value="access_granted">Access Granted</option>
                <option value="access_revoked">Access Revoked</option>
              </CFormSelect>
            </div>
            {auditTrailCheckbox}
          </>
        );

      case 'site-trial-master':
        return (
          <>
            {commonFields}
            <div className="mb-3">
              <CFormLabel className="fw-semibold">Site Status Filter</CFormLabel>
              <CFormSelect
                value={reportConfig.siteStatusFilter}
                onChange={(e) => setReportConfig({ ...reportConfig, siteStatusFilter: e.target.value })}
              >
                <option value="all">All Sites</option>
                <option value="active">Active Sites Only</option>
                <option value="inactive">Inactive Sites Only</option>
              </CFormSelect>
            </div>
            <div className="mb-3">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="includeTrialDetails"
                  checked={reportConfig.includeTrialDetails}
                  onChange={(e) => setReportConfig({ ...reportConfig, includeTrialDetails: e.target.checked })}
                />
                <label className="form-check-label" htmlFor="includeTrialDetails">
                  Include Trial Details
                </label>
              </div>
            </div>
            {reportConfig.includeTrialDetails && (
              <div className="mb-3">
                <CFormLabel className="fw-semibold">Trial Status Filter</CFormLabel>
                <CFormSelect
                  value={reportConfig.trialStatusFilter}
                  onChange={(e) => setReportConfig({ ...reportConfig, trialStatusFilter: e.target.value })}
                >
                  <option value="all">All Trials</option>
                  <option value="active">Active Trials Only</option>
                  <option value="paused">Paused Trials Only</option>
                  <option value="completed">Completed Trials Only</option>
                  <option value="closed">Closed Trials Only</option>
                </CFormSelect>
              </div>
            )}
          </>
        );

      case 'permission-change':
        return (
          <>
            {commonFields}
            {dateRangeFields}
            <div className="mb-3">
              <CFormLabel className="fw-semibold">Change Type Filter</CFormLabel>
              <CFormSelect
                value={reportConfig.changeTypeFilter}
                onChange={(e) => setReportConfig({ ...reportConfig, changeTypeFilter: e.target.value })}
              >
                <option value="all">All Changes</option>
                <option value="site_permission">Site Permissions Only</option>
                <option value="trial_permission">Trial Permissions Only</option>
              </CFormSelect>
            </div>
            <div className="mb-3">
              <CFormLabel className="fw-semibold">Action Filter</CFormLabel>
              <CFormSelect
                value={reportConfig.actionFilter}
                onChange={(e) => setReportConfig({ ...reportConfig, actionFilter: e.target.value })}
              >
                <option value="all">All Actions</option>
                <option value="assigned">Assigned</option>
                <option value="removed">Removed</option>
                <option value="role_changed">Role Changed</option>
              </CFormSelect>
            </div>
          </>
        );

      case 'deactivation':
        return (
          <>
            {commonFields}
            <div className="mb-3">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="includeAll"
                  checked={reportConfig.includeAll}
                  onChange={(e) => setReportConfig({ ...reportConfig, includeAll: e.target.checked })}
                />
                <label className="form-check-label fw-semibold" htmlFor="includeAll">
                  Include All Time (Ignore Date Range)
                </label>
              </div>
            </div>
            {!reportConfig.includeAll && dateRangeFields}
            <div className="mb-3">
              <CFormLabel className="fw-semibold">Status Filter</CFormLabel>
              <CFormSelect
                value={reportConfig.statusFilter}
                onChange={(e) => setReportConfig({ ...reportConfig, statusFilter: e.target.value })}
              >
                <option value="all">All Statuses</option>
                <option value="deactivated">Deactivated Users Only</option>
                <option value="inactive">Inactive Users Only</option>
              </CFormSelect>
            </div>
          </>
        );

      default:
        return commonFields;
    }
  };

  const activeCard = reportCards.find(c => c.id === activeReport);

  return (
    <div className="p-3">
      <Title title="Reports" />

      <div className="mb-4">
        <h4>FDA 21 CFR Part 11 Compliant Reports</h4>
        <p className="text-muted">Generate and download audit trail reports for compliance</p>
      </div>

      <CRow>
        {reportCards.map((card) => (
          <CCol md={6} lg={4} key={card.id} className="mb-4">
            <CCard>
              <CCardBody>
                <div className="d-flex align-items-center mb-3">
                  <CIcon icon={card.icon} size="xl" className={`text-${card.color} me-3`} />
                  <CCardTitle className="mb-0">{card.title}</CCardTitle>
                </div>
                <CCardText className="small text-muted">{card.description}</CCardText>
                <CButton
                  color={card.color}
                  variant="outline"
                  onClick={() => handleCardClick(card)}
                  className="mt-2"
                >
                  {card.route ? 'View' : 'Generate'}
                </CButton>
              </CCardBody>
            </CCard>
          </CCol>
        ))}
      </CRow>

      {/* Report Generation Modal */}
      <CModal visible={!!activeReport} onClose={() => setActiveReport(null)} size="lg">
        <CModalHeader>
          <CModalTitle>Generate {activeCard?.title}</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CAlert color="info">
            <strong>FDA 21 CFR Part 11 Compliant Report</strong>
            <div className="small mt-1">
              Configure your official {activeCard?.title.toLowerCase()}. This document will include
              audit trails suitable for regulatory inspections.
            </div>
          </CAlert>

          {renderModalFields()}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setActiveReport(null)} disabled={isGenerating}>
            Cancel
          </CButton>
          <CButton
            color={activeCard?.color || 'primary'}
            onClick={handleGenerateReport}
            disabled={isGenerating || !reportConfig.reportTitle}
          >
            {isGenerating ? 'Generating...' : 'Generate Report'}
          </CButton>
        </CModalFooter>
      </CModal>
    </div>
  );
};
