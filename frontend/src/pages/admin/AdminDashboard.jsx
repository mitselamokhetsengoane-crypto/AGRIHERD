import { useState, useEffect } from 'react';
import api from '../../services/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Calls the new aggregated backend endpoint
        const response = await api.get('/security/overview');
        setStats(response.data);
      } catch (error) {
        console.error("Failed to load stats", error);
        setError('Platform statistics could not be loaded.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500" role="status">Loading platform data...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Platform Overview</h1>
      {error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500">Total Users</p>
          <p className="text-3xl font-bold text-gray-900">{stats?.total_users ?? '—'}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500">Total Farms</p>
          <p className="text-3xl font-bold text-gray-900">{stats?.total_farms ?? '—'}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500">Active Farmers</p>
          <p className="text-3xl font-bold text-gray-900">{stats?.total_farmers ?? '—'}</p>
        </div>
      </div>

    </div>
  );
};

export default AdminDashboard;