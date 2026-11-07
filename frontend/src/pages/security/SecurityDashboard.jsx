import { useState, useEffect } from 'react';
import securityService from '../../services/securityService';

const SecurityDashboard = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        // Assume securityService has a getAuditLogs function
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
      <h1 className="text-2xl font-bold text-gray-800">Security Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">System Status</h3>
          <p className="text-xl font-bold text-green-600 mt-2">Healthy</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">Recent Audit Events</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">{logs.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">Security Policies</h3>
          <p className="text-xl font-bold text-gray-900 mt-2">Active</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent System Activity</h3>
        {loading ? (
          <p className="text-gray-500">Loading activity...</p>
        ) : (
          <ul className="space-y-3">
            {logs.slice(0, 5).map((log) => (
              <li key={log.id} className="text-sm text-gray-600 border-b pb-2">
                <span className="font-semibold text-gray-800">{log.user_id}</span> - {log.action}
              </li>
            ))}
            {logs.length === 0 && <li className="text-gray-500">No recent activity.</li>}
          </ul>
        )}
      </div>
    </div>
  );
};

export default SecurityDashboard;