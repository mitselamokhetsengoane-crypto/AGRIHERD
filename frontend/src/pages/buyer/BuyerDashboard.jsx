import { useState, useEffect, useContext, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import authService from '../../services/authService';
import marketplaceService from '../../services/marketplaceService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import StatCard from '../../components/dashboard/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import SearchInput from '../../components/common/SearchInput';
import EmptyState from '../../components/common/EmptyState';
import LoadingIndicator from '../../components/common/LoadingIndicator';
import ErrorMessage from '../../components/common/ErrorMessage';
import {
  Store,
  ShoppingCart,
  Package,
  Clock,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Tag,
  Plus,
  Truck,
  Sparkles,
} from 'lucide-react';

const BuyerDashboard = () => {
  const { user, updateUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const [profile, setProfile] = useState(user);
  const [orders, setOrders] = useState([]);
  const [cart, setCart] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [addingToCartId, setAddingToCartId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const loadDashboard = async () => {
      setLoading(true);
      setError('');
      try {
        const [profileData, orderData, cartData, productData, categoryData] =
          await Promise.allSettled([
            authService.getProfile(),
            marketplaceService.getMyOrders(),
            marketplaceService.getCart(),
            marketplaceService.getAllProducts(),
            marketplaceService.getCategories(),
          ]);

        if (!active) return;

        if (profileData.status === 'fulfilled') {
          setProfile(profileData.value);
          updateUser(profileData.value);
        }
        if (orderData.status === 'fulfilled') setOrders(orderData.value || []);
        if (cartData.status === 'fulfilled') setCart(cartData.value || null);
        if (productData.status === 'fulfilled') setProducts(productData.value || []);
        if (categoryData.status === 'fulfilled') setCategories(categoryData.value || []);
      } catch (err) {
        console.error('Failed to load buyer dashboard:', err);
        if (active) {
          setError(
            err.response?.data?.detail || 'Could not load your buyer dashboard.'
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadDashboard();
    return () => {
      active = false;
    };
  }, []);

  const handleAddToCart = async (e, productId) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      setAddingToCartId(productId);
      const updatedCart = await marketplaceService.addToCart(productId, 1);
      setCart(updatedCart);
    } catch (err) {
      console.error('Failed to add product to cart:', err);
      alert(err.response?.data?.detail || 'Could not add product to cart.');
    } finally {
      setAddingToCartId(null);
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      const matchesCategory =
        !selectedCategory || prod.category_id === selectedCategory;
      const matchesSearch =
        !searchQuery ||
        prod.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prod.description?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  const pendingOrders = orders.filter((o) =>
    ['PENDING', 'ACCEPTED', 'PREPARING', 'READY'].includes(o.status)
  );
  const completedOrders = orders.filter((o) => o.status === 'COMPLETED');

  if (loading) {
    return <LoadingIndicator label="Loading marketplace dashboard..." />;
  }

  return (
    <div className="space-y-7">
      {error && <ErrorMessage message={error} />}

      {/* 1. Header with Search and Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-navy via-slate-900 to-navy p-6 sm:p-8 text-white shadow-md">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-1.5 max-w-xl">
            <span className="inline-flex items-center gap-1 rounded-full bg-secondary/30 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">
              <Sparkles className="h-3 w-3" />
              Verified Agricultural Marketplace
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {profile?.full_name || 'Buyer'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Source fresh agricultural produce, grains, and livestock directly from verified local farmers.
            </p>
          </div>

          <div className="w-full md:w-80 shrink-0">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              onClear={() => setSearchQuery('')}
              placeholder="Search crops, produce, seeds..."
            />
          </div>
        </div>
      </div>

      {/* 2. Top Statistic Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Orders"
          value={orders.length}
          icon={<Package className="h-5 w-5" />}
          color="secondary"
          link="/buyer/marketplace/orders"
          subtitle="All lifetime orders"
        />
        <StatCard
          title="In Transit / Processing"
          value={pendingOrders.length}
          icon={<Truck className="h-5 w-5" />}
          color={pendingOrders.length > 0 ? 'warning' : 'neutral'}
          link="/buyer/marketplace/orders"
          subtitle={pendingOrders.length > 0 ? 'Active fulfillment' : 'No pending deliveries'}
        />
        <StatCard
          title="Completed Orders"
          value={completedOrders.length}
          icon={<CheckCircle2 className="h-5 w-5" />}
          color="primary"
          link="/buyer/marketplace/orders"
          subtitle="Delivered successfully"
        />
        <StatCard
          title="Shopping Cart"
          value={`${cart?.item_count || 0} item${cart?.item_count === 1 ? '' : 's'}`}
          icon={<ShoppingCart className="h-5 w-5" />}
          color="navy"
          link="/buyer/marketplace/cart"
          subtitle={
            cart?.total_amount
              ? `Subtotal: ${formatCurrency(cart.total_amount)}`
              : 'Cart is empty'
          }
        />
      </div>

      {/* 3. Product Categories Filter Bar */}
      {categories.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-maintext">Browse by Category</h2>
            {selectedCategory && (
              <button
                type="button"
                onClick={() => setSelectedCategory(null)}
                className="text-xs font-semibold text-secondary hover:underline"
              >
                Clear filter
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedCategory(null)}
              className={`rounded-xl px-4 py-2 text-xs font-semibold whitespace-nowrap transition-all shadow-sm ${
                selectedCategory === null
                  ? 'bg-secondary text-white'
                  : 'bg-white border border-gray-100 text-maintext hover:bg-gray-50'
              }`}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`rounded-xl px-4 py-2 text-xs font-semibold whitespace-nowrap transition-all shadow-sm ${
                  selectedCategory === cat.id
                    ? 'bg-secondary text-white'
                    : 'bg-white border border-gray-100 text-maintext hover:bg-gray-50'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 4. Featured Agricultural Products */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-maintext">Featured Produce & Livestock</h2>
            <p className="text-xs text-subtext">Direct from harvest, ready for order</p>
          </div>
          <Link
            to="/buyer/marketplace"
            className="inline-flex items-center gap-1 text-xs font-bold text-secondary hover:underline"
          >
            Explore Marketplace
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {filteredProducts.length === 0 ? (
          <EmptyState
            title="No Products Match"
            description={
              searchQuery || selectedCategory
                ? 'Try adjusting your search query or category filter.'
                : 'No agricultural products are currently listed for sale.'
            }
            actionText="Clear Filters"
            onAction={() => {
              setSearchQuery('');
              setSelectedCategory(null);
            }}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredProducts.slice(0, 8).map((product) => (
              <Link
                key={product.id}
                to={`/buyer/marketplace/product/${product.id}`}
                className="group flex flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-gray-200 hover:shadow-md"
              >
                {/* Product Image Container */}
                <div className="relative h-44 w-full bg-gray-50 overflow-hidden">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-emerald-50/50 text-secondary">
                      <Store className="h-12 w-12 opacity-40" />
                    </div>
                  )}
                  {product.category_name && (
                    <span className="absolute top-2.5 left-2.5 rounded-lg bg-black/60 backdrop-blur-sm px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                      {product.category_name}
                    </span>
                  )}
                </div>

                {/* Details */}
                <div className="flex flex-1 flex-col justify-between p-4 space-y-3">
                  <div>
                    <h3 className="font-bold text-sm text-maintext group-hover:text-secondary transition line-clamp-1">
                      {product.name}
                    </h3>
                    <p className="mt-0.5 text-xs text-subtext line-clamp-2">
                      {product.description || 'Fresh agricultural product directly from verified farm.'}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-gray-50 flex items-center justify-between">
                    <div>
                      <p className="text-base font-extrabold text-secondary">
                        {formatCurrency(product.price)}
                      </p>
                      <p className="text-[10px] text-subtext">
                        {product.unit ? `per ${product.unit}` : 'per item'} &bull; {product.stock_quantity || 0} in stock
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleAddToCart(e, product.id)}
                      disabled={addingToCartId === product.id || product.stock_quantity <= 0}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-white shadow-sm transition hover:bg-emerald-800 disabled:opacity-50"
                      title="Add to Cart"
                    >
                      {addingToCartId === product.id ? (
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* 5. Recent Orders & Shopping Cart Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent Orders List */}
        <div className="lg:col-span-2 rounded-xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-50 pb-3">
            <div>
              <h3 className="text-base font-bold text-maintext">Recent Orders</h3>
              <p className="text-xs text-subtext">Track purchase status and delivery</p>
            </div>
            <Link
              to="/buyer/marketplace/orders"
              className="text-xs font-semibold text-secondary hover:underline"
            >
              View All Orders
            </Link>
          </div>

          {orders.length === 0 ? (
            <div className="py-8 text-center">
              <EmptyState
                title="No Orders Placed Yet"
                description="Start browsing our fresh agricultural produce to place your first order."
                actionText="Browse Marketplace"
                actionLink="/buyer/marketplace"
                compact
              />
            </div>
          ) : (
            <div className="space-y-2.5">
              {orders.slice(0, 5).map((order) => (
                <Link
                  key={order.id}
                  to={`/buyer/marketplace/orders/${order.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50/40 p-3.5 transition hover:border-gray-200 hover:bg-white"
                >
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-maintext">
                      Order #{order.id?.slice(0, 8)}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-subtext">
                      <Clock className="h-3 w-3" />
                      <span>{order.created_at ? formatDate(order.created_at) : 'Recent'}</span>
                      <span>&bull;</span>
                      <span>{order.item_count || 1} item{order.item_count === 1 ? '' : 's'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xs font-bold text-maintext">
                        {formatCurrency(order.total_amount)}
                      </p>
                    </div>
                    <StatusBadge status={order.status} size="xs" />
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Cart Quick Summary */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm flex flex-col justify-between space-y-4">
          <div className="border-b border-gray-50 pb-3">
            <h3 className="text-base font-bold text-maintext">Cart Summary</h3>
            <p className="text-xs text-subtext">Items ready for checkout</p>
          </div>

          <div className="flex-1 flex flex-col justify-center py-4">
            {!cart || !cart.item_count ? (
              <div className="text-center py-6 text-subtext">
                <ShoppingCart className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-maintext">Your Cart is Empty</p>
                <p className="text-[11px] text-subtext mt-1">Explore listings and add produce to checkout.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between text-xs text-subtext">
                  <span>Total Items</span>
                  <span className="font-semibold text-maintext">{cart.item_count}</span>
                </div>
                <div className="flex justify-between text-xs text-subtext">
                  <span>Estimated Total</span>
                  <span className="font-bold text-base text-secondary">
                    {formatCurrency(cart.total_amount)}
                  </span>
                </div>
              </div>
            )}
          </div>

          <Link
            to="/buyer/marketplace/cart"
            className="flex items-center justify-center gap-2 w-full rounded-xl bg-secondary py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-800 transition"
          >
            <ShoppingCart className="h-4 w-4" />
            <span>Go to Shopping Cart</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BuyerDashboard;
