import { CContainer } from '@coreui/react';
import { type ReactNode } from 'react';

interface AppContentProps {
  children: ReactNode;
}

export const AppContent = ({ children }: AppContentProps) => {
  return (
    <CContainer lg className="px-4 py-4 flex-grow-1">
      {children}
    </CContainer>
  );
};
