import React, { useState } from 'react';
import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CButton,
  CForm,
  CFormInput,
  CFormTextarea,
  CFormLabel
} from '@coreui/react';
import type { HelpChatApiService } from '../services/helpChatApi';

interface HelpEscalationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  conversationId: number;
  userId: number;
  apiService: HelpChatApiService;
}

export const HelpEscalationModal: React.FC<HelpEscalationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  conversationId,
  userId,
  apiService
}) => {
  const [subject, setSubject] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subject.trim()) {
      setError('Subject is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await apiService.escalateToSupport({
        conversation_id: conversationId,
        user_id: userId,
        subject: subject.trim(),
        additional_info: additionalInfo.trim()
      });

      if (response.success) {
        // Reset form
        setSubject('');
        setAdditionalInfo('');
        onSuccess();
      } else {
        setError(response.error || 'Failed to create support ticket');
      }
    } catch (err) {
      console.error('Error escalating to support:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setSubject('');
      setAdditionalInfo('');
      setError(null);
      onClose();
    }
  };

  return (
    <CModal
      visible={isOpen}
      onClose={handleClose}
      backdrop="static"
      alignment="center"
    >
      <CModalHeader closeButton>
        <CModalTitle>Contact Support</CModalTitle>
      </CModalHeader>

      <CForm onSubmit={handleSubmit}>
        <CModalBody>
          <p className="text-medium-emphasis mb-4">
            Our support team will review your chat conversation and respond to you via email.
          </p>

          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          <div className="mb-3">
            <CFormLabel htmlFor="subject">
              Subject <span className="text-danger">*</span>
            </CFormLabel>
            <CFormInput
              id="subject"
              type="text"
              placeholder="Brief description of your issue"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              disabled={isSubmitting}
              maxLength={500}
            />
          </div>

          <div className="mb-3">
            <CFormLabel htmlFor="additionalInfo">
              Additional Information (Optional)
            </CFormLabel>
            <CFormTextarea
              id="additionalInfo"
              rows={4}
              placeholder="Any additional details you'd like to share..."
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              disabled={isSubmitting}
            />
            <small className="text-muted">
              The full conversation history will be included automatically.
            </small>
          </div>
        </CModalBody>

        <CModalFooter>
          <CButton color="light" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </CButton>
          <CButton color="warning" type="submit" disabled={isSubmitting || !subject.trim()}>
            {isSubmitting ? 'Sending...' : 'Send to Support'}
          </CButton>
        </CModalFooter>
      </CForm>
    </CModal>
  );
};
