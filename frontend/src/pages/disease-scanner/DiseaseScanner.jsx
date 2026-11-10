import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import aiService from '../../services/aiService';

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
      setError('Please upload an image first.');
      return;
    }
    setLoading(true);
    setWakingServer(false);
    setError('');
    try {
      // This calls the FastAPI backend which runs your YOLOv8 best.pt model
      const scan = await aiService.scanImage(image, () => setWakingServer(true));
      if (!scan?.id) {
        setError('The scan was completed, but its saved result ID was missing.');
        return;
      }
      navigate(`/disease-scanner/results/${encodeURIComponent(scan.id)}`);
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (typeof detail === 'string') {
        setError(detail);
      } else if (err.response?.status === 401) {
        setError('Your session has expired. Please log in again before scanning.');
      } else if (err.response) {
        setError(`The scan failed (HTTP ${err.response.status}). Please try again.`);
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
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-maintext">Disease Scanner</h1>
        <Link to="/disease-scanner/history" className="text-primary hover:underline text-sm font-medium">Scan History</Link>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
        {error && (
          <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-red-50 p-3 text-sm text-error">
            <span>{error}</span>
            {image && (
              <button type="button" onClick={handleScan} disabled={loading}
                className="rounded-md border border-red-200 bg-white px-3 py-1.5 font-medium text-red-700 hover:bg-red-100 disabled:opacity-60">
                Try again
              </button>
            )}
          </div>
        )}

        <div 
          className="border-2 border-dashed border-gray-300 rounded-xl h-64 flex flex-col items-center justify-center bg-background cursor-pointer hover:border-primary transition"
          onClick={() => fileInputRef.current.click()}
        >
          {preview ? (
            <img src={preview} alt="Preview" className="h-full object-contain p-2" />
          ) : (
            <>
              <p className="text-maintext font-medium">Upload Crop Image</p>
              <p className="text-subtext text-sm mt-1">Click to browse or take a photo</p>
            </>
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
          onClick={handleScan}
          disabled={loading || !image}
          className="w-full bg-primary text-white py-3 rounded-md hover:bg-green-800 transition font-medium disabled:opacity-50"
        >
          {loading ? (
            <span role="status" className="inline-flex items-center justify-center gap-2">
              <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
              {wakingServer ? 'Waking up scan service...' : 'Scanning Image...'}
            </span>
          ) : 'Scan Image'}
        </button>
      </div>
    </div>
  );
};

export default DiseaseScanner;