import api from './api';

const livestockService = {
  getAllAnimals: async () => {
    const response = await api.get('/livestock/');
    return response.data;
  },
  getAnimalById: async (id) => {
    const response = await api.get(`/livestock/${id}`);
    return response.data;
  },
  createAnimal: async (data) => {
    const response = await api.post('/livestock/', data);
    return response.data;
  },
  updateAnimal: async (id, data) => {
    const response = await api.put(`/livestock/${id}`, data);
    return response.data;
  },
  deleteAnimal: async (id) => {
    const response = await api.delete(`/livestock/${id}`);
    return response.data;
  },
  getHealthRecords: async (animalId) => {
    const response = await api.get(`/livestock/${animalId}/health`);
    return response.data;
  },
  addHealthRecord: async (animalId, data) => {
    const response = await api.post(`/livestock/${animalId}/health`, data);
    return response.data;
  },
  getVaccinations: async (animalId) => {
    const response = await api.get(`/livestock/${animalId}/vaccinations`);
    return response.data;
  },
  addVaccination: async (animalId, data) => {
    const response = await api.post(`/livestock/${animalId}/vaccinations`, data);
    return response.data;
  },
  getFeedingRecords: async (animalId) => {
    const response = await api.get(`/livestock/${animalId}/feeding`);
    return response.data;
  },
  addFeedingRecord: async (animalId, data) => {
    const response = await api.post(`/livestock/${animalId}/feeding`, data);
    return response.data;
  },
  getBreedingRecords: async (animalId) => {
    const response = await api.get(`/livestock/${animalId}/breeding`);
    return response.data;
  },
  addBreedingRecord: async (animalId, data) => {
    const response = await api.post(`/livestock/${animalId}/breeding`, data);
    return response.data;
  }
};

export default livestockService;