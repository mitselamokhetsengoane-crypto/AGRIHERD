import { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import marketplaceService from '../../services/marketplaceService';
import { formatCurrency } from '../../utils/formatters';
import { AuthContext } from '../../context/AuthContext';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');

  const isBuyer = user?.role === 'buyer';

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const data = await marketplaceService.getProductById(id);
        setProduct(data);
      } catch (err) {
        setError(err.response?.data?.detail || 'Product not found.');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleAddToCart = async () => {
    if (!isBuyer) {
      setAddError('Only buyer accounts can add products to a cart.');
      return;
    }
    setAdding(true);
    setAddError('');
    try {
      await marketplaceService.addToCart(product.id, quantity);
      navigate('/marketplace/cart');
    } catch (err) {
      setAddError(err.response?.data?.detail || 'Could not add to cart.');
    } finally {
      setAdding(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-subtext">Loading product details...</div>;
  if (error || !product) return <div className="p-8 text-center text-error">{error || 'Product not found.'}</div>;

  const available = Number(product.quantity_available || 0);
  const outOfStock = available <= 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link to="/marketplace" className="text-primary hover:underline text-sm">← Back to Marketplace</Link>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col md:flex-row">
        <div className="md:w-1/2 h-64 md:h-auto bg-gray-200">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-subtext text-sm">
              No image available
            </div>
          )}
        </div>
        <div className="md:w-1/2 p-8 space-y-4">
          <h1 className="text-3xl font-bold text-maintext">{product.name}</h1>
          {product.category && <p className="text-subtext">{product.category}</p>}
          <p className="text-2xl font-bold text-primary">
            {formatCurrency(product.price)}
            {product.unit && <span className="text-sm font-normal text-subtext"> / {product.unit}</span>}
          </p>

          <div className="text-sm text-subtext">
            <span className={outOfStock ? 'text-error font-medium' : 'text-primary font-medium'}>
              {outOfStock ? 'Out of stock' : `${available} available`}
            </span>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <h3 className="font-semibold text-maintext mb-2">Description</h3>
            <p className="text-subtext text-sm leading-relaxed">
              {product.description || 'No description provided.'}
            </p>
          </div>

          {!outOfStock && (
            <div className="pt-4 border-t border-gray-100 space-y-3">
              <div className="flex items-center gap-4">
                <label className="font-semibold text-maintext">Quantity:</label>
                <input
                  type="number"
                  min="1"
                  max={available}
                  value={quantity}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10) || 1;
                    setQuantity(Math.min(Math.max(1, v), available));
                  }}
                  className="border border-gray-300 rounded-md px-3 py-1 w-24 focus:outline-none focus:border-primary"
                />
              </div>

              {addError && <p className="text-error text-sm">{addError}</p>}

              {isBuyer ? (
                <button
                  onClick={handleAddToCart}
                  disabled={adding}
                  className="w-full bg-primary text-white py-3 rounded-md hover:bg-green-800 transition disabled:opacity-60"
                >
                  {adding ? 'Adding...' : 'Add to Cart'}
                </button>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm p-3 rounded-md">
                  Only buyer accounts can add products to a cart. You are signed in as a <strong>{user?.role || 'guest'}</strong>.
                </div>
              )}
            </div>
          )}

          {outOfStock && (
            <div className="bg-red-50 border border-red-200 text-error text-sm p-3 rounded-md">
              This product is currently out of stock.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;