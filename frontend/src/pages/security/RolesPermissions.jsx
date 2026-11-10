import { useEffect, useState } from 'react';
import securityService from '../../services/securityService';

const RolesPermissions = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setData(await securityService.getRolePermissions());
      } catch (err) {
        setError(err.response?.data?.detail || 'Could not load permissions.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading permissions...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;

  const byRole = data.reduce((acc, row) => {
    acc[row.role] = acc[row.role] || [];
    acc[row.role].push(row);
    return acc;
  }, {});

  const roleLabels = { farmer: 'Farmer', buyer: 'Buyer', admin: 'Administrator' };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Roles &amp; Permissions</h1>
        <p className="text-gray-500 mt-1">The permission matrix is loaded from the database and defines what each role can read and write.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.keys(byRole).map((role) => (
          <div key={role} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-primary mb-3">{roleLabels[role] || role}</h3>
            <ul className="text-sm text-gray-600 space-y-2">
              {byRole[role].map((perm) => (
                <li key={perm.id}>
                  <span className={perm.permission === 'allowed' ? 'font-medium text-green-700' : 'font-medium text-gray-500'}>
                    {perm.permission === 'allowed' ? 'Allowed' : 'Restricted'}
                  </span>
                  {' — '}{perm.action}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RolesPermissions;