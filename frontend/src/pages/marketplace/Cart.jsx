import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import marketplaceService from '../../services/marketplaceService';
import { formatCurrency } from '../../utils/formatters';

const Cart = () => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const navigate = useNavigate();

  const fetchCart = async () => {
    try {
      setError('');
      const data = await marketplaceService.getCart();
      setCart(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not load cart.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const handleRemove = async (itemId) => {
    setUpdatingId(itemId);
    try {
      const updated = await marketplaceService.removeFromCart(itemId);
      setCart(updated);
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not remove item.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleQuantity = async (itemId, quantity) => {
    if (quantity <= 0) return;
    setUpdatingId(itemId);
    try {
      const updated = await marketplaceService.updateCartItem(itemId, quantity);
      setCart(updated);
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not update quantity.');
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) return <div className="p-8 text-center text-subtext">Loading cart...</div>;
  if (error) return <div className="p-8 text-center text-error">{error}</div>;

  if (!cart || cart.items.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-xl shadow-sm border border-gray-100">
        <p className="text-subtext mb-4">Your cart is empty.</p>
        <Link to="/marketplace" className="text-primary hover:underline">Go back to Marketplace</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-maintext">Your Cart</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
        {cart.items.map((item) => (
          <div key={item.id} className="p-4 flex items-center justify-between gap-4">
            <div className="flex-1">
              <h3 className="font-bold text-maintext">{item.product.name}</h3>
              <p className="text-sm text-subtext">{formatCurrency(item.product.price)} / {item.product.unit || 'unit'}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleQuantity(item.id, item.quantity - 1)}
                disabled={updatingId === item.id || item.quantity <= 1}
                className="w-8 h-8 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-40"
              >−</button>
              <span className="w-10 text-center font-medium">{item.quantity}</span>
              <button
                type="button"
                onClick={() => handleQuantity(item.id, item.quantity + 1)}
                disabled={updatingId === item.id}
                className="w-8 h-8 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-40"
              >+</button>
            </div>
            <div className="w-24 text-right">
              <p className="font-bold text-primary">{formatCurrency(item.line_total)}</p>
              <button
                onClick={() => handleRemove(item.id)}
                disabled={updatingId === item.id}
                className="text-error text-sm hover:underline mt-1 disabled:opacity-50"
              >Remove</button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
        <span className="text-lg font-bold text-maintext">Total:</span>
        <span className="text-2xl font-bold text-primary">{formatCurrency(cart.total)}</span>
      </div>

      <button
        onClick={() => navigate('/marketplace/checkout')}
        className="w-full bg-primary text-white py-3 rounded-md hover:bg-green-800 transition font-bold"
      >
        Proceed to Checkout
      </button>
    </div>
  );
};

export default Cart;