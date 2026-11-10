import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import livestockService from '../../services/livestockService';
import { formatDate } from '../../utils/formatters';

const Vaccinations = () => {
  const { id } = useParams();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ vaccine_name: '', date_administered: '', next_due_date: '' });
  const [saving, setSaving] = useState(false);

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

  useEffect(() => { fetchRecords(); }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await livestockService.addVaccination(id, form);
      setForm({ vaccine_name: '', date_administered: '', next_due_date: '' });
      await fetchRecords();
    } catch (error) {
      alert("Failed to save vaccination.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-subtext">Loading records...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link to={`/app/livestock/${id}`} className="text-primary hover:underline text-sm">Back to Animal</Link>
      <h1 className="text-2xl font-bold text-maintext">Vaccination Records</h1>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2"><h3 className="font-semibold text-maintext">Log New Vaccination</h3></div>
        <div>
          <label className="block text-sm text-subtext mb-1">Vaccine Name *</label>
          <input required type="text" className="w-full border border-gray-300 rounded-md px-4 py-2" value={form.vaccine_name} onChange={e => setForm({...form, vaccine_name: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm text-subtext mb-1">Date Administered *</label>
          <input required type="date" className="w-full border border-gray-300 rounded-md px-4 py-2" value={form.date_administered} onChange={e => setForm({...form, date_administered: e.target.value})} />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm text-subtext mb-1">Next Due Date</label>
          <input type="date" className="w-full border border-gray-300 rounded-md px-4 py-2" value={form.next_due_date} onChange={e => setForm({...form, next_due_date: e.target.value})} />
        </div>
        <div className="md:col-span-2">
          <button disabled={saving} type="submit" className="bg-primary text-white px-6 py-2 rounded-md hover:bg-green-800 disabled:opacity-50">
            {saving ? 'Saving...' : 'Add Record'}
          </button>
        </div>
      </form>

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