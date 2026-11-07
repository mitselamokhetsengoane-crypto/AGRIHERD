import api from './api';

const taskService = {
  getAllTasks: async () => {
    const response = await api.get('/tasks');
    return response.data;
  },

  getUpcomingTasks: async () => {
    const response = await api.get('/tasks/upcoming');
    return response.data;
  },

  getTaskById: async (id) => {
    const response = await api.get(`/tasks/${id}`);
    return response.data;
  },

  createTask: async (taskData) => {
    const response = await api.post('/tasks', taskData);
    return response.data;
  },

  updateTask: async (id, taskData) => {
    const response = await api.put(`/tasks/${id}`, taskData);
    return response.data;
  },

  deleteTask: async (id) => {
    const response = await api.delete(`/tasks/${id}`);
    return response.data;
  },

  markComplete: async (id) => {
    const response = await api.patch(`/tasks/${id}/complete`);
    return response.data;
  },
};

export default taskService;