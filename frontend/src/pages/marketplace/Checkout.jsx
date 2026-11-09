import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import marketplaceService from '../../services/marketplaceService';

const Checkout = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    customer_name: '',
    phone: '',
    delivery_location: '',
    notes: '',
    payment_method: 'CASH',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await marketplaceService.checkout(formData);
      navigate('/marketplace/order-confirmation', { state: { result } });
    } catch (err) {
      setError(err.response?.data?.detail || 'Your order could not be submitted. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-maintext">Checkout</h1>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
        {error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-error">{error}</p>}

        <div>
          <label className="block text-sm text-subtext mb-1">Full Name</label>
          <input required type="text" value={formData.customer_name}
            onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-4 py-2 focus:border-primary" />
        </div>
        <div>
          <label className="block text-sm text-subtext mb-1">Phone Number</label>
          <input required type="text" value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-4 py-2 focus:border-primary" />
        </div>
        <div>
          <label className="block text-sm text-subtext mb-1">Delivery Location</label>
          <input required type="text" value={formData.delivery_location}
            onChange={(e) => setFormData({ ...formData, delivery_location: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-4 py-2 focus:border-primary" />
        </div>
        <div>
          <label className="block text-sm text-subtext mb-1">Order Notes (Optional)</label>
          <textarea rows="2" value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-4 py-2 focus:border-primary" />
        </div>
        <div>
          <label className="block text-sm text-subtext mb-1">Payment Method</label>
          <select value={formData.payment_method}
            onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-4 py-2 focus:border-primary">
            <option value="CASH">Cash on Delivery / Collection</option>
            <option value="MOBILE_MONEY">Mobile Money (Demonstration — no real money)</option>
            <option value="CARD">Card (Demonstration — no real money)</option>
          </select>
          {formData.payment_method !== 'CASH' && (
            <p className="mt-2 text-xs text-error font-medium">
              Demonstration payment — no real money is transferred.
            </p>
          )}
        </div>

        <button disabled={loading} type="submit"
          className="w-full bg-primary text-white py-3 rounded-md hover:bg-green-800 transition disabled:opacity-50">
          {loading ? 'Processing...' : 'Place Order'}
        </button>
        <div className="text-center">
          <Link to="/marketplace/cart" className="text-primary text-sm hover:underline">← Back to Cart</Link>
        </div>
      </form>
    </div>
  );
};

export default Checkout;