import api from './api';

const aiService = {
  scanImage: async (imageFile) => {
    const formData = new FormData();
    formData.append('file', imageFile);
    
    const response = await api.post('/disease-scanner/scan', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getScanHistory: async () => {
    const response = await api.get('/disease-scanner/history');
    return response.data;
  },
};

export default aiService;