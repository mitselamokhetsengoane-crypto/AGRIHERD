import api from './api';

const financeService = {
  getOverview: async () => {
    const response = await api.get('/finance/overview');
    return response.data;
  },
  getIncome: async () => {
    const response = await api.get('/finance/income');
    return response.data;
  },
  addIncome: async (data) => {
    const response = await api.post('/finance/income', data);
    return response.data;
  },
  getExpenses: async () => {
    const response = await api.get('/finance/expenses');
    return response.data;
  },
  addExpense: async (data) => {
    const response = await api.post('/finance/expenses', data);
    return response.data;
  },
  getTransactions: async () => {
    const response = await api.get('/finance/transactions');
    return response.data;
  },
  getReports: async (startDate, endDate) => {
    const params = {};
    if (startDate) params.start = startDate;
    if (endDate) params.end = endDate;
    const response = await api.get('/finance/reports', { params });
    return response.data;
  }
};

export default financeService;