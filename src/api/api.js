import axios from 'axios';

export const getBaseURL = () => {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) {
      return `http://${host}:5050`;
    }
  }
  return 'https://textrack-backend.onrender.com';
};

const API = axios.create({ baseURL: `${getBaseURL()}/api` });

API.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem('textrack_user') || 'null');
  if (user?.token) config.headers.Authorization = `Bearer ${user.token}`;
  return config;
});

export const loginUser = (data) => API.post('/auth/login', data);
export const createUser = (data) => API.post('/auth/create-user', data);
export const getUsers = () => API.get('/auth/users');
export const deleteUser = (id) => API.delete(`/auth/users/${id}`);
export const toggleUser = (id) => API.patch(`/auth/users/${id}/toggle`);

export const getCategories = () => API.get('/categories');
export const createCategory = (data) => API.post('/categories', data);
export const deleteCategory = (id) => API.delete(`/categories/${id}`);

export const getProducts = (params) => API.get('/products', { params });
export const getProduct = (id) => API.get(`/products/${id}`);
export const createProduct = (formData) => API.post('/products', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const updateProduct = (id, formData) => API.put(`/products/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const deleteProduct = (id) => API.delete(`/products/${id}`);

export const getProductions = (params) => API.get('/production', { params });
export const getProductionStats = (params) => API.get('/production/stats', { params });
export const addProduction = (data) => API.post('/production', data);
export const updateProduction = (id, data) => API.put(`/production/${id}`, data);
export const deleteProduction = (id) => API.delete(`/production/${id}`);

export const getStockOuts = (params) => API.get('/stockout', { params });
export const getStockOutStats = (params) => API.get('/stockout/stats', { params });
export const addStockOut = (data) => API.post('/stockout', data);
export const deleteStockOut = (id) => API.delete(`/stockout/${id}`);

export default API;
