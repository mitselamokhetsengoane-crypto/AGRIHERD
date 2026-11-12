import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import cropService from '../../services/cropService';
import blockchainService from '../../services/blockchainService';
import { getErrorMessage } from '../../services/api';
import { formatDate } from '../../utils/formatters';

const HarvestRecords = () => {
  const { id } = useParams();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ harvest_date: '', quantity: '', unit: '', quality: '' });
  const [saving, setSaving] = useState(false);
  const [registering, setRegistering] = useState(null);

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

  useEffect(() => { fetchRecords(); }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        quantity: parseFloat(form.quantity)
      };
      await cropService.addHarvestRecord(id, payload);
      setForm({ harvest_date: '', quantity: '', unit: '', quality: '' });
      // The backend will automatically push to the blockchain, so we just refresh
      await fetchRecords();
    } catch (error) {
      alert(getErrorMessage(error, "Failed to save harvest record."));
    } finally {
      setSaving(false);
    }
  };

  const handleRegister = async (recordId) => {
    setRegistering(recordId);
    try {
      await blockchainService.registerHarvest(recordId);
      alert("Harvest successfully registered on the blockchain!");
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to register on blockchain.");
    } finally {
      setRegistering(null);
    }
  };

  if (loading) return <div className="p-8 text-center text-subtext">Loading records...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link to={`/crops/${id}`} className="text-primary hover:underline text-sm">Back to Crop</Link>
      <h1 className="text-2xl font-bold text-maintext">Harvest Records</h1>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-4"><h3 className="font-semibold text-maintext">Log New Harvest</h3></div>
        <div>
          <label className="block text-sm text-subtext mb-1">Harvest Date *</label>
          <input required type="date" className="w-full border border-gray-300 rounded-md px-4 py-2" value={form.harvest_date} onChange={e => setForm({...form, harvest_date: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm text-subtext mb-1">Quantity *</label>
          <input required type="number" step="0.01" placeholder="e.g. 50" className="w-full border border-gray-300 rounded-md px-4 py-2" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm text-subtext mb-1">Unit</label>
          <input type="text" placeholder="e.g. kg" className="w-full border border-gray-300 rounded-md px-4 py-2" value={form.unit} onChange={e => setForm({...form, unit: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm text-subtext mb-1">Quality</label>
          <select className="w-full border border-gray-300 rounded-md px-4 py-2" value={form.quality} onChange={e => setForm({...form, quality: e.target.value})}>
            <option value="">Select Quality</option>
            <option value="Excellent">Excellent</option>
            <option value="Good">Good</option>
            <option value="Fair">Fair</option>
            <option value="Poor">Poor</option>
          </select>
        </div>
        <div className="md:col-span-4">
          <button disabled={saving} type="submit" className="bg-primary text-white px-6 py-2 rounded-md hover:bg-green-800 disabled:opacity-50">
            {saving ? 'Saving...' : 'Add Record'}
          </button>
        </div>
      </form>

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
                <th className="p-4 font-medium text-subtext text-right">Blockchain</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {records.map((record) => (
                <tr key={record.id}>
                  <td className="p-4 text-maintext">{formatDate(record.harvest_date)}</td>
                  <td className="p-4 font-medium text-primary">{record.quantity} {record.unit}</td>
                  <td className="p-4 text-subtext">{record.quality || 'N/A'}</td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleRegister(record.id)}
                      disabled={registering === record.id}
                      className="text-xs bg-gray-100 text-gray-800 px-3 py-1 rounded hover:bg-gray-200 disabled:opacity-50 font-medium"
                    >
                      {registering === record.id ? 'Registering...' : 'Register on Chain'}
                    </button>
                  </td>
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