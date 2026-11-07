import api from './api';

const cropService = {
  getAllCrops: async () => {
    const response = await api.get('/crops');
    return response.data;
  },
  getCropById: async (id) => {
    const response = await api.get(`/crops/${id}`);
    return response.data;
  },
  createCrop: async (data) => {
    const response = await api.post('/crops', data);
    return response.data;
  },
  updateCrop: async (id, data) => {
    const response = await api.put(`/crops/${id}`, data);
    return response.data;
  },
  deleteCrop: async (id) => {
    const response = await api.delete(`/crops/${id}`);
    return response.data;
  },
  getHarvestRecords: async () => {
    const response = await api.get('/crops/harvests');
    return response.data;
  }
};

export default cropService;