import { useCallback, useEffect, useMemo, useState } from 'react';
import securityService from '../../services/securityService';
import { getErrorMessage } from '../../services/api';
import { formatDate } from '../../utils/formatters';
import LoadingIndicator from '../../components/common/LoadingIndicator';

const AdminBlockchain = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');

  const loadRecords = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setRecords(await securityService.getAdminBlockchain());
    } catch (err) {
      setError(getErrorMessage(err, 'Could not load blockchain records.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadRecords(); }, [loadRecords]);

  const filteredRecords = useMemo(() => {
    const query = filter.trim().toLowerCase();
    if (!query) return records;
    return records.filter((record) =>
      [record.record_type, record.record_ref, record.record_hash, record.transaction_hash]
        .some((value) => String(value || '').toLowerCase().includes(query))
    );
  }, [records, filter]);

  if (loading) return <LoadingIndicator label="Loading blockchain records..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Blockchain Records</h1>
          <p className="mt-1 text-gray-500">Recent blockchain references stored in the database.</p>
        </div>
        <button type="button" onClick={loadRecords} disabled={loading}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60">
          Refresh records
        </button>
      </div>

      {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <div className="grid gap-5 md:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Records loaded</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{error ? '—' : records.length}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Latest block number</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {records.find((record) => record.block_number != null)?.block_number ?? '—'}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <label htmlFor="blockchain-filter" className="text-sm font-medium text-gray-700">Filter records</label>
        <input id="blockchain-filter" type="search" value={filter} onChange={(event) => setFilter(event.target.value)}
          placeholder="Type, record ID, or transaction hash"
          className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-green-100" />
        {filter && <button type="button" onClick={() => setFilter('')} className="text-sm font-medium text-primary hover:underline">Clear</button>}
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="p-4 text-sm font-semibold text-gray-600">Created</th>
                <th className="p-4 text-sm font-semibold text-gray-600">Type</th>
                <th className="p-4 text-sm font-semibold text-gray-600">Record reference</th>
                <th className="p-4 text-sm font-semibold text-gray-600">Transaction hash</th>
                <th className="p-4 text-sm font-semibold text-gray-600">Block</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredRecords.length === 0 ? (
                <tr><td colSpan="5" className="p-8 text-center text-sm text-gray-500">
                  {error ? 'Blockchain records could not be loaded.' : records.length === 0 ? 'No blockchain records are stored in the database.' : 'No blockchain records match this filter.'}
                </td></tr>
              ) : filteredRecords.map((record) => (
                <tr key={record.id}>
                  <td className="whitespace-nowrap p-4 text-sm text-gray-600">{formatDate(record.created_at)}</td>
                  <td className="p-4 text-sm font-medium text-gray-800">{record.record_type || '—'}</td>
                  <td className="p-4 font-mono text-xs text-gray-600">{record.record_ref || '—'}</td>
                  <td className="max-w-xs break-all p-4 font-mono text-xs text-gray-600">{record.transaction_hash || '—'}</td>
                  <td className="p-4 text-sm text-gray-600">{record.block_number ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminBlockchain;
