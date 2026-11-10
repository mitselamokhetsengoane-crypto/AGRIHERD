import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import authService from '../../services/authService';
import marketplaceService from '../../services/marketplaceService';
import { formatCurrency, formatDate, getStatusColor } from '../../utils/formatters';

const BuyerDashboard = () => {
  const { user, updateUser } = useContext(AuthContext);
  const [profile, setProfile] = useState(user);
  const [orders, setOrders] = useState([]);
  const [cart, setCart] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const loadDashboard = async () => {
      try {
        const [profileData, orderData, cartData, productData] = await Promise.all([
          authService.getProfile(),
          marketplaceService.getMyOrders(),
          marketplaceService.getCart(),
          marketplaceService.getAllProducts(),
        ]);
        if (!active) return;
        setProfile(profileData);
        updateUser(profileData);
        setOrders(orderData);
        setCart(cartData);
        setProducts(productData.slice(0, 4));
      } catch (loadError) {
        if (active) {
          setError(loadError.response?.data?.detail || 'Could not load your buyer dashboard.');
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    loadDashboard();
    return () => { active = false; };
  }, []);

  if (loading) return <div className="p-8 text-center text-subtext">Loading your dashboard...</div>;

  return (
    <div className="space-y-6">
      {error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-error">{error}</p>}
      <div>
        <h1 className="text-3xl font-bold text-maintext">
          Welcome, {profile?.full_name || 'Buyer'}!
        </h1>
        <p className="text-subtext mt-1">
          Your shopping activity and orders at a glance.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-subtext mb-1">Total Orders</p>
          <p className="text-2xl font-bold text-primary">{orders.length}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-subtext mb-1">Pending Orders</p>
          <p className="text-2xl font-bold text-primary">
            {orders.filter((order) => ['PENDING', 'ACCEPTED', 'PREPARING', 'READY'].includes(order.status)).length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-subtext mb-1">Completed Orders</p>
          <p className="text-2xl font-bold text-primary">
            {orders.filter((order) => order.status === 'COMPLETED').length}
          </p>
        </div>
        <Link to="/buyer/marketplace/cart" className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:border-primary">
          <p className="text-sm text-subtext mb-1">Items in Cart</p>
          <p className="text-2xl font-bold text-primary">{cart?.item_count || 0}</p>
        </Link>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-maintext">Recent Orders</h2>
          <Link to="/buyer/marketplace/orders" className="text-sm text-primary hover:underline">View all</Link>
        </div>
        {orders.length === 0 ? (
          <div className="rounded-xl border border-gray-100 bg-white p-6 text-subtext">
            No orders yet. <Link to="/buyer/marketplace" className="text-primary hover:underline">Browse products</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.slice(0, 5).map((order) => (
              <Link
                key={order.id}
                to={`/buyer/marketplace/orders/${order.id}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm hover:border-primary"
              >
                <div>
                  <p className="font-semibold text-maintext">Order #{order.id.slice(0, 8)}</p>
                  <p className="text-sm text-subtext">{formatDate(order.created_at)}</p>
                </div>
                <span className={`rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(order.status)}`}>{order.status}</span>
                <span className="font-bold text-primary">{formatCurrency(order.total)}</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-maintext">Marketplace Products</h2>
          <Link to="/buyer/marketplace" className="text-sm text-primary hover:underline">Browse all</Link>
        </div>
        {products.length === 0 ? (
          <div className="rounded-xl border border-gray-100 bg-white p-6 text-subtext">No products are currently available.</div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => (
              <Link
                key={product.id}
                to={`/buyer/marketplace/product/${product.id}`}
                className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm hover:border-primary"
              >
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className="h-36 w-full object-cover" />
                ) : (
                  <div className="flex h-36 items-center justify-center bg-gray-100 text-sm text-subtext">No image</div>
                )}
                <div className="p-4">
                  <p className="font-semibold text-maintext">{product.name}</p>
                  <p className="text-sm text-subtext">{product.seller?.farm_name || product.seller?.full_name}</p>
                  <p className="mt-2 font-bold text-primary">{formatCurrency(product.price)} / {product.unit || 'unit'}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default BuyerDashboard;