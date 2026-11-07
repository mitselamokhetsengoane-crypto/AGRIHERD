import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import aiService from '../../services/aiService';
import { formatDate } from '../../utils/formatters';

const ScanHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await aiService.getScanHistory();
        setHistory(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (loading) return <div className="p-8 text-center text-subtext">Loading history...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-maintext">Scan History</h1>
        <Link to="/disease-scanner" className="text-primary hover:underline text-sm">Back to Scanner</Link>
      </div>

      {history.length === 0 ? (
        <div className="bg-white p-8 text-center rounded-xl shadow-sm border border-gray-100">
          <p className="text-subtext">No previous scans found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {history.map((scan) => (
            <div key={scan.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="h-40 bg-gray-100 rounded-md mb-4 overflow-hidden">
                {scan.image_url && <img src={scan.image_url} alt="Scan" className="w-full h-full object-cover" />}
              </div>
              <h3 className="font-bold text-maintext">{scan.detected_disease || 'Healthy'}</h3>
              <p className="text-sm text-subtext mb-2">{formatDate(scan.created_at)}</p>
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs font-semibold bg-background text-primary px-2 py-1 rounded">
                  {scan.confidence ? `${(scan.confidence * 100).toFixed(0)}% Conf.` : 'N/A'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ScanHistory;