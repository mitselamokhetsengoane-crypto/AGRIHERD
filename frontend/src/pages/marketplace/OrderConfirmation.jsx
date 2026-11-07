import { Link, Navigate, useLocation } from 'react-router-dom';

const OrderConfirmation = () => {
  const { state } = useLocation();

  if (!state?.order) return <Navigate to="/marketplace/orders" replace />;

  return (
    <section className="mx-auto max-w-xl rounded-xl border border-gray-100 bg-white p-8 text-center shadow-sm">
      <h1 className="text-2xl font-bold text-maintext">Order placed</h1>
      <p className="mt-2 text-subtext">Your order was submitted successfully. You can review its status in your orders.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link to="/marketplace/orders" className="rounded-md bg-primary px-5 py-2 font-medium text-white hover:bg-green-800">View My Orders</Link>
        <Link to="/marketplace" className="rounded-md border border-gray-300 px-5 py-2 font-medium text-gray-700 hover:bg-gray-50">Continue Shopping</Link>
      </div>
    </section>
  );
};

export default OrderConfirmation;
