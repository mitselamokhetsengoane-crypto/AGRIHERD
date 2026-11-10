import { Link, Navigate, useLocation } from 'react-router-dom';
import { formatCurrency } from '../../utils/formatters';
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { marketplaceBasePath } from '../../utils/marketplacePaths';

const OrderConfirmation = () => {
  const { user } = useContext(AuthContext);
  const marketplacePath = marketplaceBasePath(user?.role);
  const { state } = useLocation();
  const result = state?.result;

  if (!result) return <Navigate to={`${marketplacePath}/orders`} replace />;

  return (
    <section className="mx-auto max-w-2xl rounded-xl border border-gray-100 bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-bold text-maintext text-center">Order placed</h1>
      <p className="mt-2 text-subtext text-center">
        Your order was submitted successfully.
      </p>

      <div className="mt-6 space-y-3">
        {result.orders?.map((order) => (
          <div key={order.id} className="border rounded-md p-4 flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-maintext">Order #{order.id.slice(0, 8)}</p>
              <p className="text-xs text-subtext">Status: {order.status}</p>
            </div>
            <p className="text-primary font-bold">{formatCurrency(order.total)}</p>
          </div>
        ))}
      </div>

      {result.is_simulated && (
        <p className="mt-4 text-center text-xs text-error font-medium">
          Demonstration payment — no real money was transferred.
        </p>
      )}

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link to={`${marketplacePath}/orders`} className="rounded-md bg-primary px-5 py-2 font-medium text-white hover:bg-green-800">
          View My Orders
        </Link>
        <Link to={marketplacePath} className="rounded-md border border-gray-300 px-5 py-2 font-medium text-gray-700 hover:bg-gray-50">
          Continue Shopping
        </Link>
      </div>
    </section>
  );
};

export default OrderConfirmation;