import React from 'react';

const statusStyles = {
  // Positive / Healthy / Active
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  healthy: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  harvested: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'in stock': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  verified: 'bg-emerald-50 text-emerald-700 border-emerald-200',

  // Warning / In Progress / Pending
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  growing: 'bg-amber-50 text-amber-700 border-amber-200',
  'in progress': 'bg-blue-50 text-blue-700 border-blue-200',
  accepted: 'bg-blue-50 text-blue-700 border-blue-200',
  preparing: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  ready: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  'low stock': 'bg-amber-50 text-amber-800 border-amber-200',

  // Error / Sick / Inactive / Cancelled
  sick: 'bg-red-50 text-red-700 border-red-200',
  injured: 'bg-red-50 text-red-700 border-red-200',
  quarantine: 'bg-rose-50 text-rose-700 border-rose-200',
  error: 'bg-red-50 text-red-700 border-red-200',
  failed: 'bg-red-50 text-red-700 border-red-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
  suspended: 'bg-red-50 text-red-700 border-red-200',
  deactivated: 'bg-gray-100 text-gray-700 border-gray-200',
  'out of stock': 'bg-red-50 text-red-700 border-red-200',
  overdue: 'bg-red-50 text-red-700 border-red-200',
};

const StatusBadge = ({ status, size = 'sm', className = '' }) => {
  if (!status) return null;

  const normalized = String(status).toLowerCase();
  const matchedClass = statusStyles[normalized] || 'bg-gray-50 text-gray-700 border-gray-200';

  const sizeClasses = {
    xs: 'px-2 py-0.5 text-[11px]',
    sm: 'px-2.5 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  }[size] || 'px-2.5 py-0.5 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-semibold tracking-wide capitalize ${sizeClasses} ${matchedClass} ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {status}
    </span>
  );
};

export default StatusBadge;
