import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import cropService from '../../services/cropService';
import { formatDate } from '../../utils/formatters';

const PlantingRecords = () => {
  const { id } = useParams();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        // Assuming your service fetches by crop id
        const data = await cropService.getPlantingRecords(id);
        setRecords(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchRecords();
  }, [id]);

  if (loading) return <div className="p-8 text-center text-subtext">Loading records...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link to={`/crops/${id}`} className="text-primary hover:underline text-sm">Back to Crop</Link>
      <h1 className="text-2xl font-bold text-maintext">Planting Records</h1>
      
      {records.length === 0 ? (
        <div className="bg-white p-8 text-center rounded-xl shadow-sm border border-gray-100">
          <p className="text-subtext">No planting records found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {records.map((record) => (
            <div key={record.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-maintext">Planted: {record.seed_type}</h3>
                <span className="text-sm text-subtext">{formatDate(record.planting_date)}</span>
              </div>
              <p className="text-subtext text-sm mt-2">Quantity Used: {record.quantity_used} kg</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PlantingRecords;