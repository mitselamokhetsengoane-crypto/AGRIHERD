import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import inventoryService from '../../services/inventoryService';

const AddItem = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '', category: '', quantity: 0, unit: '', minimum_stock_level: 0, notes: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await inventoryService.createItem(formData);
      navigate('/inventory');
    } catch (error) {
      alert("Failed to add item.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-maintext">Add Inventory Item</h1>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm text-subtext mb-1">Item Name *</label>
          <input required type="text" className="w-full border border-gray-300 rounded-md px-4 py-2" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm text-subtext mb-1">Category *</label>
          <select required className="w-full border border-gray-300 rounded-md px-4 py-2" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
            <option value="">Select Category</option>
            <option value="Seed">Seed</option>
            <option value="Fertilizer">Fertilizer</option>
            <option value="Animal Feed">Animal Feed</option>
            <option value="Equipment">Equipment</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-subtext mb-1">Quantity *</label>
          <input required type="number" className="w-full border border-gray-300 rounded-md px-4 py-2" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm text-subtext mb-1">Unit (e.g., kg, bags) *</label>
          <input required type="text" className="w-full border border-gray-300 rounded-md px-4 py-2" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm text-subtext mb-1">Minimum Stock Level</label>
          <input type="number" className="w-full border border-gray-300 rounded-md px-4 py-2" value={formData.minimum_stock_level} onChange={e => setFormData({...formData, minimum_stock_level: e.target.value})} />
        </div>
        <div className="md:col-span-2 flex gap-4 mt-4">
          <button type="button" onClick={() => navigate('/inventory')} className="flex-1 bg-white text-error border border-error py-2 rounded-md hover:bg-red-50">Cancel</button>
          <button disabled={loading} type="submit" className="flex-1 bg-primary text-white py-2 rounded-md hover:bg-green-800 disabled:opacity-50">
            {loading ? 'Saving...' : 'Save Item'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddItem;