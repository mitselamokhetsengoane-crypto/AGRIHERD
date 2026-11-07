import api from './api';

const inventoryService = {
  getAllItems: async () => {
    const response = await api.get('/inventory/');
    return response.data;
  },
  getItemById: async (id) => {
    const response = await api.get(`/inventory/${id}`);
    return response.data;
  },
  createItem: async (data) => {
    const response = await api.post('/inventory/', data);
    return response.data;
  },
  updateItem: async (id, data) => {
    const response = await api.put(`/inventory/${id}`, data);
    return response.data;
  },
  deleteItem: async (id) => {
    const response = await api.delete(`/inventory/${id}`);
    return response.data;
  },
  updateStock: async (id, data) => {
    const response = await api.post(`/inventory/${id}/stock`, data);
    return response.data;
  },
  getStockHistory: async () => {
    const response = await api.get('/inventory/history');
    return response.data;
  },
  getLowStockAlerts: async () => {
    const response = await api.get('/inventory/low-stock');
    return response.data;
  }
};

export default inventoryService;