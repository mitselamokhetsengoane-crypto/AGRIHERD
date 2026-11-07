import { useState, useEffect } from 'react';
import securityService from '../../services/securityService';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const data = await securityService.getAuditLogs();
        setLogs(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Audit Logs</h1>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="p-4 font-medium text-gray-600">Timestamp</th>
              <th className="p-4 font-medium text-gray-600">User ID</th>
              <th className="p-4 font-medium text-gray-600">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan="3" className="p-4 text-center">Loading logs...</td></tr>
            ) : (
              logs.map(log => (
                <tr key={log.id}>
                  <td className="p-4 text-sm text-gray-500">{new Date(log.created_at).toLocaleString()}</td>
                  <td className="p-4 text-sm text-gray-800">{log.user_id}</td>
                  <td className="p-4 text-sm text-gray-600">{log.action}</td>
                </tr>
              ))
            )}
            {logs.length === 0 && !loading && (
              <tr><td colSpan="3" className="p-4 text-center text-gray-500">No audit logs found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuditLogs;