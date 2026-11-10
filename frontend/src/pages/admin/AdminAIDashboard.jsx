import { useCallback, useEffect, useState } from 'react';
import securityService from '../../services/securityService';
import { getErrorMessage } from '../../services/api';
import LoadingIndicator from '../../components/common/LoadingIndicator';

const AdminAIDashboard = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);
  const [serviceStatus, setServiceStatus] = useState(null);

  const loadSummary = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setSummary(await securityService.getAdminAISummary());
    } catch (err) {
      setError(getErrorMessage(err, 'Could not load AI dashboard data.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSummary(); }, [loadSummary]);

  const checkService = async () => {
    setChecking(true);
    setServiceStatus(null);
    try {
      const result = await securityService.checkAdminAIService();
      setServiceStatus(result.status === 'awake'
        ? { available: true, message: 'The AI service is responding.' }
        : { available: false, message: result.message || 'The AI service is not configured or is unavailable.' });
    } catch (err) {
      setServiceStatus({ available: false, message: getErrorMessage(err, 'The AI service could not be reached.') });
    } finally {
      setChecking(false);
    }
  };

  if (loading) return <LoadingIndicator label="Loading AI dashboard..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">AI Service Dashboard</h1>
          <p className="mt-1 text-gray-500">Database-backed scan totals and live service status.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={loadSummary} disabled={loading}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60">
            Refresh data
          </button>
          <button type="button" onClick={checkService} disabled={checking}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-green-800 disabled:opacity-60">
            {checking ? 'Checking...' : 'Check AI service'}
          </button>
        </div>
      </div>

      {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      {serviceStatus && (
        <div role="status" className={`rounded-lg border p-4 text-sm ${serviceStatus.available ? 'border-green-200 bg-green-50 text-green-800' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
          {serviceStatus.message}
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Disease scans recorded</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{summary ? summary.disease_scan_count : '—'}</p>
          <p className="mt-2 text-xs text-gray-500">Total scan rows in the database.</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Model version</p>
          <p className="mt-2 text-xl font-semibold text-gray-900">{summary?.model_version || 'Not reported'}</p>
          <p className="mt-2 text-xs text-gray-500">Model metadata is not currently published by the AI service.</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Evaluation metrics</p>
          <p className="mt-2 text-xl font-semibold text-gray-900">{summary?.evaluation_metrics ? 'Available' : 'Not available'}</p>
          <p className="mt-2 text-xs text-gray-500">Evaluation metrics are not currently reported by the AI service.</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="font-semibold text-gray-800">Service availability</h2>
        <p className="mt-2 text-sm leading-6 text-gray-600">
          The AI model runs as a separate service and may take time to wake after inactivity. Use “Check AI service”
          to test it; disease scans remain unavailable while that service is offline.
        </p>
      </div>
    </div>
  );
};

export default AdminAIDashboard;
