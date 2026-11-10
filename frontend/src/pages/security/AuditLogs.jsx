import { useCallback, useEffect, useState } from 'react';
import securityService from '../../services/securityService';
import { formatDate } from '../../utils/formatters';
import LoadingIndicator from '../../components/common/LoadingIndicator';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setLogs(await securityService.getAuditLogs());
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not load audit logs.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = logs.filter((log) =>
    !filter ||
    (log.action || '').toLowerCase().includes(filter.toLowerCase()) ||
    (log.details || '').toLowerCase().includes(filter.toLowerCase()) ||
    (log.user_id || '').toLowerCase().includes(filter.toLowerCase())
  );

  if (loading) return <LoadingIndicator label="Loading audit logs..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Audit Logs</h1>
        <p className="text-gray-500 mt-1">Read-only history of sensitive actions across the platform.</p>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md text-sm">{error}</div>}

      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <label htmlFor="audit-filter" className="text-sm font-medium text-gray-700">Filter audit logs</label>
        <input
          id="audit-filter"
          type="search"
          placeholder="Search action, details, or user ID"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        {filter && <button type="button" onClick={() => setFilter('')} className="text-sm font-medium text-primary hover:underline">Clear filter</button>}
        <button type="button" onClick={load} disabled={loading}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60">
          Refresh
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="p-4 font-medium text-gray-600">Timestamp</th>
                <th className="p-4 font-medium text-gray-600">User</th>
                <th className="p-4 font-medium text-gray-600">Action</th>
                <th className="p-4 font-medium text-gray-600">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr><td colSpan="4" className="p-8 text-center text-gray-500">
                  {error ? 'Audit logs could not be loaded.' : logs.length === 0 ? 'No audit logs are stored in the database.' : 'No audit logs match your filter.'}
                </td></tr>
              ) : (
                filtered.map((log) => (
                  <tr key={log.id}>
                    <td className="p-4 text-sm text-gray-500">{formatDate(log.created_at)}</td>
                    <td className="p-4 text-sm text-gray-800 font-mono">{log.user_id ? log.user_id.slice(0, 8) : '—'}</td>
                    <td className="p-4 text-sm font-medium text-gray-800">{log.action}</td>
                    <td className="p-4 text-sm text-gray-600">{log.details || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;