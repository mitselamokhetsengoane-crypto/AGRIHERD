import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import livestockService from '../../services/livestockService';
import { formatDate } from '../../utils/formatters';

const Vaccinations = () => {
  const { id } = useParams();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const data = await livestockService.getVaccinations(id);
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
      <h1 className="text-2xl font-bold text-maintext">Vaccination Records</h1>
      
      {records.length === 0 ? (
        <div className="bg-white p-8 text-center rounded-xl shadow-sm border border-gray-100">
          <p className="text-subtext">No vaccination records found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {records.map((record) => (
            <div key={record.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-maintext">{record.vaccine_name}</h3>
                <p className="text-sm text-subtext">Administered: {formatDate(record.date_administered)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-subtext">Next Due:</p>
                <p className="font-medium text-primary">{record.next_due_date ? formatDate(record.next_due_date) : 'N/A'}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Vaccinations;