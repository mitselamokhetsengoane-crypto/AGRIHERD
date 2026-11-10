import { useEffect, useState } from 'react';
import securityService from '../../services/securityService';
import { formatDate } from '../../utils/formatters';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLogs(await securityService.getAuditLogs());
      } catch (err) {
        setError(err.response?.data?.detail || 'Could not load audit logs.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = logs.filter((log) =>
    !filter ||
    (log.action || '').toLowerCase().includes(filter.toLowerCase()) ||
    (log.details || '').toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Audit Logs</h1>
        <p className="text-gray-500 mt-1">Read-only history of sensitive actions across the platform.</p>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md text-sm">{error}</div>}

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <input
          type="text"
          placeholder="Filter by action or details..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2"
        />
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="p-4 font-medium text-gray-600">Timestamp</th>
              <th className="p-4 font-medium text-gray-600">User</th>
              <th className="p-4 font-medium text-gray-600">Action</th>
              <th className="p-4 font-medium text-gray-600">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan="4" className="p-8 text-center text-gray-500">Loading audit logs...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan="4" className="p-8 text-center text-gray-500">No audit logs match your filter.</td></tr>
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
  );
};

export default AuditLogs;