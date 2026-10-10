import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  icon,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const variantClass = `aegis-btn-${variant}`;
  const sizeClass = size === 'sm' ? 'aegis-btn-sm' : size === 'lg' ? 'px-4 py-2 text-sm' : '';
  const widthClass = fullWidth ? 'aegis-btn-full' : '';

  return (
    <button
      className={`aegis-btn ${variantClass} ${sizeClass} ${widthClass} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="inline-flex shrink-0">{icon}</span>}
      <span>{children}</span>
    </button>
  );
};
