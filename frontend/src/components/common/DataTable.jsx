import React from 'react';
import EmptyState from './EmptyState';

const DataTable = ({
  columns,
  data = [],
  emptyTitle = 'No records found',
  emptyMessage = 'There are no items to display in this table.',
  emptyActionText,
  emptyActionLink,
  onEmptyAction,
  className = '',
  loading = false,
}) => {
  return (
    <div
      className={`overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm ${className}`}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/70">
              {columns.map((col, index) => (
                <th
                  key={index}
                  className={`px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-subtext ${
                    col.align === 'right'
                      ? 'text-right'
                      : col.align === 'center'
                      ? 'text-center'
                      : 'text-left'
                  } ${col.headerClassName || ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="p-6">
                  <EmptyState
                    title={emptyTitle}
                    description={emptyMessage}
                    actionText={emptyActionText}
                    actionLink={emptyActionLink}
                    onAction={onEmptyAction}
                    compact
                  />
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <tr
                  key={row.id || rowIndex}
                  className="transition-colors hover:bg-emerald-50/20"
                >
                  {columns.map((col, colIndex) => (
                    <td
                      key={colIndex}
                      className={`px-4 py-3.5 text-maintext ${
                        col.align === 'right'
                          ? 'text-right'
                          : col.align === 'center'
                          ? 'text-center'
                          : 'text-left'
                      } ${col.className || ''}`}
                    >
                      {col.render ? col.render(row, rowIndex) : row[col.accessor]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;
