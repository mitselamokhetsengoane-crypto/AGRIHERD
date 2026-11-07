import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import livestockService from '../../services/livestockService';
import { formatDate } from '../../utils/formatters';

const Breeding = () => {
  const { id } = useParams();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const data = await livestockService.getBreedingRecords(id);
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
      <h1 className="text-2xl font-bold text-maintext">Breeding Records</h1>
      
      {records.length === 0 ? (
        <div className="bg-white p-8 text-center rounded-xl shadow-sm border border-gray-100">
          <p className="text-subtext">No breeding records found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {records.map((record) => (
            <div key={record.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-maintext">{record.status}</h3>
                <span className="text-sm text-subtext">{formatDate(record.breeding_date)}</span>
              </div>
              {record.expected_birth_date && (
                <p className="text-sm text-subtext mt-2">Expected Birth: <span className="font-medium text-primary">{formatDate(record.expected_birth_date)}</span></p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Breeding;