import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import aiService from '../../services/aiService';

const ScanResults = () => {
  const { scanId } = useParams();
  const [scan, setScan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const s = await aiService.getScanResult(scanId);
        if (active) setScan(s);
      } catch (err) {
        if (active) {
          setError(err?.response?.data?.detail || err?.message || 'Could not load scan.');
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [scanId]);

  if (loading) return <div className="p-8 text-center text-subtext">Loading scan results...</div>;
  if (error || !scan) {
    return (
      <div className="p-8 text-center text-error">
        {error || 'Scan not found.'}{' '}
        <Link to="/app/disease-scanner" className="underline">Go back</Link>
      </div>
    );
  }

  const prediction = scan.prediction || {};
  const detections = Array.isArray(prediction.detections) ? prediction.detections : [];
  const hasPrediction = ['completed', 'no_detection'].includes(prediction.status);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-maintext">Scan Results</h1>
        <Link to="/app/disease-scanner" className="text-primary hover:underline text-sm">Scan Another</Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col md:flex-row">
        <div className="md:w-1/2 bg-gray-100 flex items-center justify-center p-4">
          {scan.image_url ? (
            <img src={scan.image_url} alt="Scanned crop" className="max-h-80 object-contain" />
          ) : (
            <p className="text-sm text-subtext">Original image is not available.</p>
          )}
        </div>

        <div className="md:w-1/2 p-6 space-y-4">
          <h2 className="text-lg font-bold text-maintext border-b pb-2">Detected Issues</h2>
          {detections.length === 0 ? (
            <p className="text-primary font-medium">
              {hasPrediction
                ? (prediction.message || 'No diseases were detected in this image.')
                : 'Detailed prediction data is unavailable for this scan.'}
            </p>
          ) : (
            <div className="space-y-4">
              {detections.map((det, idx) => (
                <div key={idx} className="p-3 bg-red-50 border border-red-100 rounded-md">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-error">{det.class_name}</span>
                    <span className="text-xs font-semibold bg-white px-2 py-1 rounded text-error border border-red-200">
                      {(det.confidence * 100).toFixed(1)}% Match
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScanResults;