import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import marketplaceService from '../../services/marketplaceService';
import { formatCurrency, formatDate, getStatusColor } from '../../utils/formatters';
import { AuthContext } from '../../context/AuthContext';
import { marketplaceBasePath } from '../../utils/marketplacePaths';

const MyOrders = () => {
  const { user } = useContext(AuthContext);
  const marketplacePath = marketplaceBasePath(user?.role);
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
          <Link to={marketplacePath} className="text-primary hover:underline mt-2 inline-block">Start Shopping</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link
              key={order.id}
              to={`${marketplacePath}/orders/${order.id}`}
              className="block rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition hover:border-primary"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-maintext">Order #{order.id.slice(0, 8)}</h2>
                  <p className="mt-1 text-sm text-subtext">{formatDate(order.created_at)}</p>
                </div>
                <span className={`rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(order.status)}`}>
                  {order.status}
                </span>
              </div>
              <p className="mt-3 text-sm text-subtext">
                {order.items?.map((item) => `${item.product_name} × ${item.quantity}`).join(', ') || 'Order items'}
              </p>
              <div className="mt-3 flex flex-wrap justify-between gap-2 border-t border-gray-100 pt-3 text-sm">
                <span className="text-subtext">
                  Payment: {order.payment_method || 'N/A'} ({order.payment_status || 'N/A'})
                </span>
                <span className="font-bold text-primary">{formatCurrency(order.total)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyOrders;