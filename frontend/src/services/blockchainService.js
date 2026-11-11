import api from './api';

const blockchainService = {
  getStatus: async () => (await api.get('/blockchain/status')).data,
  getTransactions: async () => (await api.get('/blockchain/transactions')).data,
  getBlocks: async () => (await api.get('/blockchain/blocks')).data,
  verifyRecord: async (recordId) => (await api.post(`/blockchain/verify/${recordId}`)).data,
  verifyChain: async () => (await api.get('/blockchain/verify')).data,
  registerHarvest: async (harvestId) => (await api.post(`/blockchain/register-harvest/${harvestId}`)).data,
};

export default blockchainService;