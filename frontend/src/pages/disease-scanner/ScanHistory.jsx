import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import aiService from '../../services/aiService';
import { formatDate } from '../../utils/formatters';

const ScanHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await aiService.getScanHistory();
        setHistory(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load history:', err);
        setError(err?.response?.data?.detail || err?.message || 'Could not load history.');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (loading) return <div className="p-8 text-center text-subtext">Loading history...</div>;

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">{error}</div>
        <div className="mt-4">
          <Link to="/app/disease-scanner" className="text-primary hover:underline text-sm">← Back to Scanner</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-maintext">Scan History</h1>
        <Link to="/app/disease-scanner" className="text-primary hover:underline text-sm">Back to Scanner</Link>
      </div>

      {history.length === 0 ? (
        <div className="bg-white p-8 text-center rounded-xl shadow-sm border border-gray-100">
          <p className="text-subtext">No previous scans found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {history.map((scan) => {
            const conf = typeof scan.confidence === 'number'
              ? `${(scan.confidence * 100).toFixed(0)}% Conf.`
              : 'N/A';

            return (
              <div key={scan.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="h-40 bg-gray-100 rounded-md mb-4 overflow-hidden flex items-center justify-center">
                  {scan.image_url ? (
                    <img
                      src={scan.image_url}
                      alt={scan.detected_disease || 'Scan'}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-subtext text-sm">
                      No image
                    </div>
                  )}
                </div>

                <h3 className="font-bold text-maintext">
                  {scan.detected_disease || 'No disease detected'}
                </h3>
                <p className="text-sm text-subtext mb-2">{formatDate(scan.created_at)}</p>

                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs font-semibold bg-background text-primary px-2 py-1 rounded">
                    {conf}
                  </span>
                  <Link
                    to={`/app/disease-scanner/results/${encodeURIComponent(scan.id)}`}
                    className="text-primary hover:underline text-sm"
                  >
                    View results
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ScanHistory;