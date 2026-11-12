import { useCallback, useEffect, useState } from 'react';
import securityService from '../../services/securityService';
import api from '../../services/api'; // Needed for the new call
import { getErrorMessage } from '../../services/api';
import LoadingIndicator from '../../components/common/LoadingIndicator';

const AdminAIDashboard = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);
  const [serviceStatus, setServiceStatus] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [predictionError, setPredictionError] = useState('');
  const [predictionsLoading, setPredictionsLoading] = useState(true);

  // NEW: State for real AI model metrics
  const [modelMetrics, setModelMetrics] = useState(null);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [metricsError, setMetricsError] = useState('');

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

  const loadPredictions = useCallback(async () => {
    setPredictionsLoading(true);
    setPredictionError('');
    try {
      setPredictions(await securityService.getAdminAIPredictions());
    } catch (err) {
      setPredictionError(getErrorMessage(err, 'Could not load prediction history.'));
    } finally {
      setPredictionsLoading(false);
    }
  }, []);

  // NEW: Load the real metrics from the database
  const loadModelMetrics = useCallback(async () => {
    setMetricsLoading(true);
    setMetricsError('');
    try {
      const res = await api.get('/ai-sales/models');
      setModelMetrics(res.data);
    } catch (err) {
      setMetricsError(err.response?.data?.detail || 'Could not load AI model metrics from the database.');
    } finally {
      setMetricsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSummary();
    loadPredictions();
    loadModelMetrics(); // NEW
  }, [loadPredictions, loadSummary, loadModelMetrics]);

  const checkService = useCallback(async () => {
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
  }, []);

  useEffect(() => { checkService(); }, [checkService]);

  if (loading) return <LoadingIndicator label="Loading AI dashboard..." />;
  const modelVersion = predictions.find((scan) => scan.prediction?.model_version)?.prediction.model_version
    || summary?.model_version;

  return (
    <div className="space-y-8">
      {/* ==========================================
          SECTION 1: SALES AI MODEL METRICS (REAL DATA)
          ========================================== */}
      <section className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Sales AI Monitoring</h1>
            <p className="mt-1 text-gray-500">Live metrics loaded from the database.</p>
          </div>
          <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-800">
            ACTIVE MODEL
          </span>
        </div>

        {/* Loading & Error States for Metrics */}
        {metricsLoading && <div className="p-4 text-sm text-gray-500">Loading model metrics...</div>}
        {metricsError && <div role="alert" className="p-4 rounded-lg border border-amber-200 bg-amber-50 text-sm text-amber-800">{metricsError}</div>}

        {/* Only show metrics if data is loaded */}
        {!metricsLoading && modelMetrics && (
          <>
            <div className="grid gap-5 md:grid-cols-3">
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <p className="text-sm text-gray-500">Model Algorithm</p>
                <p className="mt-2 text-xl font-bold text-gray-900">{modelMetrics.model_name}</p>
                <p className="text-xs text-gray-500 mt-1">Version: {modelMetrics.version}</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <p className="text-sm text-gray-500">R-Squared (R²) Accuracy</p>
                <p className="mt-2 text-3xl font-bold text-primary">{modelMetrics.r2_score}</p>
                <p className="text-xs text-gray-500 mt-1">Explains {Number(modelMetrics.r2_score) * 100}% of sales variance</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <p className="text-sm text-gray-500">Mean Absolute Error (MAE)</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{modelMetrics.mae}</p>
                <p className="text-xs text-gray-500 mt-1">Average prediction error in units</p>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <p className="text-sm text-gray-500">Training Dataset Size</p>
                <p className="mt-2 text-xl font-bold text-gray-900">{modelMetrics.dataset_size.toLocaleString()} records</p>
                <p className="text-xs text-gray-500 mt-1">Synthetic data with price & seasonality</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <p className="text-sm text-gray-500">RMSE</p>
                <p className="mt-2 text-xl font-bold text-gray-900">{modelMetrics.rmse}</p>
                <p className="text-xs text-gray-500 mt-1">Root Mean Squared Error</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <p className="text-sm text-gray-500">Last Trained</p>
                <p className="mt-2 text-xl font-bold text-gray-900">
                  {new Date(modelMetrics.training_date).toLocaleDateString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">Colab notebook: agriherd_sales_model.pkl</p>
              </div>
            </div>
          </>
        )}

        {/* Algorithm Comparison Table - This can remain static as it shows historical training data */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 p-6">
            <h2 className="font-semibold text-gray-800">Algorithm Comparison (Historical Training Data)</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-6 py-3 font-semibold">Model</th>
                  <th className="px-6 py-3 font-semibold">MAE</th>
                  <th className="px-6 py-3 font-semibold">RMSE</th>
                  <th className="px-6 py-3 font-semibold">R² Score</th>
                  <th className="px-6 py-3 font-semibold">Verdict</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="px-6 py-3 text-gray-800">Linear Regression</td>
                  <td className="px-6 py-3 text-gray-600">10.75</td>
                  <td className="px-6 py-3 text-gray-600">13.66</td>
                  <td className="px-6 py-3 text-gray-600">0.35</td>
                  <td className="px-6 py-3 text-red-600 font-medium">Poor</td>
                </tr>
                <tr>
                  <td className="px-6 py-3 text-gray-800">Decision Tree</td>
                  <td className="px-6 py-3 text-gray-600">3.68</td>
                  <td className="px-6 py-3 text-gray-600">4.55</td>
                  <td className="px-6 py-3 text-gray-600">0.93</td>
                  <td className="px-6 py-3 text-amber-600 font-medium">Good</td>
                </tr>
                <tr className="bg-green-50">
                  <td className="px-6 py-3 font-bold text-primary">Random Forest</td>
                  <td className="px-6 py-3 font-bold text-primary">2.82</td>
                  <td className="px-6 py-3 font-bold text-primary">3.43</td>
                  <td className="px-6 py-3 font-bold text-primary">0.96</td>
                  <td className="px-6 py-3 font-bold text-primary">Best (Deployed)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ==========================================
          SECTION 2: DISEASE SCANNER (EXISTING)
          ========================================== */}
      <section className="space-y-6 border-t border-gray-200 pt-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Disease Scanner Monitoring</h1>
            <p className="mt-1 text-gray-500">Stored prediction history, reported model metadata and live service status.</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => { loadSummary(); loadPredictions(); }} disabled={loading || predictionsLoading}
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

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">Disease scans recorded</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">{summary ? summary.disease_scan_count : '—'}</p>
            <p className="mt-2 text-xs text-gray-500">Total scan rows in the database.</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">Model version</p>
            <p className="mt-2 text-xl font-semibold text-gray-900">{modelVersion || 'Not stored'}</p>
            <p className="mt-2 text-xs text-gray-500">Shown only when present in stored prediction metadata.</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">Evaluation metrics</p>
            <p className="mt-2 text-xl font-semibold text-gray-900">{summary?.evaluation_metrics ? 'Available' : 'Not available'}</p>
            <p className="mt-2 text-xs text-gray-500">No evaluation metrics are stored.</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">Last training date</p>
            <p className="mt-2 text-xl font-semibold text-gray-900">{summary?.last_training_date || 'Not stored'}</p>
          </div>
        </div>

        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 p-6">
            <h2 className="font-semibold text-gray-800">Recent prediction history</h2>
          </div>
          {predictionError && <p role="alert" className="p-5 text-sm text-red-700">{predictionError}</p>}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Prediction</th>
                  <th className="px-4 py-3 font-semibold">Confidence</th>
                  <th className="px-4 py-3 font-semibold">Model version</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {predictionsLoading ? (
                  <tr><td colSpan="4" className="p-6 text-center text-gray-500">Loading stored predictions...</td></tr>
                ) : predictions.length === 0 ? (
                  <tr><td colSpan="4" className="p-6 text-center text-gray-500">No prediction history is stored.</td></tr>
                ) : predictions.map((scan) => (
                  <tr key={scan.id}>
                    <td className="px-4 py-3 text-gray-600">{scan.created_at ? new Date(scan.created_at).toLocaleString() : 'Not recorded'}</td>
                    <td className="px-4 py-3 text-gray-800">{scan.detected_disease || 'No detection recorded'}</td>
                    <td className="px-4 py-3 text-gray-600">{scan.confidence == null ? 'Not recorded' : `${(Number(scan.confidence) * 100).toFixed(1)}%`}</td>
                    <td className="px-4 py-3 text-gray-600">{scan.prediction?.model_version || 'Not stored'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-gray-800">Service availability</h2>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            The AI model runs as a separate service and may take time to wake after inactivity. Use “Check AI service”
            to test it; disease scans remain unavailable while that service is offline.
          </p>
        </div>
      </section>
    </div>
  );
};

export default AdminAIDashboard;