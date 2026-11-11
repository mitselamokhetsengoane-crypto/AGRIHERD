import { useCallback, useEffect, useMemo, useState } from 'react';
import blockchainService from '../../services/blockchainService';
import { formatDate } from '../../utils/formatters';
import LoadingIndicator from '../../components/common/LoadingIndicator';

const AdminBlockchain = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [chainStatus, setChainStatus] = useState(null);
  const [verifyingChain, setVerifyingChain] = useState(false);

  const loadRecords = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setRecords(await blockchainService.getTransactions());
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not load blockchain records.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadRecords(); }, [loadRecords]);

  const handleVerifyChain = async () => {
    setVerifyingChain(true);
    try {
      const res = await blockchainService.verifyChain();
      setChainStatus(res);
    } catch (err) {
      setChainStatus({ status: 'ERROR', verified: false, message: 'Could not connect to the chain' });
    } finally {
      setVerifyingChain(false);
    }
  };

  if (loading) return <LoadingIndicator label="Loading blockchain records..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Blockchain Ledger</h1>
          <p className="mt-1 text-gray-500">Verify the integrity of the custom permissioned hash-chain.</p>
        </div>
        <button type="button" onClick={loadRecords} disabled={loading}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60">
          Refresh Records
        </button>
      </div>

      {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <div className="grid gap-5 md:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Records loaded</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{error ? '—' : records.length}</p>
        </div>
        <div className={`rounded-xl border p-6 shadow-sm ${chainStatus?.verified ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white'}`}>
          <p className="text-sm text-gray-500">Chain Integrity</p>
          <p className={`mt-2 text-xl font-bold ${chainStatus?.verified ? 'text-green-700' : 'text-gray-900'}`}>
            {chainStatus ? chainStatus.status : 'Not Checked'}
          </p>
          <p className="text-xs text-gray-500 mt-1">{chainStatus ? chainStatus.message : 'Click to verify the entire chain'}</p>
          
          <button
            onClick={handleVerifyChain}
            disabled={verifyingChain}
            className="mt-4 w-full bg-gray-800 text-white py-2 rounded-md text-sm font-medium hover:bg-gray-900 disabled:opacity-60"
          >
            {verifyingChain ? 'Checking Chain...' : 'Verify Chain Integrity'}
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="p-4 text-sm font-semibold text-gray-600">Created</th>
                <th className="p-4 text-sm font-semibold text-gray-600">Type</th>
                <th className="p-4 text-sm font-semibold text-gray-600">Record Ref</th>
                <th className="p-4 text-sm font-semibold text-gray-600">Tx Hash</th>
                <th className="p-4 text-sm font-semibold text-gray-600">Block</th>
                <th className="p-4 text-sm font-semibold text-gray-600">Network</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {records.length === 0 ? (
                <tr><td colSpan="6" className="p-8 text-center text-sm text-gray-500">
                  {error ? 'Blockchain records could not be loaded.' : 'No blockchain records are stored in the database.'}
                </td></tr>
              ) : records.map((record) => (
                <tr key={record.id}>
                  <td className="whitespace-nowrap p-4 text-sm text-gray-600">{formatDate(record.created_at)}</td>
                  <td className="p-4 text-sm font-medium text-gray-800">{record.record_type || '—'}</td>
                  <td className="p-4 font-mono text-xs text-gray-600">{record.record_ref ? record.record_ref.slice(0, 8) + '...' : '—'}</td>
                  <td className="max-w-xs break-all p-4 font-mono text-xs text-gray-600">{record.transaction_hash ? record.transaction_hash.slice(0, 16) + '...' : '—'}</td>
                  <td className="p-4 text-sm text-gray-600">{record.block_number ?? '—'}</td>
                  <td className="p-4 text-sm text-gray-600">{record.network || 'Not recorded'}</td>
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