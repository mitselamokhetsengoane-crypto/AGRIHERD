import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import cropService from '../../services/cropService';
import { formatDate, getStatusColor } from '../../utils/formatters';

const CropDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [crop, setCrop] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCrop = async () => {
      try {
        const data = await cropService.getCropById(id);
        setCrop(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchCrop();
  }, [id]);

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this crop record?")) {
      await cropService.deleteCrop(id);
      navigate('/crops');
    }
  };

  if (loading) return <div className="p-8 text-center text-subtext">Loading details...</div>;
  if (!crop) return <div className="p-8 text-center text-error">Crop not found.</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link to="/crops" className="text-primary hover:underline text-sm">Back to Crops</Link>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
        <div className="flex justify-between items-start border-b border-gray-100 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-maintext">{crop.name}</h1>
            <p className="text-subtext">{crop.field_name} • {crop.field_size}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(crop.status)}`}>
            {crop.status}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div><p className="text-sm text-subtext">Type</p><p className="font-medium">{crop.type}</p></div>
          <div><p className="text-sm text-subtext">Planted</p><p className="font-medium">{formatDate(crop.planting_date)}</p></div>
          <div><p className="text-sm text-subtext">Expected Harvest</p><p className="font-medium">{crop.expected_harvest_date ? formatDate(crop.expected_harvest_date) : 'N/A'}</p></div>
        </div>

        <div>
          <h3 className="font-semibold text-maintext mb-2">Notes</h3>
          <p className="text-subtext text-sm">{crop.notes || 'No notes recorded.'}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Link to={`/crops/${id}/planting`} className="bg-white p-4 text-center rounded-xl shadow-sm border border-gray-100 hover:border-primary transition text-sm font-medium text-maintext">Planting Records</Link>
        <Link to={`/crops/${id}/harvest`} className="bg-white p-4 text-center rounded-xl shadow-sm border border-gray-100 hover:border-primary transition text-sm font-medium text-maintext">Harvest Records</Link>
      </div>

      <div className="flex gap-4">
        <button onClick={handleDelete} className="flex-1 bg-white border border-error text-error py-2 rounded-md hover:bg-red-50">Delete Crop</button>
      </div>
    </div>
  );
};

export default CropDetails;