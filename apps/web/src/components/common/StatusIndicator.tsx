import React from 'react';

export type StatusType = 'operational' | 'stale' | 'critical' | 'info';

export interface StatusIndicatorProps {
  status: StatusType;
  label: string;
  className?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status, label, className = '' }) => {
  const dotClasses: Record<StatusType, string> = {
    operational: 'status-dot-green',
    stale: 'status-dot-amber',
    critical: 'status-dot-red',
    info: 'status-dot-blue',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider ${className}`}>
      <span className={`status-dot ${dotClasses[status]}`} />
      <span>{label}</span>
    </span>
  );
};
