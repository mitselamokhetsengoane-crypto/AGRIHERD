import { useCallback, useState, useEffect } from 'react';
import securityService from '../../services/securityService';
import LoadingIndicator from '../../components/common/LoadingIndicator';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setStats(await securityService.getOverview());
    } catch (err) {
      setError(err.response?.data?.detail || 'Platform statistics could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  if (loading) return <LoadingIndicator label="Loading platform data..." />;

  const totalUsers = stats?.total_users ?? 0;
  const farmerShare = totalUsers ? Math.round((stats.total_farmers / totalUsers) * 100) : 0;
  const buyerShare = totalUsers ? Math.round((stats.total_buyers / totalUsers) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Platform Overview</h1>
        <button type="button" onClick={fetchStats} disabled={loading}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60">
          Refresh
        </button>
      </div>
      {error && <p className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500">Total Users</p>
          <p className="text-3xl font-bold text-gray-900">{stats ? stats.total_users : '—'}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500">Total Farms</p>
          <p className="text-3xl font-bold text-gray-900">{stats ? stats.total_farms : '—'}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500">Farmers</p>
          <p className="text-3xl font-bold text-gray-900">{stats ? stats.total_farmers : '—'}</p>
          {stats && <>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100" role="progressbar" aria-label="Farmers as a share of users" aria-valuenow={farmerShare} aria-valuemin="0" aria-valuemax="100">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${farmerShare}%` }} />
            </div>
            <p className="mt-1 text-xs text-gray-500">{farmerShare}% of users</p>
          </>}
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500">Buyers</p>
          <p className="text-3xl font-bold text-gray-900">{stats ? stats.total_buyers : '—'}</p>
          {stats && <>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100" role="progressbar" aria-label="Buyers as a share of users" aria-valuenow={buyerShare} aria-valuemin="0" aria-valuemax="100">
              <div className="h-full rounded-full bg-secondary transition-all" style={{ width: `${buyerShare}%` }} />
            </div>
            <p className="mt-1 text-xs text-gray-500">{buyerShare}% of users</p>
          </>}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;