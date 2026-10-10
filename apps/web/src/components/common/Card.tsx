import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return <div className={`aegis-card ${className}`}>{children}</div>;
};

export interface CardHeaderProps {
  title: string;
  badge?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ title, badge, action, className = '' }) => {
  return (
    <div className={`aegis-card-header ${className}`}>
      <div className="flex items-center gap-2">
        <span className="text-title-md">{title}</span>
        {badge}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
};

export interface CardBodyProps {
  children: React.ReactNode;
  className?: string;
}

export const CardBody: React.FC<CardBodyProps> = ({ children, className = '' }) => {
  return <div className={`aegis-card-body ${className}`}>{children}</div>;
};

export interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const CardFooter: React.FC<CardFooterProps> = ({ children, className = '' }) => {
  return <div className={`aegis-card-footer ${className}`}>{children}</div>;
};
