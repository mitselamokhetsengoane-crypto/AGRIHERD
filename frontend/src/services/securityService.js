import api from './api';

const securityService = {
  getOverview: async () => (await api.get('/security/overview')).data,
  getAuditLogs: async () => (await api.get('/security/audit-logs')).data,
  getRolePermissions: async () => (await api.get('/security/role-permissions')).data,
  updateRolePermission: async (id, permission) =>
    (await api.patch(`/security/role-permissions/${id}`, { permission })).data,
  getDataClassification: async () => (await api.get('/security/data-classification')).data,
  getSystemSettings: async () => (await api.get('/security/system-settings')).data,
  getSystemHealth: async () => (await api.get('/security/system-health')).data,
  updateSystemSetting: async (key, value) =>
    (await api.patch(`/security/system-settings/${key}`, { setting_value: value })).data,
  getFarms: async (params = {}) => {
    const response = await api.get('/security/farms', { params });
    return {
      ...response.data,
      items: response.data.items.map((farm) => ({
        id: farm.id,
        farmName: farm.farm_name,
        location: farm.location,
        ownerName: farm.owner_name,
        status: farm.status,
        registeredAt: farm.created_at,
        livestockCount: farm.livestock_count,
        cropCount: farm.crop_count,
      })),
    };
  },

  // User management now lives on the admin router (real endpoints)
  getUsers: async (params = {}) => (await api.get('/admin/users', { params })).data,
  updateUserStatus: async (userId, account_status) =>
    (await api.patch(`/admin/users/${userId}/status`, { account_status })).data,
  approveFarmer: async (userId) => (await api.patch(`/admin/users/${userId}/approve`)).data,

  // Kept for compatibility — no backend endpoint for role change yet
  updateUserRole: async (userId, role) => {
    throw new Error('Role changes are not supported. Contact a database administrator.');
  },

  // Admin monitoring
  getAdminAISummary: async () => (await api.get('/admin/ai/summary')).data,
  getAdminAIPredictions: async () => (await api.get('/admin/ai/predictions')).data,
  checkAdminAIService: async () => (await api.get('/ai/wake', { timeout: 70000 })).data,
  getAdminBlockchain: async () => (await api.get('/admin/blockchain/all')).data,
  verifyAdminBlockchainRecord: async (recordId) =>
    (await api.post(`/admin/blockchain/${encodeURIComponent(recordId)}/verify`)).data,
  getAdminAuditLogs: async () => (await api.get('/admin/audit-logs')).data,
};

export default securityService;