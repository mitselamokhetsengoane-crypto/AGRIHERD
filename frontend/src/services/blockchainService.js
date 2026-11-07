import api from './api';

const blockchainService = {
  getTransactions: async () => {
    const response = await api.get('/blockchain/transactions');
    return response.data;
  },
  verifyRecord: async (recordId) => {
    const response = await api.get(`/blockchain/verify/${recordId}`);
    return response.data;
  },
};

export default blockchainService;