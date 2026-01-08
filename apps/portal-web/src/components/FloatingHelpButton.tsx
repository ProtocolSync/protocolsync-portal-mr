import React from 'react';
import { CButton } from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilLifeRing } from '@coreui/icons';

interface FloatingHelpButtonProps {
  onClick: () => void;
}

export const FloatingHelpButton: React.FC<FloatingHelpButtonProps> = ({ onClick }) => {
  return (
    <CButton
      color="info"
      className="floating-help-button"
      onClick={onClick}
      title="Get Help"
    >
      <CIcon icon={cilLifeRing} size="lg" />
      <span className="button-text">Help</span>
    </CButton>
  );
};
