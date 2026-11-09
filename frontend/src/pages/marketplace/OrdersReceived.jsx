import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import marketplaceService from '../../services/marketplaceService';
import { formatCurrency, formatDate, getStatusColor } from '../../utils/formatters';

const OrdersReceived = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setOrders(await marketplaceService.getMyOrders());
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not load orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const change = async (id, status) => {
    if (!window.confirm(`Set order to ${status}?`)) return;
    setUpdating(id);
    setError('');
    try {
      await marketplaceService.updateOrderStatus(id, status);
      await load();
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not update status.');
    } finally {
      setUpdating(null);
    }
  };

  if (loading) return <div className="p-8 text-center text-subtext">Loading orders...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-maintext">Orders Received</h1>
      {error && <p className="rounded-md bg-red-50 p-3 text-sm text-error">{error}</p>}

      {orders.length === 0 ? (
        <div className="bg-white p-8 text-center rounded-xl shadow-sm border border-gray-100">
          <p className="text-subtext">No orders yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-subtext text-sm border-b">
              <tr>
                <th className="p-4 font-medium">Order</th>
                <th className="p-4 font-medium">Customer</th>
                <th className="p-4 font-medium">Date</th>
                <th className="p-4 font-medium">Total</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((o) => (
                <tr key={o.id}>
                  <td className="p-4 font-medium text-maintext">
                    <Link to={`/app/marketplace/orders/${o.id}`} className="hover:underline">#{o.id.slice(0, 8)}</Link>
                  </td>
                  <td className="p-4 text-subtext">{o.customer_name}</td>
                  <td className="p-4 text-subtext">{formatDate(o.created_at)}</td>
                  <td className="p-4 font-bold text-primary">{formatCurrency(o.total)}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(o.status)}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2 whitespace-nowrap">
                    {o.status === 'PENDING' && (
                      <>
                        <button onClick={() => change(o.id, 'ACCEPTED')} disabled={updating === o.id} className="text-primary text-sm hover:underline disabled:opacity-50">Accept</button>
                        <button onClick={() => change(o.id, 'REJECTED')} disabled={updating === o.id} className="text-error text-sm hover:underline disabled:opacity-50">Reject</button>
                      </>
                    )}
                    {o.status === 'ACCEPTED' && (
                      <button onClick={() => change(o.id, 'PREPARING')} disabled={updating === o.id} className="text-primary text-sm hover:underline disabled:opacity-50">Prepare</button>
                    )}
                    {o.status === 'PREPARING' && (
                      <button onClick={() => change(o.id, 'READY')} disabled={updating === o.id} className="text-primary text-sm hover:underline disabled:opacity-50">Mark Ready</button>
                    )}
                    {o.status === 'READY' && (
                      <button onClick={() => change(o.id, 'COMPLETED')} disabled={updating === o.id} className="text-primary text-sm hover:underline disabled:opacity-50">Complete</button>
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

export default OrdersReceived;