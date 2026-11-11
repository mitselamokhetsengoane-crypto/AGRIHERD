import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

const ErrorMessage = ({
  message = 'An unexpected error occurred. Please try again.',
  onRetry,
  className = '',
}) => {
  return (
    <div
      role="alert"
      className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50/80 p-4 text-sm text-red-700 shadow-sm ${className}`}
    >
      <div className="flex items-center gap-2.5">
        <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
        <span className="font-medium">{message}</span>
      </div>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 shadow-sm transition hover:bg-red-100 hover:text-red-800"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Retry
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
