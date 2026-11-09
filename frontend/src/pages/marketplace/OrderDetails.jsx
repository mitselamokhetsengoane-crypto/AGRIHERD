import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import marketplaceService from '../../services/marketplaceService';
import { formatCurrency, formatDate, getStatusColor } from '../../utils/formatters';

const OrderDetails = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setData(await marketplaceService.getOrderById(id));
      } catch (err) {
        setError(err.response?.data?.detail || 'Could not load order.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return <div className="p-8 text-center text-subtext">Loading order...</div>;
  if (error) return <div className="p-8 text-center text-error">{error}</div>;
  if (!data) return null;

  const { order, items, payment } = data;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link to={-1} className="text-primary hover:underline text-sm">← Back</Link>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-start border-b pb-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-maintext">Order #{order.id.slice(0, 8)}</h1>
            <p className="text-sm text-subtext">{formatDate(order.created_at)}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(order.status)}`}>
            {order.status}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div><p className="text-sm text-subtext">Customer</p><p className="font-medium">{order.customer_name}</p></div>
          <div><p className="text-sm text-subtext">Phone</p><p className="font-medium">{order.phone}</p></div>
          <div className="col-span-2"><p className="text-sm text-subtext">Delivery Location</p><p className="font-medium">{order.delivery_location}</p></div>
          {order.notes && <div className="col-span-2"><p className="text-sm text-subtext">Notes</p><p className="font-medium">{order.notes}</p></div>}
        </div>

        <div className="border-t pt-4">
          <h3 className="font-semibold mb-2">Items</h3>
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span>{item.product_name} × {item.quantity}</span>
                <span className="font-medium">{formatCurrency(item.unit_price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between border-t mt-3 pt-3 font-bold">
            <span>Total</span>
            <span className="text-primary">{formatCurrency(order.total)}</span>
          </div>
        </div>

        {payment && (
          <div className="border-t mt-4 pt-4">
            <h3 className="font-semibold mb-2">Payment</h3>
            <p className="text-sm">Method: <span className="font-medium">{payment.method}</span></p>
            <p className="text-sm">Status: <span className="font-medium">{payment.status}</span></p>
            {payment.is_simulated && (
              <p className="mt-2 text-xs text-error font-medium">Demonstration payment — no real money was transferred.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderDetails;