import React from 'react';
import { CBadge } from '@coreui/react';
import type { HelpMessageSource } from '../types';

interface HelpSourceCitationProps {
  source: HelpMessageSource;
}

export const HelpSourceCitation: React.FC<HelpSourceCitationProps> = ({ source }) => {
  const getSourceLabel = () => {
    if (source.source_type === 'quick_start_guide') {
      return source.section_title || 'Quick Start Guide';
    } else if (source.source_type === 'protocol') {
      let label = source.document_name || 'Protocol';
      if (source.document_version) {
        label += ` V${source.document_version}`;
      }
      if (source.page_number) {
        label += `, Page ${source.page_number}`;
      }
      if (source.section_title) {
        label += ` - ${source.section_title}`;
      }
      return label;
    }
    return 'Help Documentation';
  };

  const getSourceColor = () => {
    switch (source.source_type) {
      case 'quick_start_guide':
        return 'info';
      case 'protocol':
        return 'success';
      default:
        return 'secondary';
    }
  };

  const similarityPercentage = Math.round(source.similarity_score * 100);

  return (
    <div className="source-citation d-flex align-items-center gap-2 mb-2">
      <CBadge color={getSourceColor()} className="source-badge">
        {source.source_type === 'quick_start_guide' ? '📚' : '📄'}
      </CBadge>
      <div className="source-details flex-grow-1">
        <small className="source-label d-block">{getSourceLabel()}</small>
        <small className="source-relevance text-muted">
          {similarityPercentage}% relevant
        </small>
      </div>
    </div>
  );
};
