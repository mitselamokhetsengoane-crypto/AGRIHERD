import { useCallback, useEffect, useState } from 'react';
import securityService from '../../services/securityService';
import { getErrorMessage } from '../../services/api';

const FarmManagement = () => {
  const [farms, setFarms] = useState([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadFarms = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await securityService.getFarms({
        q: query || undefined,
        status: status || undefined,
        page,
        page_size: 25,
      });
      setFarms(result.items);
      setTotal(result.total);
    } catch (requestError) {
      console.error('Failed to load farms', requestError);
      setError(getErrorMessage(requestError, 'Farm records could not be loaded.'));
    } finally {
      setLoading(false);
    }
  }, [page, query, status]);

  useEffect(() => {
    loadFarms();
  }, [loadFarms]);

  const updateQuery = (value) => {
    setPage(1);
    setQuery(value);
  };

  const updateStatus = (value) => {
    setPage(1);
    setStatus(value);
  };

  const pageCount = Math.max(1, Math.ceil(total / 25));

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Farm Management</h1>
          <p className="mt-1 text-sm text-gray-500">Review registered farms across the platform.</p>
        </div>
        <button type="button" onClick={loadFarms} disabled={loading}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60">
          {loading ? 'Refreshing...' : 'Refresh farms'}
        </button>
      </div>

      <div className="flex flex-wrap gap-3 rounded-lg border border-gray-200 bg-white p-4">
        <label className="min-w-[220px] flex-1 text-sm font-medium text-gray-700">
          Search farms or owners
          <input type="search" value={query} onChange={(event) => updateQuery(event.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 font-normal"
            placeholder="Farm, location, or owner name" />
        </label>
        <label className="text-sm font-medium text-gray-700">
          Status
          <select value={status} onChange={(event) => updateStatus(event.target.value)}
            className="mt-1 block rounded-md border border-gray-300 bg-white px-3 py-2 font-normal">
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
          </select>
        </label>
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
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-gray-600">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">Farm</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Location</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Owner</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Registered</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Livestock</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Crops</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan="7" className="px-4 py-8 text-center text-gray-500">Loading farm records...</td></tr>
                ) : farms.length ? (
                  farms.map((farm) => (
                    <tr key={farm.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{farm.farmName}</td>
                      <td className="px-4 py-3 text-gray-600">{farm.location || 'Not provided'}</td>
                      <td className="px-4 py-3 text-gray-600">{farm.ownerName}</td>
                      <td className="px-4 py-3 capitalize text-gray-600">{farm.status || 'Not set'}</td>
                      <td className="px-4 py-3 text-gray-600">{farm.registeredAt ? new Date(farm.registeredAt).toLocaleDateString() : 'Not recorded'}</td>
                      <td className="px-4 py-3 text-gray-600">{farm.livestockCount}</td>
                      <td className="px-4 py-3 text-gray-600">{farm.cropCount}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="7" className="px-4 py-8 text-center text-gray-500">No farms match this search.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>{total} farm{total === 1 ? '' : 's'} found</span>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page <= 1 || loading} className="rounded border border-gray-300 px-3 py-1 disabled:opacity-50">
            Previous
          </button>
          <span>Page {page} of {pageCount}</span>
          <button type="button" onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
            disabled={page >= pageCount || loading} className="rounded border border-gray-300 px-3 py-1 disabled:opacity-50">
            Next
          </button>
        </div>
      </div>
    </section>
  );
};

export default FarmManagement;