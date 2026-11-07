import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import marketplaceService from '../../services/marketplaceService';
import { formatCurrency } from '../../utils/formatters';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const data = await marketplaceService.getProductById(id);
        setProduct(data);
      } catch (error) {
        console.error("Failed to load product", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleAddToCart = async () => {
    try {
      await marketplaceService.addToCart(product.id, quantity);
      alert("Added to cart!");
      navigate('/marketplace/cart');
    } catch (error) {
      alert("Failed to add to cart.");
    }
  };

  if (loading) return <div className="p-8 text-center text-subtext">Loading product details...</div>;
  if (!product) return <div className="p-8 text-center text-error">Product not found.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link to="/marketplace" className="text-primary hover:underline text-sm">Back to Marketplace</Link>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col md:flex-row">
        <div className="md:w-1/2 h-64 md:h-auto bg-gray-200">
          {product.image_url && <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />}
        </div>
        <div className="md:w-1/2 p-8 space-y-4">
          <h1 className="text-3xl font-bold text-maintext">{product.name}</h1>
          <p className="text-subtext">{product.category}</p>
          <p className="text-2xl font-bold text-primary">{formatCurrency(product.price)}</p>
          
          <div className="pt-4 border-t border-gray-100">
            <h3 className="font-semibold text-maintext mb-2">Description</h3>
            <p className="text-subtext text-sm leading-relaxed">{product.description}</p>
          </div>

          <div className="pt-4 border-t border-gray-100 flex items-center gap-4">
            <label className="font-semibold text-maintext">Quantity:</label>
            <input 
              type="number" 
              min="1" 
              value={quantity} 
              onChange={(e) => setQuantity(parseInt(e.target.value))}
              className="border border-gray-300 rounded-md px-3 py-1 w-20 focus:outline-none focus:border-primary"
            />
          </div>

          <button 
            onClick={handleAddToCart}
            className="w-full bg-primary text-white py-3 rounded-md hover:bg-green-800 transition mt-6"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;