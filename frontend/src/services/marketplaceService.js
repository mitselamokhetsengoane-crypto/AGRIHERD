import api from './api';

const marketplaceService = {
  // categories
  getCategories: async () => (await api.get('/marketplace/categories')).data,
  getAllCategoriesAdmin: async () => (await api.get('/marketplace/categories/all')).data,
  createCategory: async (data) => (await api.post('/marketplace/categories', data)).data,
  deleteCategory: async (id) => (await api.delete(`/marketplace/categories/${id}`)).data,

  // products
  getAllProducts: async (categoryId) => {
    const params = categoryId ? { category_id: categoryId } : {};
    return (await api.get('/marketplace/products', { params })).data;
  },
  getProductById: async (id) => (await api.get(`/marketplace/products/${id}`)).data,
  getMyListings: async () => (await api.get('/marketplace/listings/mine')).data,
  createProduct: async (data) => (await api.post('/marketplace/products', data)).data,
  updateProduct: async (id, data) => (await api.put(`/marketplace/products/${id}`, data)).data,
  deactivateProduct: async (id) => (await api.delete(`/marketplace/products/${id}`)).data,

  // cart
  getCart: async () => (await api.get('/marketplace/cart')).data,
  addToCart: async (productId, quantity) => (await api.post('/marketplace/cart', { product_id: productId, quantity })).data,
  updateCartItem: async (itemId, quantity) => (await api.put(`/marketplace/cart/${itemId}`, { quantity })).data,
  removeFromCart: async (itemId) => (await api.delete(`/marketplace/cart/${itemId}`)).data,

  // checkout & orders
  checkout: async (data) => (await api.post('/marketplace/checkout', data)).data,
  getMyOrders: async () => (await api.get('/marketplace/orders')).data,
  getOrderById: async (id) => (await api.get(`/marketplace/orders/${id}`)).data,
  updateOrderStatus: async (id, status) => (await api.patch(`/marketplace/orders/${id}/status`, { status })).data,

  // admin
  adminGetAllListings: async () => (await api.get('/marketplace/admin/listings')).data,
  adminDeactivateProduct: async (id) => (await api.patch(`/marketplace/admin/products/${id}/deactivate`)).data,
};

export default marketplaceService;