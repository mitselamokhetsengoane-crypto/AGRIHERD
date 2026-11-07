import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import marketplaceService from '../../services/marketplaceService';
import { formatCurrency } from '../../utils/formatters';

const Cart = () => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const data = await marketplaceService.getCart();
      setCart(data);
    } catch (error) {
      console.error("Failed to load cart", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (itemId) => {
    try {
      await marketplaceService.removeFromCart(itemId);
      fetchCart(); // Refresh cart
    } catch (error) {
      alert("Failed to remove item");
    }
  };

  if (loading) return <div className="p-8 text-center text-subtext">Loading cart...</div>;
  if (!cart || cart.items.length === 0) return (
    <div className="p-8 text-center bg-white rounded-xl shadow-sm border border-gray-100">
      <p className="text-subtext mb-4">Your cart is empty.</p>
      <Link to="/marketplace" className="text-primary hover:underline">Go back to Marketplace</Link>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-maintext">Your Cart</h1>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
        {cart.items.map((item) => (
          <div key={item.id} className="p-4 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-maintext">{item.product.name}</h3>
              <p className="text-sm text-subtext">Qty: {item.quantity}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-primary">{formatCurrency(item.product.price * item.quantity)}</p>
              <button onClick={() => handleRemove(item.id)} className="text-error text-sm hover:underline mt-1">Remove</button>
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