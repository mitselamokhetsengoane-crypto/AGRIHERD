import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import marketplaceService from '../../services/marketplaceService';
import { formatCurrency } from '../../utils/formatters';

const MyListings = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setListings(await marketplaceService.getMyListings());
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not load listings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDeactivate = async (id) => {
    if (!window.confirm('Deactivate this listing? It will disappear from the marketplace.')) return;
    try {
      await marketplaceService.deactivateProduct(id);
      await load();
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not deactivate listing.');
    }
  };

  if (loading) return <div className="p-8 text-center text-subtext">Loading listings...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-maintext">My Listings</h1>
        <Link to="/app/marketplace/listings/add" className="bg-primary text-white px-4 py-2 rounded-md hover:bg-green-800 transition">
          + Add Listing
        </Link>
      </div>

      {error && <p className="rounded-md bg-red-50 p-3 text-sm text-error">{error}</p>}

      {listings.length === 0 ? (
        <div className="bg-white p-8 text-center rounded-xl shadow-sm border border-gray-100">
          <p className="text-subtext">You have no listings yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-4 font-medium text-subtext">Name</th>
                <th className="p-4 font-medium text-subtext">Price</th>
                <th className="p-4 font-medium text-subtext">Stock</th>
                <th className="p-4 font-medium text-subtext">Status</th>
                <th className="p-4 font-medium text-subtext text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {listings.map((item) => (
                <tr key={item.id}>
                  <td className="p-4 font-medium text-maintext">{item.name}</td>
                  <td className="p-4 text-primary font-bold">{formatCurrency(item.price)}</td>
                  <td className="p-4 text-subtext">{item.quantity_available} {item.unit || ''}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${item.status === 'Available' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-3">
                    <Link to={`/app/marketplace/listings/edit/${item.id}`} className="text-primary text-sm hover:underline">Edit</Link>
                    {item.status === 'Available' && (
                      <button onClick={() => handleDeactivate(item.id)} className="text-error text-sm hover:underline">Deactivate</button>
                    )}
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

export default MyListings;