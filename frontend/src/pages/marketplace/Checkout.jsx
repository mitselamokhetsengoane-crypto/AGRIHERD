import { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import marketplaceService from '../../services/marketplaceService';
import { AuthContext } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/formatters';
import { marketplaceBasePath } from '../../utils/marketplacePaths';

const Checkout = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const marketplacePath = marketplaceBasePath(user?.role);
  const idempotencyKey = useRef(
    window.sessionStorage.getItem('marketplace-checkout-key') || crypto.randomUUID()
  );
  const [cart, setCart] = useState(null);
  const [cartLoading, setCartLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    customer_name: user?.full_name || '',
    phone: user?.phone || '',
    delivery_location: user?.location || '',
    notes: '',
    payment_method: 'CASH',
  });

  useEffect(() => {
    window.sessionStorage.setItem('marketplace-checkout-key', idempotencyKey.current);
    marketplaceService.getCart()
      .then(setCart)
      .catch((err) => setError(err.response?.data?.detail || 'Could not load your cart.'))
      .finally(() => setCartLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await marketplaceService.checkout({
        ...formData,
        idempotency_key: idempotencyKey.current,
      });
      window.sessionStorage.removeItem('marketplace-checkout-key');
      navigate(`${marketplacePath}/order-confirmation`, { state: { result } });
    } catch (err) {
      setError(err.response?.data?.detail || 'Your order could not be submitted. You can safely retry.');
    } finally {
      setLoading(false);
    }
  };

  if (cartLoading) return <div className="p-8 text-center text-subtext">Loading checkout...</div>;
  if (!cart?.items?.length) {
    return (
      <div className="p-8 text-center bg-white rounded-xl shadow-sm border border-gray-100">
        <p className="text-subtext mb-4">Your cart is empty.</p>
        <Link to={`${marketplacePath}/cart`} className="text-primary hover:underline">Return to cart</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-maintext">Checkout</h1>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
        {error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-error">{error}</p>}

        <section className="space-y-3 border-b border-gray-100 pb-4">
          <h2 className="font-semibold text-maintext">Order summary</h2>
          {cart.items.map((item) => (
            <div key={item.id} className="flex justify-between gap-4 text-sm">
              <span>{item.product.name} × {item.quantity}</span>
              <span className="font-medium">{formatCurrency(item.line_total)}</span>
            </div>
          ))}
          <div className="flex justify-between border-t pt-3 font-bold">
            <span>Subtotal and total</span>
            <span className="text-primary">{formatCurrency(cart.total)}</span>
          </div>
          <p className="text-xs text-subtext">Delivery or collection arrangements are confirmed with the seller.</p>
        </section>

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
          <Link to={`${marketplacePath}/cart`} className="text-primary text-sm hover:underline">← Back to Cart</Link>
        </div>
      </form>
    </div>
  );
};

export default Checkout;