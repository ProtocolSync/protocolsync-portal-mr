import type { ReactNode, CSSProperties } from 'react';
import { CCard, CCardBody, CCardHeader as CoreUICardHeader } from '@coreui/react';

interface CardProps {
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
  onClick?: () => void;
}

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

interface CardContentProps {
  children: ReactNode;
  className?: string;
}

export const Card = ({ children, style, className, onClick }: CardProps) => {
  return (
    <CCard className={className} style={style} onClick={onClick}>
      {children}
    </CCard>
  );
};

export const CardHeader = ({ children, className }: CardHeaderProps) => {
  return (
    <CoreUICardHeader className={className}>
      {children}
    </CoreUICardHeader>
  );
};

export const CardContent = ({ children, className }: CardContentProps) => {
  return (
    <CCardBody className={className}>
      {children}
    </CCardBody>
  );
};
