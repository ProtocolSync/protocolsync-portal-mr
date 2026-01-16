import { CBadge } from '@coreui/react';

interface VersionBadgeProps {
  version: string | null | undefined;
  className?: string;
}

/**
 * Consistent version badge component used across all views
 * Displays protocol/document versions with consistent styling
 */
export const VersionBadge = ({ version, className = '' }: VersionBadgeProps) => {
  if (!version || version === 'N/A' || version === '') {
    return <span className="text-muted">—</span>;
  }

  // Ensure version doesn't have duplicate V prefix (e.g., VV1.0)
  const cleanVersion = version.startsWith('VV') ? version.substring(1) : version;
  
  // Add V prefix if not already present
  const displayVersion = cleanVersion.startsWith('V') ? cleanVersion : `V${cleanVersion}`;

  return (
    <CBadge
      color="primary"
      className={`text-xs font-semibold px-3 py-1 rounded-md ${className}`}
    >
      {displayVersion}
    </CBadge>
  );
};
