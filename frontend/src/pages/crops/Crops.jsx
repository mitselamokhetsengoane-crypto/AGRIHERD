import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import cropService from '../../services/cropService';
import { getStatusColor, formatDate } from '../../utils/formatters';

const Crops = () => {
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCrops = async () => {
      try {
        const data = await cropService.getAllCrops();
        setCrops(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchCrops();
  }, []);

  if (loading) return <div className="p-8 text-center text-subtext">Loading crops...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-maintext">Crops & Fields</h1>
        <Link to="/crops/add" className="bg-primary text-white px-4 py-2 rounded-md hover:bg-green-800 transition">+ Add Crop</Link>
      </div>

      {crops.length === 0 ? (
        <div className="bg-white p-8 text-center rounded-xl shadow-sm border border-gray-100">
          <p className="text-subtext">No crops found. Start by adding a new crop.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {crops.map((crop) => (
            <div key={crop.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-maintext">{crop.name}</h3>
                  <p className="text-sm text-subtext">{crop.field_name} • {crop.field_size}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(crop.status)}`}>
                  {crop.status}
                </span>
              </div>
              <div className="mt-auto pt-4 border-t border-gray-100 flex justify-between items-center">
                <div>
                  <p className="text-xs text-subtext">Planted</p>
                  <p className="font-medium text-maintext text-sm">{formatDate(crop.planting_date)}</p>
                </div>
                <Link to={`/crops/${crop.id}`} className="text-primary text-sm font-medium hover:underline">Manage</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Crops;