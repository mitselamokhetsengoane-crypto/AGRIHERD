import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import marketplaceService from '../../services/marketplaceService';

const Checkout = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    customer_name: '',
    phone: '',
    delivery_location: '',
    notes: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const order = await marketplaceService.checkout(formData);
      navigate('/marketplace/order-confirmation', { state: { order } });
    } catch (requestError) {
      console.error('Checkout failed', requestError);
      setError('Your order could not be submitted. Please check your details and try again.');
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
          <input required type="text" className="w-full border border-gray-300 rounded-md px-4 py-2 focus:border-primary" 
            value={formData.customer_name} onChange={e => setFormData({...formData, customer_name: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm text-subtext mb-1">Phone Number</label>
          <input required type="text" className="w-full border border-gray-300 rounded-md px-4 py-2 focus:border-primary" 
            value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm text-subtext mb-1">Delivery Location</label>
          <input required type="text" className="w-full border border-gray-300 rounded-md px-4 py-2 focus:border-primary" 
            value={formData.delivery_location} onChange={e => setFormData({...formData, delivery_location: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm text-subtext mb-1">Order Notes (Optional)</label>
          <textarea className="w-full border border-gray-300 rounded-md px-4 py-2 focus:border-primary" rows="2"
            value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})}></textarea>
        </div>
        <button disabled={loading} type="submit" className="w-full bg-primary text-white py-3 rounded-md hover:bg-green-800 transition disabled:opacity-50">
          {loading ? 'Processing...' : 'Place Order'}
        </button>
      </form>
    </div>
  );
};

export default Checkout;