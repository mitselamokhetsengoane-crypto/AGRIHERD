import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import livestockService from '../../services/livestockService';
import { formatDate } from '../../utils/formatters';

const HealthRecords = () => {
  const { id } = useParams();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ date: '', condition: '', treatment: '', notes: '' });
  const [saving, setSaving] = useState(false);

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

  useEffect(() => { fetchRecords(); }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await livestockService.addHealthRecord(id, form);
      setForm({ date: '', condition: '', treatment: '', notes: '' });
      await fetchRecords();
    } catch (error) {
      alert("Failed to save health record.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-subtext">Loading records...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link to={`/app/livestock/${id}`} className="text-primary hover:underline text-sm">Back to Animal</Link>
      <h1 className="text-2xl font-bold text-maintext">Health Records</h1>

      {/* Add Form */}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2"><h3 className="font-semibold text-maintext">Log New Health Issue</h3></div>
        <div>
          <label className="block text-sm text-subtext mb-1">Date *</label>
          <input required type="date" className="w-full border border-gray-300 rounded-md px-4 py-2" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm text-subtext mb-1">Condition/Diagnosis *</label>
          <input required type="text" placeholder="e.g. Mastitis" className="w-full border border-gray-300 rounded-md px-4 py-2" value={form.condition} onChange={e => setForm({...form, condition: e.target.value})} />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm text-subtext mb-1">Treatment</label>
          <input type="text" className="w-full border border-gray-300 rounded-md px-4 py-2" value={form.treatment} onChange={e => setForm({...form, treatment: e.target.value})} />
        </div>
        <div className="md:col-span-2">
          <button disabled={saving} type="submit" className="bg-primary text-white px-6 py-2 rounded-md hover:bg-green-800 disabled:opacity-50">
            {saving ? 'Saving...' : 'Add Record'}
          </button>
        </div>
      </form>

      {/* List */}
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
              <p className="text-subtext text-sm mt-2">Treatment: {record.treatment || 'N/A'}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HealthRecords;