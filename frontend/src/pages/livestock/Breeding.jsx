import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import livestockService from '../../services/livestockService';
import { formatDate } from '../../utils/formatters';

const Breeding = () => {
  const { id } = useParams();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ breeding_date: '', expected_birth_date: '', outcome: '' });
  const [saving, setSaving] = useState(false);

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

  useEffect(() => { fetchRecords(); }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await livestockService.addBreedingRecord(id, form);
      setForm({ breeding_date: '', expected_birth_date: '', outcome: '' });
      await fetchRecords();
    } catch (error) {
      alert("Failed to save breeding record.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-subtext">Loading records...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link to={`/app/livestock/${id}`} className="text-primary hover:underline text-sm">Back to Animal</Link>
      <h1 className="text-2xl font-bold text-maintext">Breeding Records</h1>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-3"><h3 className="font-semibold text-maintext">Log Breeding Event</h3></div>
        <div>
          <label className="block text-sm text-subtext mb-1">Breeding Date *</label>
          <input required type="date" className="w-full border border-gray-300 rounded-md px-4 py-2" value={form.breeding_date} onChange={e => setForm({...form, breeding_date: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm text-subtext mb-1">Expected Birth Date</label>
          <input type="date" className="w-full border border-gray-300 rounded-md px-4 py-2" value={form.expected_birth_date} onChange={e => setForm({...form, expected_birth_date: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm text-subtext mb-1">Outcome</label>
          <input type="text" placeholder="e.g. Pregnant" className="w-full border border-gray-300 rounded-md px-4 py-2" value={form.outcome} onChange={e => setForm({...form, outcome: e.target.value})} />
        </div>
        <div className="md:col-span-3">
          <button disabled={saving} type="submit" className="bg-primary text-white px-6 py-2 rounded-md hover:bg-green-800 disabled:opacity-50">
            {saving ? 'Saving...' : 'Add Record'}
          </button>
        </div>
      </form>

      {records.length === 0 ? (
        <div className="bg-white p-8 text-center rounded-xl shadow-sm border border-gray-100">
          <p className="text-subtext">No breeding records found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {records.map((record) => (
            <div key={record.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-maintext">{record.outcome || 'Pending Outcome'}</h3>
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