import { useEffect, useState } from 'react';
import securityService from '../../services/securityService';

const DataClassification = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setData(await securityService.getDataClassification());
      } catch (err) {
        setError(err.response?.data?.detail || 'Could not load classification.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading classification...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;

  const classes = [
    { key: 'public', label: 'Public Data', color: 'text-green-700' },
    { key: 'private', label: 'Private Data', color: 'text-yellow-600' },
    { key: 'confidential', label: 'Confidential Data', color: 'text-orange-600' },
    { key: 'restricted', label: 'Restricted Data', color: 'text-red-600' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Data Classification</h1>
        <p className="text-gray-500 mt-1">How information is classified across the platform. Loaded from the database.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {classes.map((c) => (
          <div key={c.key} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className={`text-lg font-semibold ${c.color} mb-2`}>{c.label}</h3>
            {(data?.[c.key] || []).map((row) => (
              <p key={row.id} className="text-gray-600 text-sm">{row.items}</p>
            ))}
            {(data?.[c.key] || []).length === 0 && (
              <p className="text-gray-400 text-sm">No items recorded.</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DataClassification;