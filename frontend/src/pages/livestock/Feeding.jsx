import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import livestockService from '../../services/livestockService';
import { formatDate } from '../../utils/formatters';

const Feeding = () => {
  const { id } = useParams();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ date: '', feed_type: '', quantity: '' });
  const [saving, setSaving] = useState(false);

  const fetchRecords = async () => {
    try {
      const data = await livestockService.getFeedingRecords(id);
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
      await livestockService.addFeedingRecord(id, form);
      setForm({ date: '', feed_type: '', quantity: '' });
      await fetchRecords();
    } catch (error) {
      alert("Failed to save feeding record.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-subtext">Loading records...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link to={`/app/livestock/${id}`} className="text-primary hover:underline text-sm">Back to Animal</Link>
      <h1 className="text-2xl font-bold text-maintext">Feeding Records</h1>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-3"><h3 className="font-semibold text-maintext">Log Feeding</h3></div>
        <div>
          <label className="block text-sm text-subtext mb-1">Date *</label>
          <input required type="date" className="w-full border border-gray-300 rounded-md px-4 py-2" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm text-subtext mb-1">Feed Type *</label>
          <input required type="text" placeholder="e.g. Hay" className="w-full border border-gray-300 rounded-md px-4 py-2" value={form.feed_type} onChange={e => setForm({...form, feed_type: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm text-subtext mb-1">Quantity</label>
          <input type="text" placeholder="e.g. 5 kg" className="w-full border border-gray-300 rounded-md px-4 py-2" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} />
        </div>
        <div className="md:col-span-3">
          <button disabled={saving} type="submit" className="bg-primary text-white px-6 py-2 rounded-md hover:bg-green-800 disabled:opacity-50">
            {saving ? 'Saving...' : 'Add Record'}
          </button>
        </div>
      </form>

      {records.length === 0 ? (
        <div className="bg-white p-8 text-center rounded-xl shadow-sm border border-gray-100">
          <p className="text-subtext">No feeding records found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-4 font-medium text-subtext">Date</th>
                <th className="p-4 font-medium text-subtext">Feed Type</th>
                <th className="p-4 font-medium text-subtext">Quantity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {records.map((record) => (
                <tr key={record.id}>
                  <td className="p-4 text-maintext">{formatDate(record.date)}</td>
                  <td className="p-4 text-maintext">{record.feed_type}</td>
                  <td className="p-4 text-maintext">{record.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Feeding;