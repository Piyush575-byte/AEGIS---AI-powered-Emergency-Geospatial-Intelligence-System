import React from 'react';
import type { AuthorityRole } from '../../types';

export interface AuthorityBadgeProps {
  role: AuthorityRole;
  className?: string;
}

export const AuthorityBadge: React.FC<AuthorityBadgeProps> = ({ role, className = '' }) => {
  const configs: Record<AuthorityRole, { label: string; styleClass: string; title: string }> = {
    SRC_KSEOC: {
      label: 'SRC / KSEOC (State Authority)',
      styleClass: 'authority-badge-state',
      title: 'State Relief Commissioner / State Emergency Operations Centre',
    },
    DISTRICT_COLLECTOR: {
      label: 'Collector / DDMA (District Executive)',
      styleClass: 'authority-badge-district',
      title: 'District Collector & District Disaster Management Authority',
    },
    TAHSILDAR: {
      label: 'Tahsildar (Taluk Incident Commander)',
      styleClass: 'authority-badge-taluk',
      title: 'Taluk Revenue & Operational Incident Commander',
    },
    HAZARD_ANALYST: {
      label: 'Planning Section (Hazard Analyst)',
      styleClass: 'authority-badge-advisory',
      title: 'Scientific & Hazard Modeling Section',
    },
    OPERATIONS_OFFICER: {
      label: 'Operations Section Chief',
      styleClass: 'authority-badge-district',
      title: 'Incident Operations & Convoy Coordination',
    },
    LOGISTICS_OFFICER: {
      label: 'Logistics Section Chief',
      styleClass: 'authority-badge-district',
      title: 'Relief Supply & Shelter Logistics',
    },
    HEALTH_OFFICER: {
      label: 'Health & Medical Safety Officer',
      styleClass: 'authority-badge-district',
      title: 'Medical Triage & Disease Surveillance',
    },
    FIELD_OFFICER: {
      label: 'Field Officer (Ground Verification)',
      styleClass: 'authority-badge-field',
      title: 'Village Officer / On-Scene Ground Observer',
    },
    PUBLIC: {
      label: 'Public Advisory View',
      styleClass: 'authority-badge-advisory',
      title: 'Public Citizen Portal',
    },
    AEGIS_ADVISORY: {
      label: 'AEGIS Advisory (Decision Support)',
      styleClass: 'authority-badge-advisory',
      title: 'Algorithmic Decision-Support Recommendation (Requires Human Approval)',
    },
  };

  const { label, styleClass, title } = configs[role];

  return (
    <span className={`authority-badge ${styleClass} ${className}`} title={title}>
      {label}
    </span>
  );
};
