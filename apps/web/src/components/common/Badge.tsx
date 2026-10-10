import React from 'react';
import type { RiskLevel, DataClassification } from '../../types';

export interface RiskBadgeProps {
  level: RiskLevel;
  children: React.ReactNode;
  className?: string;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level, children, className = '' }) => {
  return (
    <span className={`aegis-badge aegis-badge-${level} ${className}`}>
      {level === 'critical' && '● '}
      {level === 'high' && '▲ '}
      {level === 'warning' && '⚠ '}
      {level === 'safe' && '✓ '}
      {level === 'info' && 'ℹ '}
      {children}
    </span>
  );
};

export interface DataSemanticBadgeProps {
  type: DataClassification;
  className?: string;
}

export const DataSemanticBadge: React.FC<DataSemanticBadgeProps> = ({ type, className = '' }) => {
  const configs: Record<DataClassification, { label: string; styleClass: string }> = {
    SOURCE_DATA: { label: 'SOURCE DATA', styleClass: 'aegis-badge-source' },
    DERIVED_DATA: { label: 'DERIVED DATA', styleClass: 'aegis-badge-derived' },
    AEGIS_RECOMMENDATION: { label: 'AEGIS ADVISORY', styleClass: 'aegis-badge-aegis' },
    DEMO_DATA: { label: 'DEMO / SIMULATION', styleClass: 'aegis-badge-demo' },
  };

  const { label, styleClass } = configs[type];

  return (
    <span className={`aegis-badge ${styleClass} ${className}`}>
      {label}
    </span>
  );
};
