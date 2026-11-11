import React from 'react';
import BackButton from './BackButton';

const PageHeader = ({
  title,
  subtitle,
  children,
  fallbackPath,
  showBack = false,
  badge,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col gap-4 border-b border-gray-100 pb-5 sm:flex-row sm:items-center sm:justify-between ${className}`}
    >
      <div className="flex items-start gap-3">
        {showBack && <BackButton fallbackPath={fallbackPath} compact />}
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-maintext sm:text-3xl">
              {title}
            </h1>
            {badge && (
              <span className="inline-flex items-center rounded-full bg-primary-light px-2.5 py-0.5 text-xs font-semibold text-primary">
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="mt-1 text-sm text-subtext">{subtitle}</p>
          )}
        </div>
      </div>

      {children && (
        <div className="flex flex-wrap items-center gap-3">
          {children}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
