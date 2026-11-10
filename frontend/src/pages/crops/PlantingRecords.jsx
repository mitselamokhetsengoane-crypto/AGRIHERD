import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import cropService from '../../services/cropService';
import { formatDate } from '../../utils/formatters';

const PlantingRecords = () => {
  const { id } = useParams();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ planting_date: '', seed_type: '', quantity_used: '', notes: '' });
  const [saving, setSaving] = useState(false);

  const fetchRecords = async () => {
    try {
      const data = await cropService.getPlantingRecords(id);
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
      // Convert empty strings to null or numbers where required
      const payload = {
        ...form,
        quantity_used: form.quantity_used ? parseFloat(form.quantity_used) : null
      };
      await cropService.addPlantingRecord(id, payload);
      setForm({ planting_date: '', seed_type: '', quantity_used: '', notes: '' });
      await fetchRecords();
    } catch (error) {
      alert("Failed to save planting record.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-subtext">Loading records...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link to={`/app/crops/${id}`} className="text-primary hover:underline text-sm">Back to Crop</Link>
      <h1 className="text-2xl font-bold text-maintext">Planting Records</h1>

      {/* Add Form */}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-3"><h3 className="font-semibold text-maintext">Log New Planting</h3></div>
        <div>
          <label className="block text-sm text-subtext mb-1">Planting Date *</label>
          <input required type="date" className="w-full border border-gray-300 rounded-md px-4 py-2" value={form.planting_date} onChange={e => setForm({...form, planting_date: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm text-subtext mb-1">Seed Type</label>
          <input type="text" placeholder="e.g. Hybrid Maize" className="w-full border border-gray-300 rounded-md px-4 py-2" value={form.seed_type} onChange={e => setForm({...form, seed_type: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm text-subtext mb-1">Quantity Used (kg)</label>
          <input type="number" step="0.01" className="w-full border border-gray-300 rounded-md px-4 py-2" value={form.quantity_used} onChange={e => setForm({...form, quantity_used: e.target.value})} />
        </div>
        <div className="md:col-span-3">
          <button disabled={saving} type="submit" className="bg-primary text-white px-6 py-2 rounded-md hover:bg-green-800 disabled:opacity-50">
            {saving ? 'Saving...' : 'Add Record'}
          </button>
        </div>
      </form>

      {/* List */}
      {records.length === 0 ? (
        <div className="bg-white p-8 text-center rounded-xl shadow-sm border border-gray-100">
          <p className="text-subtext">No planting records found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {records.map((record) => (
            <div key={record.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-maintext">Planted: {record.seed_type || 'Unknown Seed'}</h3>
                <span className="text-sm text-subtext">{formatDate(record.planting_date)}</span>
              </div>
              <p className="text-subtext text-sm mt-2">Quantity Used: {record.quantity_used ? `${record.quantity_used} kg` : 'N/A'}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PlantingRecords;