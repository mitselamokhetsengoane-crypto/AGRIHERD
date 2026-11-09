import { useState, useEffect } from 'react';
import marketplaceService from '../../services/marketplaceService';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', parent_id: '' });

  const load = async () => {
    setLoading(true);
    try {
      setCategories(await marketplaceService.getAllCategoriesAdmin());
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not load categories.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const parents = categories.filter((c) => !c.parent_id);

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await marketplaceService.createCategory({
        name: form.name.trim(),
        parent_id: form.parent_id || null,
      });
      setForm({ name: '', parent_id: '' });
      await load();
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not create category.');
    }
  };

  const handleDeactivate = async (id) => {
    if (!window.confirm('Deactivate this category? Existing listings will remain but new ones cannot use it.')) return;
    try {
      await marketplaceService.deleteCategory(id);
      await load();
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not deactivate.');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Marketplace Categories</h1>
      {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <form onSubmit={handleAdd} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex gap-3 items-end">
        <div className="flex-1">
          <label className="block text-sm text-gray-600 mb-1">Name</label>
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full border border-gray-300 rounded px-3 py-2" />
        </div>
        <div className="flex-1">
          <label className="block text-sm text-gray-600 mb-1">Parent (optional)</label>
          <select value={form.parent_id} onChange={(e) => setForm({ ...form, parent_id: e.target.value })}
            className="w-full border border-gray-300 rounded px-3 py-2 bg-white">
            <option value="">None (top-level)</option>
            {parents.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <button type="submit" className="bg-primary text-white px-4 py-2 rounded hover:bg-green-800">Add</button>
      </form>

      {loading ? (
        <div className="p-8 text-center text-gray-500">Loading...</div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-4 font-medium text-gray-600">Name</th>
                <th className="p-4 font-medium text-gray-600">Parent</th>
                <th className="p-4 font-medium text-gray-600">Status</th>
                <th className="p-4 font-medium text-gray-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {categories.map((c) => {
                const parent = categories.find((x) => x.id === c.parent_id);
                return (
                  <tr key={c.id}>
                    <td className="p-4 text-gray-800">{c.name}</td>
                    <td className="p-4 text-gray-500">{parent?.name || '—'}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${c.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                        {c.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {c.is_active && (
                        <button onClick={() => handleDeactivate(c.id)} className="text-red-600 text-sm hover:underline">Deactivate</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Categories;