import api from './api';

const aiService = {
  scanImage: async (imageFile, onRetry) => {
    const formData = new FormData();
    formData.append('file', imageFile);

    const request = () => api.post('/disease-scanner/scan', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    try {
      const response = await request();
      return response.data;
    } catch (error) {
      const shouldRetry = !error.response
        || [502, 503, 504].includes(error.response.status);
      if (!shouldRetry) throw error;

      onRetry?.();
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const response = await request();
      return response.data;
    }
  },

  getScanHistory: async () => {
    const response = await api.get('/disease-scanner/history');
    return response.data;
  },
};

export default aiService;