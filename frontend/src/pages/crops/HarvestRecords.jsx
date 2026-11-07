import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import cropService from '../../services/cropService';
import { formatDate } from '../../utils/formatters';

const HarvestRecords = () => {
  const { id } = useParams();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const data = await cropService.getHarvestRecords(id);
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
      <h1 className="text-2xl font-bold text-maintext">Harvest Records</h1>
      
      {records.length === 0 ? (
        <div className="bg-white p-8 text-center rounded-xl shadow-sm border border-gray-100">
          <p className="text-subtext">No harvest records found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-4 font-medium text-subtext">Date</th>
                <th className="p-4 font-medium text-subtext">Quantity</th>
                <th className="p-4 font-medium text-subtext">Quality</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {records.map((record) => (
                <tr key={record.id}>
                  <td className="p-4 text-maintext">{formatDate(record.harvest_date)}</td>
                  <td className="p-4 font-medium text-primary">{record.quantity} {record.unit}</td>
                  <td className="p-4 text-subtext">{record.quality}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default HarvestRecords;