import { useLocation, Link } from 'react-router-dom';

const ScanResults = () => {
  const location = useLocation();
  const { result, preview } = location.state || {};

  if (!result) {
    return <div className="p-8 text-center text-error">No scan results found. <Link to="/disease-scanner" className="underline">Go back</Link></div>;
  }

  // Assuming your FastAPI backend returns an array of detections
  const detections = result.detections || [];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-maintext">Scan Results</h1>
        <Link to="/disease-scanner" className="text-primary hover:underline text-sm">Scan Another</Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col md:flex-row">
        <div className="md:w-1/2 bg-gray-100 flex items-center justify-center p-4">
           {result.annotated_image_url ? (
              <img src={result.annotated_image_url} alt="Annotated" className="max-h-80 object-contain" />
           ) : (
              <img src={preview} alt="Original" className="max-h-80 object-contain" />
           )}
        </div>
        
        <div className="md:w-1/2 p-6 space-y-4">
          <h2 className="text-lg font-bold text-maintext border-b pb-2">Detected Issues</h2>
          
          {detections.length === 0 ? (
            <p className="text-primary font-medium">No diseases detected. The crop appears healthy.</p>
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