import React from 'react';
import { Link } from 'react-router-dom';
import AppIcon from './AppIcon';
import { PackageOpen } from 'lucide-react';

const EmptyState = ({
  icon,
  iconName,
  title = 'No records found',
  description = 'There are currently no items to display.',
  actionText,
  actionLink,
  onAction,
  compact = false,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${
        compact ? 'p-6' : 'p-10 rounded-2xl border border-dashed border-gray-200 bg-white shadow-sm'
      } ${className}`}
    >
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50 text-subtext">
        {icon ? (
          icon
        ) : iconName ? (
          <AppIcon name={iconName} className="h-7 w-7 text-subtext" />
        ) : (
          <PackageOpen className="h-7 w-7 text-subtext" strokeWidth={1.5} />
        )}
      </div>

      <h4 className="text-base font-semibold text-maintext">{title}</h4>
      {description && (
        <p className="mt-1 max-w-sm text-xs sm:text-sm text-subtext leading-relaxed">
          {description}
        </p>
      )}

      {(actionText && (actionLink || onAction)) && (
        <div className="mt-4">
          {actionLink ? (
            <Link
              to={actionLink}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-primary-hover"
            >
              {actionText}
            </Link>
          ) : (
            <button
              type="button"
              onClick={onAction}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-primary-hover"
            >
              {actionText}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
