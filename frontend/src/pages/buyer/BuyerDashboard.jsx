import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const BuyerDashboard = () => {
  const { user } = useContext(AuthContext);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-maintext">
          Welcome, {user?.full_name || 'Buyer'}!
        </h1>
        <p className="text-subtext mt-1">
          Your buyer account is set up. Marketplace, cart and order history will appear here.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-subtext mb-1">Account Type</p>
          <p className="text-2xl font-bold text-primary capitalize">{user?.role || 'buyer'}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-subtext mb-1">Status</p>
          <p className="text-2xl font-bold text-primary">Active</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-subtext mb-1">Marketplace</p>
          <p className="text-2xl font-bold text-primary">
            <Link to="/marketplace" className="hover:underline">Browse →</Link>
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="font-bold text-maintext mb-2">What's next</h3>
        <ul className="text-sm text-subtext space-y-2 list-disc pl-5">
          <li>Browse the marketplace and add items to your cart (coming in Phase 2).</li>
          <li>Complete checkout with cash-on-delivery or a demonstration payment.</li>
          <li>Track your purchases from your Orders page.</li>
        </ul>
      </div>
    </div>
  );
};

export default BuyerDashboard;