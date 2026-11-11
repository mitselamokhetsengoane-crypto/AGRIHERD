import React from 'react';
import LoadingIndicator from '../common/LoadingIndicator';
import EmptyState from '../common/EmptyState';

const ChartCard = ({
  title,
  subtitle,
  children,
  action,
  loading = false,
  isEmpty = false,
  emptyMessage = 'No chart data available yet.',
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition hover:shadow-md ${className}`}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-gray-50 pb-3">
        <div>
          <h3 className="text-base font-bold text-maintext">{title}</h3>
          {subtitle && <p className="text-xs text-subtext mt-0.5">{subtitle}</p>}
        </div>
        {action && <div className="flex items-center gap-2">{action}</div>}
      </div>

      <div className="relative flex-1 min-h-[260px] flex items-center justify-center">
        {loading ? (
          <LoadingIndicator label="Loading chart..." />
        ) : isEmpty ? (
          <EmptyState
            title="No Data Available"
            description={emptyMessage}
            compact
          />
        ) : (
          <div className="w-full h-full min-h-[260px]">{children}</div>
        )}
      </div>
    </div>
  );
};

export default ChartCard;
