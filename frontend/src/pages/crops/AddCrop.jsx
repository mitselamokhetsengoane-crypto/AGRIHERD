import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import cropService from '../../services/cropService';

const AddCrop = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '', type: '', field_name: '', field_size: '', planting_date: '', expected_harvest_date: '', status: 'Planted', notes: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await cropService.createCrop(formData);
      navigate('/crops');
    } catch (error) {
      alert("Failed to add crop.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-maintext">Add Crop</h1>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-subtext mb-1">Crop Name *</label>
          <input required type="text" className="w-full border border-gray-300 rounded-md px-4 py-2" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm text-subtext mb-1">Crop Type *</label>
          <input required type="text" className="w-full border border-gray-300 rounded-md px-4 py-2" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm text-subtext mb-1">Field Name *</label>
          <input required type="text" className="w-full border border-gray-300 rounded-md px-4 py-2" value={formData.field_name} onChange={e => setFormData({...formData, field_name: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm text-subtext mb-1">Field Size *</label>
          <input required type="text" className="w-full border border-gray-300 rounded-md px-4 py-2" value={formData.field_size} onChange={e => setFormData({...formData, field_size: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm text-subtext mb-1">Planting Date *</label>
          <input required type="date" className="w-full border border-gray-300 rounded-md px-4 py-2" value={formData.planting_date} onChange={e => setFormData({...formData, planting_date: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm text-subtext mb-1">Expected Harvest Date</label>
          <input type="date" className="w-full border border-gray-300 rounded-md px-4 py-2" value={formData.expected_harvest_date} onChange={e => setFormData({...formData, expected_harvest_date: e.target.value})} />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm text-subtext mb-1">Notes</label>
          <textarea className="w-full border border-gray-300 rounded-md px-4 py-2" rows="2" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})}></textarea>
        </div>
        <div className="md:col-span-2 flex gap-4 mt-4">
          <button type="button" onClick={() => navigate('/crops')} className="flex-1 bg-white text-error border border-error py-2 rounded-md hover:bg-red-50">Cancel</button>
          <button disabled={loading} type="submit" className="flex-1 bg-primary text-white py-2 rounded-md hover:bg-green-800 disabled:opacity-50">
            {loading ? 'Saving...' : 'Save Crop'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddCrop;