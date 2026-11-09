import { useState, useEffect } from 'react';
import marketplaceService from '../../services/marketplaceService';
import { formatCurrency, formatDate, getStatusColor } from '../../utils/formatters';

const MarketplaceMonitor = () => {
  const [tab, setTab] = useState('listings');
  const [listings, setListings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const [l, o] = await Promise.all([
        marketplaceService.adminGetAllListings(),
        marketplaceService.getMyOrders(),
      ]);
      setListings(l);
      setOrders(o);
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not load marketplace data.');
    }
  };

  useEffect(() => { load(); }, []);

  const handleDeactivate = async (id) => {
    const reason = window.prompt('Reason for deactivating this listing?');
    if (!reason) return;
    try {
      await marketplaceService.adminDeactivateProduct(id);
      await load();
    } catch (err) {
      setError('Could not deactivate listing.');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Marketplace Monitoring</h1>
      {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className="flex gap-3 border-b">
        <button onClick={() => setTab('listings')} className={`pb-2 px-2 font-medium ${tab === 'listings' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}>Listings</button>
        <button onClick={() => setTab('orders')} className={`pb-2 px-2 font-medium ${tab === 'orders' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}>Orders</button>
      </div>

      {tab === 'listings' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-4 font-medium text-gray-600">Name</th>
                <th className="p-4 font-medium text-gray-600">Price</th>
                <th className="p-4 font-medium text-gray-600">Stock</th>
                <th className="p-4 font-medium text-gray-600">Status</th>
                <th className="p-4 font-medium text-gray-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {listings.map((l) => (
                <tr key={l.id}>
                  <td className="p-4 text-gray-800">{l.name}</td>
                  <td className="p-4 text-primary font-bold">{formatCurrency(l.price)}</td>
                  <td className="p-4 text-gray-500">{l.quantity_available} {l.unit || ''}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${l.status === 'Available' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>{l.status}</span>
                  </td>
                  <td className="p-4 text-right">
                    {l.status === 'Available' && (
                      <button onClick={() => handleDeactivate(l.id)} className="text-red-600 text-sm hover:underline">Deactivate</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'orders' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-4 font-medium text-gray-600">Order</th>
                <th className="p-4 font-medium text-gray-600">Date</th>
                <th className="p-4 font-medium text-gray-600">Total</th>
                <th className="p-4 font-medium text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((o) => (
                <tr key={o.id}>
                  <td className="p-4 font-medium text-gray-800">#{o.id.slice(0, 8)}</td>
                  <td className="p-4 text-gray-500">{formatDate(o.created_at)}</td>
                  <td className="p-4 text-primary font-bold">{formatCurrency(o.total)}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(o.status)}`}>{o.status}</span>
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

export default MarketplaceMonitor;