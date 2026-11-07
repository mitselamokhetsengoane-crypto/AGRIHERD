import { useCallback, useEffect, useState } from 'react';
import securityService from '../../services/securityService';

const FarmManagement = () => {
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadFarms = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setFarms(await securityService.getFarms());
    } catch (requestError) {
      console.error('Failed to load farms', requestError);
      setError('Farm records could not be loaded. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFarms();
  }, [loadFarms]);

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Farm Management</h1>
          <p className="mt-1 text-sm text-gray-500">Review registered farms across the platform.</p>
        </div>
        <button
          type="button"
          onClick={loadFarms}
          disabled={loading}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Refreshing...' : 'Refresh farms'}
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        {error ? (
          <div className="p-6 text-center">
            <p role="alert" className="text-sm text-red-700">{error}</p>
            <button type="button" onClick={loadFarms} className="mt-3 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-green-800">
              Try again
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-gray-600">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">Farm</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Location</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Size</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Owner ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan="4" className="px-4 py-8 text-center text-gray-500">Loading farm records...</td></tr>
                ) : farms.length ? (
                  farms.map((farm) => (
                    <tr key={farm.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{farm.farm_name}</td>
                      <td className="px-4 py-3 text-gray-600">{farm.location || 'Not provided'}</td>
                      <td className="px-4 py-3 text-gray-600">{farm.size_hectares == null ? 'Not provided' : `${farm.size_hectares} ha`}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{farm.owner_id}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="4" className="px-4 py-8 text-center text-gray-500">No farms have been registered yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
};

export default FarmManagement;
