import { useCallback, useEffect, useState } from 'react';
import securityService from '../../services/securityService';
import LoadingIndicator from '../../components/common/LoadingIndicator';

const RolesPermissions = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData(await securityService.getRolePermissions());
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not load permissions.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingIndicator label="Loading role permissions..." />;

  // Group permissions by role
  const byRole = data.reduce((acc, row) => {
    acc[row.role] = acc[row.role] || [];
    acc[row.role].push(row);
    return acc;
  }, {});

  const roleLabels = { farmer: 'Farmer', buyer: 'Buyer', admin: 'Administrator' };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Roles &amp; Permissions</h1>
          <p className="text-gray-500 mt-1">Database-backed permissions. Account status and farm ownership are always enforced by the backend.</p>
        </div>
        <button type="button" onClick={load} disabled={loading}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60">
          Refresh
        </button>
      </div>

      {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      {data.length === 0 && !error ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
          <span>
            No role permissions were returned from the database. Apply
            {' '}<code>database/migrations/012_admin_dashboard_and_product_images.sql</code>
            {' '}after the existing migrations, then refresh.
          </span>
          <button type="button" onClick={load} className="font-semibold underline">Retry</button>
        </div>
      ) : data.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Object.keys(byRole).map((role) => (
            <div key={role} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-bold text-primary mb-3">{roleLabels[role] || role}</h3>
              <ul className="text-sm text-gray-600 space-y-2">
                {byRole[role].map((perm) => (
                  <li key={perm.id} className="flex items-center justify-between gap-3">
                    <span>
                      <span className={perm.permission === 'allowed' ? 'font-medium text-green-700' : 'font-medium text-gray-500'}>
                        {perm.permission === 'allowed' ? 'Allowed' : 'Restricted'}
                      </span>
                      {' — '}{perm.module}: {perm.action}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default RolesPermissions;