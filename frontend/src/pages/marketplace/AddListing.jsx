import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import marketplaceService from '../../services/marketplaceService';

const AddListing = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: '', category_id: '', description: '', price: '', quantity_available: '', unit: '', image_url: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const cats = await marketplaceService.getCategories();
        setCategories(cats);
        if (isEdit) {
          const all = await marketplaceService.getMyListings();
          const target = all.find((x) => x.id === id);
          if (target) {
            setFormData({
              name: target.name || '',
              category_id: target.category_id || '',
              description: target.description || '',
              price: String(target.price ?? ''),
              quantity_available: String(target.quantity_available ?? ''),
              unit: target.unit || '',
              image_url: target.image_url || '',
            });
          }
        }
      } catch (err) {
        setError('Could not load categories.');
      }
    };
    load();
  }, [id, isEdit]);

  const updateField = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = {
        name: formData.name,
        category_id: formData.category_id || null,
        description: formData.description,
        price: Number(formData.price),
        quantity_available: Number(formData.quantity_available),
        unit: formData.unit,
        image_url: formData.image_url,
      };
      if (isEdit) {
        await marketplaceService.updateProduct(id, payload);
      } else {
        await marketplaceService.createProduct(payload);
      }
      navigate('/app/marketplace/listings');
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not save listing.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-maintext">{isEdit ? 'Edit Listing' : 'Add Listing'}</h1>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
        {error && <p className="rounded-md bg-red-50 p-3 text-sm text-error">{error}</p>}

        <div>
          <label className="block text-sm text-subtext mb-1">Product Name</label>
          <input required name="name" value={formData.name} onChange={updateField} maxLength="150"
            className="w-full border border-gray-300 rounded-md px-4 py-2 focus:border-primary" />
        </div>
        <div>
          <label className="block text-sm text-subtext mb-1">Category</label>
          <select required name="category_id" value={formData.category_id} onChange={updateField}
            className="w-full border border-gray-300 rounded-md px-4 py-2 focus:border-primary bg-white">
            <option value="">Select category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-subtext mb-1">Description</label>
          <textarea name="description" rows="3" value={formData.description} onChange={updateField}
            className="w-full border border-gray-300 rounded-md px-4 py-2 focus:border-primary" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-subtext mb-1">Price (M)</label>
            <input required name="price" type="number" step="0.01" min="0.01" value={formData.price} onChange={updateField}
              className="w-full border border-gray-300 rounded-md px-4 py-2 focus:border-primary" />
          </div>
          <div>
            <label className="block text-sm text-subtext mb-1">Quantity</label>
            <input required name="quantity_available" type="number" step="0.01" min="0" value={formData.quantity_available} onChange={updateField}
              className="w-full border border-gray-300 rounded-md px-4 py-2 focus:border-primary" />
          </div>
        </div>
        <div>
          <label className="block text-sm text-subtext mb-1">Unit (e.g. kg, bag, crate)</label>
          <input name="unit" value={formData.unit} onChange={updateField}
            className="w-full border border-gray-300 rounded-md px-4 py-2 focus:border-primary" />
        </div>
        <div>
          <label className="block text-sm text-subtext mb-1">Image URL (optional)</label>
          <input name="image_url" type="url" value={formData.image_url} onChange={updateField}
            className="w-full border border-gray-300 rounded-md px-4 py-2 focus:border-primary" />
          <p className="text-xs text-subtext mt-1">
            Paste a public image URL from your Supabase Storage or elsewhere.
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading}
            className="rounded-md bg-primary px-5 py-2 font-medium text-white hover:bg-green-800 disabled:opacity-60">
            {loading ? 'Saving...' : (isEdit ? 'Save Changes' : 'Create Listing')}
          </button>
          <button type="button" onClick={() => navigate('/app/marketplace/listings')}
            className="rounded-md border border-gray-300 px-5 py-2 font-medium text-gray-700 hover:bg-gray-50">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddListing;