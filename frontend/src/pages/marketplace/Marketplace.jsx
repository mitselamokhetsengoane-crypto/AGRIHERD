import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import marketplaceService from '../../services/marketplaceService';
import { formatCurrency } from '../../utils/formatters';
import { marketplaceBasePath } from '../../utils/marketplacePaths';
import { AuthContext } from '../../context/AuthContext';

const Marketplace = () => {
  const { user } = useContext(AuthContext);
  const marketplacePath = marketplaceBasePath(user?.role);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [p, c] = await Promise.all([
          marketplaceService.getAllProducts(),
          marketplaceService.getCategories(),
        ]);
        setProducts(p);
        setCategories(c);
      } catch (err) {
        setError(err.response?.data?.detail || 'Could not load marketplace products.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = products.filter((p) => {
    const matchesSearch =
      (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.category || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.seller?.full_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = !activeCategory || p.category_id === activeCategory;
    return matchesSearch && matchesCat;
  });

  if (loading) return <div className="p-8 text-center text-subtext">Loading marketplace...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl font-bold text-maintext">Marketplace</h1>
        <input type="text" placeholder="Search products..." value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border border-gray-300 rounded-md px-4 py-2 w-full md:w-64 focus:outline-none focus:border-primary" />
      </div>
      {error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-error">{error}</p>}

      <div className="flex flex-wrap gap-2">
        <button onClick={() => setActiveCategory('')}
          className={`px-3 py-1 rounded-full text-sm ${!activeCategory ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-maintext'}`}>
          All
        </button>
        {categories.map((c) => (
          <button key={c.id} onClick={() => setActiveCategory(c.id)}
            className={`px-3 py-1 rounded-full text-sm ${activeCategory === c.id ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-maintext'}`}>
            {c.name}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white p-8 text-center rounded-xl shadow-sm border border-gray-100">
          <p className="text-subtext">No products found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filtered.map((product) => (
            <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
              <div className="h-48 bg-gray-200">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="h-full flex items-center justify-center text-sm text-subtext">No image available</div>
                )}
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <h3 className="font-bold text-maintext">{product.name}</h3>
                <p className="text-sm text-subtext mb-2">{product.category}</p>
                <p className="text-sm text-subtext">
                  {product.seller?.farm_name || product.seller?.full_name || 'Seller information unavailable'}
                </p>
                <p className="text-sm text-subtext">
                  {Number(product.quantity_available)} {product.unit || 'available'}
                </p>
                <p className="text-lg font-bold text-primary mt-auto">
                  {formatCurrency(product.price)}{product.unit ? ` / ${product.unit}` : ''}
                </p>
                <Link to={`${marketplacePath}/product/${product.id}`}
                  className="mt-4 bg-primary text-white text-center py-2 rounded-md hover:bg-green-800 transition">
                  View Product
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
        </div>
  );
};

export default Marketplace;