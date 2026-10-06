import axios from 'axios';

// Измени порт на порт твоего Node.js сервера (например, 5000 или 3000)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_URL,
});

export const fetchReports = (entityName, signal) => {
  const params = entityName ? { entityName } : {};
  return api.get('/reports', { params, signal });
};

export const createReport = (data) => api.post('/reports', data);
export const updateReport = (id, data) => api.put(`/reports/${id}`, data);
export const deleteReport = (id) => api.delete(`/reports/${id}`);

export default api;