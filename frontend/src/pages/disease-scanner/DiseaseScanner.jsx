import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import aiService from '../../services/aiService';
import PageHeader from '../../components/common/PageHeader';
import {
  ScanSearch,
  UploadCloud,
  History,
  Image as ImageIcon,
  RefreshCw,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

const DiseaseScanner = () => {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [wakingServer, setWakingServer] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleScan = async () => {
    if (!image) {
      setError('Please select or capture a crop leaf image first.');
      return;
    }
    setLoading(true);
    setWakingServer(false);
    setError('');
    try {
      const scan = await aiService.scanImage(
        image,
        () => setWakingServer(true),
        () => setWakingServer(true)
      );
      if (!scan?.id) {
        setError('The scan was completed, but its saved record ID was missing.');
        return;
      }
      navigate(`/app/disease-scanner/results/${encodeURIComponent(scan.id)}`);
    } catch (err) {
      const detail = err.response?.data?.detail;
      const status = err.response?.status;

      if (typeof detail === 'string' && detail.trim()) {
        setError(detail);
      } else if (status === 503) {
        setError('The AI service is currently waking up from sleep mode. Please wait 1-2 minutes and click "Try again".');
      } else if (status === 401) {
        setError('Your session has expired. Please log in again before scanning.');
      } else if (err.response) {
        setError(`The scan failed (HTTP ${status}). Please try again.`);
      } else {
        setError('Could not reach the scan service. Check your connection and try again.');
      }
    } finally {
      setLoading(false);
      setWakingServer(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader
        title="AI Disease Scanner"
        subtitle="Instant pathogen detection powered by YOLOv8 deep learning vision models."
      >
        <Link
          to="/app/disease-scanner/history"
          className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs sm:text-sm font-semibold text-maintext shadow-sm hover:bg-gray-50 transition"
        >
          <History className="h-4 w-4 text-primary" />
          <span>Scan History</span>
        </Link>
      </PageHeader>

      <div className="rounded-2xl border border-gray-100 bg-white p-6 sm:p-8 shadow-sm space-y-6">
        {error && (
          <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-xs sm:text-sm text-error"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
            {image && (
              <button
                type="button"
                onClick={handleScan}
                disabled={loading}
                className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 shadow-sm hover:bg-red-50 disabled:opacity-60"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Try again</span>
              </button>
            )}
          </div>
        )}

        {/* Upload Dropzone */}
        <div
          className="relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50/50 p-8 text-center transition hover:border-primary hover:bg-emerald-50/20 cursor-pointer min-h-[260px]"
          onClick={() => fileInputRef.current?.click()}
        >
          {preview ? (
            <div className="flex flex-col items-center space-y-3">
              <img
                src={preview}
                alt="Crop preview"
                className="max-h-56 rounded-xl object-contain shadow-sm border border-gray-200"
              />
              <p className="text-xs font-semibold text-primary">Click to change photo</p>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-gray-200/50">
                <UploadCloud className="h-8 w-8 text-primary" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-sm font-bold text-maintext">Upload or Capture Leaf Photo</p>
                <p className="text-xs text-subtext mt-1">Supports JPEG, PNG, or WEBP (Max 10MB)</p>
              </div>
            </div>
          )}
        </div>

        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          ref={fileInputRef}
          onChange={handleImageChange}
        />

        <button
          type="button"
          onClick={handleScan}
          disabled={loading || !image}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-bold text-white shadow-md hover:bg-primary-hover transition disabled:opacity-50"
        >
          {loading ? (
            <span role="status" className="inline-flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
              <span>{wakingServer ? 'Connecting to AI detection engine...' : 'Analyzing crop photo...'}</span>
            </span>
          ) : (
            <>
              <ScanSearch className="h-4 w-4" />
              <span>Run AI Disease Analysis</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default DiseaseScanner;
