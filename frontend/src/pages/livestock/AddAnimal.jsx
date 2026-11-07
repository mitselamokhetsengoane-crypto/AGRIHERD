import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import livestockService from '../../services/livestockService';

const AddAnimal = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    animal_id: '', name: '', type: '', breed: '', age: '', gender: '', weight: '', health_status: 'Healthy', notes: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await livestockService.createAnimal(formData);
      navigate('/livestock');
    } catch (error) {
      alert("Failed to add animal.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-maintext">Add Animal</h1>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4">
        
        <div className="md:col-span-2">
          <label className="block text-sm text-subtext mb-1">Animal ID / Tag Number *</label>
          <input required type="text" className="w-full border border-gray-300 rounded-md px-4 py-2" value={formData.animal_id} onChange={e => setFormData({...formData, animal_id: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm text-subtext mb-1">Name</label>
          <input type="text" className="w-full border border-gray-300 rounded-md px-4 py-2" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm text-subtext mb-1">Type *</label>
          <select required className="w-full border border-gray-300 rounded-md px-4 py-2" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
            <option value="">Select Type</option>
            <option value="Cattle">Cattle</option>
            <option value="Sheep">Sheep</option>
            <option value="Goat">Goat</option>
            <option value="Chicken">Chicken</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-subtext mb-1">Breed</label>
          <input type="text" className="w-full border border-gray-300 rounded-md px-4 py-2" value={formData.breed} onChange={e => setFormData({...formData, breed: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm text-subtext mb-1">Age (Years)</label>
          <input type="number" className="w-full border border-gray-300 rounded-md px-4 py-2" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} />
        </div>
        
        <div className="md:col-span-2 flex gap-4 mt-4">
          <button type="button" onClick={() => navigate('/livestock')} className="flex-1 bg-white text-error border border-error py-2 rounded-md hover:bg-red-50">Cancel</button>
          <button disabled={loading} type="submit" className="flex-1 bg-primary text-white py-2 rounded-md hover:bg-green-800 disabled:opacity-50">
            {loading ? 'Saving...' : 'Save Animal'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddAnimal;