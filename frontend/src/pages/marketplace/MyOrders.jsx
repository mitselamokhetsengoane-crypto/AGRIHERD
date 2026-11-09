import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import marketplaceService from '../../services/marketplaceService';
import { formatCurrency, formatDate, getStatusColor } from '../../utils/formatters';

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await marketplaceService.getMyOrders();
        setOrders(data);
      } catch (err) {
        setError(err.response?.data?.detail || 'Could not load orders.');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  if (loading) return <div className="p-8 text-center text-subtext">Loading orders...</div>;
  if (error) return <div className="p-8 text-center text-error">{error}</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-maintext">My Orders</h1>

      {orders.length === 0 ? (
        <div className="bg-white p-8 text-center rounded-xl shadow-sm border border-gray-100">
          <p className="text-subtext">You have not placed any orders yet.</p>
          <Link to="/marketplace" className="text-primary hover:underline mt-2 inline-block">Start Shopping</Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-subtext text-sm border-b">
              <tr>
                <th className="p-4 font-medium">Order ID</th>
                <th className="p-4 font-medium">Date</th>
                <th className="p-4 font-medium">Total</th>
                <th className="p-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-background">
                  <td className="p-4 font-medium text-maintext">#{order.id.slice(0, 8)}</td>
                  <td className="p-4 text-subtext">{formatDate(order.created_at)}</td>
                  <td className="p-4 font-bold text-primary">{formatCurrency(order.total)}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
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

export default MyOrders;