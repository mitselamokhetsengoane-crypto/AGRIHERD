import api from './api';

const notificationService = {
  list: async (onlyUnread = false) => {
    const { data } = await api.get('/notifications/', {
      params: onlyUnread ? { only_unread: true } : {},
    });
    return data;
  },
  unreadCount: async () => {
    const { data } = await api.get('/notifications/unread-count');
    return data.count || 0;
  },
  markRead: async (id) => (await api.patch(`/notifications/${id}/read`)).data,
  markAllRead: async () => (await api.patch('/notifications/read-all')).data,
  getSettings: async () => (await api.get('/notifications/settings')).data,
  updateSettings: async (payload) => (await api.put('/notifications/settings', payload)).data,
};

export default notificationService;