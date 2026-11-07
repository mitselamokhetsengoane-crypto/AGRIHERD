import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import livestockService from '../../services/livestockService';
import { formatDate } from '../../utils/formatters';

const HealthRecords = () => {
  const { id } = useParams();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const data = await livestockService.getHealthRecords(id);
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
      <Link to={`/livestock/${id}`} className="text-primary hover:underline text-sm">Back to Animal</Link>
      <h1 className="text-2xl font-bold text-maintext">Health Records</h1>
      
      {records.length === 0 ? (
        <div className="bg-white p-8 text-center rounded-xl shadow-sm border border-gray-100">
          <p className="text-subtext">No health records found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {records.map((record) => (
            <div key={record.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-maintext">{record.condition}</h3>
                <span className="text-sm text-subtext">{formatDate(record.date)}</span>
              </div>
              <p className="text-subtext text-sm mt-2">{record.treatment}</p>
              {record.notes && <p className="text-subtext text-sm mt-2 italic">Notes: {record.notes}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HealthRecords;