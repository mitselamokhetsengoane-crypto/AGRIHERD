import api from './api';

const marketplaceService = {
  getAllProducts: async () => {
    const response = await api.get('/marketplace/products');
    return response.data;
  },
  getProductById: async (id) => {
    const response = await api.get(`/marketplace/products/${id}`);
    return response.data;
  },
  getCart: async () => {
    const response = await api.get('/marketplace/cart');
    return response.data;
  },
  addToCart: async (productId, quantity) => {
    const response = await api.post('/marketplace/cart', { product_id: productId, quantity });
    return response.data;
  },
  removeFromCart: async (cartItemId) => {
    const response = await api.delete(`/marketplace/cart/${cartItemId}`);
    return response.data;
  },
  checkout: async (orderData) => {
    const response = await api.post('/marketplace/checkout', orderData);
    return response.data;
  },
  getMyOrders: async () => {
    const response = await api.get('/marketplace/orders');
    return response.data;
  },
  getOrderById: async (id) => {
    const response = await api.get(`/marketplace/orders/${id}`);
    return response.data;
  }
};

export default marketplaceService;