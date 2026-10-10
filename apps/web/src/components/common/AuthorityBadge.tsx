import React from 'react';
import type { AuthorityRole } from '../../types';

export interface AuthorityBadgeProps {
  role: AuthorityRole;
  className?: string;
}

export const AuthorityBadge: React.FC<AuthorityBadgeProps> = ({ role, className = '' }) => {
  const configs: Record<AuthorityRole, { label: string; styleClass: string; title: string }> = {
    SRC_KSEOC: {
      label: 'State relief commissioner (KSEOC)',
      styleClass: 'authority-badge-state',
      title: 'State Relief Commissioner / State Emergency Operations Centre',
    },
    DISTRICT_COLLECTOR: {
      label: 'District collector (DDMA)',
      styleClass: 'authority-badge-district',
      title: 'District Collector & District Disaster Management Authority',
    },
    TAHSILDAR: {
      label: 'Tahsildar (Taluk incident commander)',
      styleClass: 'authority-badge-taluk',
      title: 'Taluk Revenue & Operational Incident Commander',
    },
    HAZARD_ANALYST: {
      label: 'Planning section (Hazard analyst)',
      styleClass: 'authority-badge-advisory',
      title: 'Scientific & Hazard Modeling Section',
    },
    OPERATIONS_OFFICER: {
      label: 'Operations section chief',
      styleClass: 'authority-badge-district',
      title: 'Incident Operations & Convoy Coordination',
    },
    LOGISTICS_OFFICER: {
      label: 'Logistics section chief',
      styleClass: 'authority-badge-district',
      title: 'Relief Supply & Shelter Logistics',
    },
    HEALTH_OFFICER: {
      label: 'Health & medical safety officer',
      styleClass: 'authority-badge-district',
      title: 'Medical Triage & Disease Surveillance',
    },
    FIELD_OFFICER: {
      label: 'Field officer (Ground verification)',
      styleClass: 'authority-badge-field',
      title: 'Village Officer / On-Scene Ground Observer',
    },
    PUBLIC: {
      label: 'Public advisory view',
      styleClass: 'authority-badge-advisory',
      title: 'Public Citizen Portal',
    },
    AEGIS_ADVISORY: {
      label: 'AEGIS advisory (Decision support)',
      styleClass: 'authority-badge-advisory',
      title: 'Algorithmic Decision-Support Recommendation (Requires Human Approval)',
    },
  };

  const config = configs[role] || {
    label: role,
    styleClass: 'authority-badge-advisory',
    title: role,
  };

  return (
    <span
      className={`authority-badge ${config.styleClass} ${className}`}
      title={config.title}
    >
      {config.label}
    </span>
  );
};

export default AuthorityBadge;
