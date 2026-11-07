import api from './api';

const securityService = {
  getAuditLogs: async () => {
    const response = await api.get('/security/audit-logs');
    return response.data;
  },

  getRoles: async () => {
    const response = await api.get('/security/roles');
    return response.data;
  },

  updatePermissions: async (roleId, permissions) => {
    const response = await api.put(`/security/roles/${roleId}`, { permissions });
    return response.data;
  },

  getUsers: async () => {
    const response = await api.get('/security/users');
    return response.data;
  },

  getFarms: async () => {
    const response = await api.get('/security/farms');
    return response.data;
  },

  updateUserRole: async (userId, role) => {
    const response = await api.put(`/security/users/${userId}/role`, { role });
    return response.data;
  },
};

export default securityService;